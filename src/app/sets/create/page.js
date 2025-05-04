"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { FaFolder, FaSave, FaPlus, FaTrash, FaLanguage, FaSpinner, FaTimes } from 'react-icons/fa';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

export default function CreateSet() {
  const router = useRouter();
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [setData, setSetData] = useState({
    title: '',
    description: '',
    folderId: '',
    sourceLang: 'en',
    targetLang: 'ar',
    isPublic: false
  });

  const [cards, setCards] = useState([
    { id: Date.now(), term: '', definition: '' }
  ]);

  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Fetch folders when component mounts
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch folders');
        const data = await response.json();
        setFolders(data);
      } catch (error) {
        console.error('Error fetching folders:', error);
        setError('Failed to load folders');
      }
    };

    if (user) {
      fetchFolders();
    }
  }, [user]);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (setData.title || cards.some(card => card.term || card.definition)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [setData, cards]);

  // Form validation
  const validateForm = () => {
    setError(null);

    if (!setData.title || setData.title.trim().length === 0) {
      setError('Please enter a title for your set');
      return false;
    }

    if (cards.length === 0) {
      setError('Please add at least one card');
      return false;
    }

    const emptyCards = cards.filter(
      card => !card.term.trim() || !card.definition.trim()
    );

    if (emptyCards.length > 0) {
      setError('Please fill in all cards');
      return false;
    }
    
    // Check if source and target languages are the same
    if (setData.sourceLang === setData.targetLang) {
      setError('Source and target languages must be different');
      return false;
    }
    
    // Check for duplicate cards
    const termSet = new Set();
    for (const card of cards) {
      const normalizedTerm = card.term.trim().toLowerCase();
      if (termSet.has(normalizedTerm)) {
        setError('Duplicate terms found. Please make all terms unique');
        return false;
      }
      termSet.add(normalizedTerm);
    }

    return true;
  };

  // Handle translation
  const handleTranslate = async (index, text, isDefinition = false) => {
    if (!text.trim()) return;
    
    // Skip translation if source and target languages are the same
    if (setData.sourceLang === setData.targetLang) return;
    
    // Skip if the other field already has content
    const currentCards = [...cards];
    if (isDefinition && currentCards[index].term.trim()) return;
    if (!isDefinition && currentCards[index].definition.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text,
          sourceLang: isDefinition ? setData.targetLang : setData.sourceLang,
          targetLang: isDefinition ? setData.sourceLang : setData.targetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Translation failed');
      }

      const data = await response.json();
      
      if (data.translation) {
        setCards(prevCards => {
          const newCards = [...prevCards];
          if (isDefinition) {
            newCards[index].term = data.translation;
          } else {
            newCards[index].definition = data.translation;
          }
          return newCards;
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError(`Translation failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle card operations
  const handleAddCard = () => {
    const newCard = {
      id: Date.now(),
      term: '',
      definition: ''
    };
    setCards(prev => [...prev, newCard]);
  };

  const handleDeleteCard = (index) => {
    if (cards.length > 1) {
      setCards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCardChange = (index, field, value) => {
    setCards(prev => {
      const newCards = [...prev];
      newCards[index][field] = value;
      return newCards;
    });
    if (error) setError(null);
  };

  // Handle bulk input
  const handleBulkInputProcess = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const newCards = lines.map((line, index) => {
      const [term, definition] = line.split('\t').map(item => item.trim());
      return {
        id: Date.now() + index,
        term: term || '',
        definition: definition || ''
      };
    });

    if (newCards.length > 0) {
      setCards(newCards);
      setShowBulkInput(false);
      setBulkInput('');
    }
  };

  // Handle set saving
  const handleSaveSet = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Check if user is authenticated
      if (!user) {
        setError('You must be logged in to create a set');
        setIsSubmitting(false);
        return;
      }

      // Ensure user has an ID
      const userId = user.id || user.userId;
      if (!userId) {
        console.warn('User object does not have an ID:', user);
        // For development, we'll create a mock user ID
        if (process.env.NODE_ENV === 'development') {
          console.log('Using development fallback user ID');
        } else {
          setError('User ID is missing. Please log in again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Check if token exists
      let token = localStorage.getItem('token');
      
      // For development only: create a mock token if none exists
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('No token found in localStorage, creating a development fallback token');
        // Create a simple mock token with the user ID
        const mockPayload = { userId: userId || 1 };
        
        // Use btoa for base64 encoding in browser environment
        const base64Payload = btoa(JSON.stringify(mockPayload));
        token = `mocktoken.${base64Payload}.signature`;
        localStorage.setItem('token', token);
        console.log('Created mock token:', token);
      }
      
      if (!token) {
        setError('Authentication token is missing. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const formData = {
        ...setData,
        title: setData.title.trim(),
        description: setData.description?.trim() || '',
        flashcards: cards.map(card => ({
          question: card.term.trim(),
          answer: card.definition.trim()
        }))
      };

      console.log('Sending data to API:', JSON.stringify(formData));

      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('API Response status:', response.status);
      
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : { message: 'Unknown error' };
      } catch (e) {
        console.error('Error parsing response:', e);
        responseData = { message: 'Failed to parse server response: ' + responseText.substring(0, 100) };
      }

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Failed to create set';
        const errorDetails = responseData.details ? `: ${responseData.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      // If we got here, the response was successful
      setSuccess(true);
      
      // Use a default ID if none is returned (for development)
      const setId = responseData.id || 'new';
      
      setTimeout(() => {
        router.push(`/sets/${setId}`);
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save set. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter set title"
              value={setData.title}
              onChange={(e) => {
                const value = e.target.value;
                setSetData(prev => ({
                  ...prev,
                  title: value
                }));
                if (error) setError(null);
              }}
              onBlur={() => {
                if (!setData.title.trim()) {
                  setError('Please enter a title for your set');
                }
              }}
              className={`w-full text-2xl font-bold bg-transparent border-b-2 
                ${error && !setData.title.trim() ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} 
                focus:border-blue-500 dark:focus:border-blue-400 outline-none`}
            />
            
            <textarea
              placeholder="Add a description (optional)"
              value={setData.description}
              onChange={(e) => setSetData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-20 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 resize-none"
            />

            <div className="flex flex-wrap gap-4">
              <select
                value={setData.folderId}
                onChange={(e) => {
                  setSetData(prev => ({ ...prev, folderId: e.target.value }));
                  if (error) setError(null);
                }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
              >
                <option value="">Select Folder (Optional)</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={setData.sourceLang}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Prevent source and target languages from being the same
                    if (newValue === setData.targetLang) {
                      // Find a different target language
                      const otherLangs = SUPPORTED_LANGUAGES.filter(lang => lang.code !== newValue);
                      if (otherLangs.length > 0) {
                        setSetData(prev => ({ 
                          ...prev, 
                          sourceLang: newValue,
                          targetLang: otherLangs[0].code
                        }));
                      }
                    } else {
                      setSetData(prev => ({ ...prev, sourceLang: newValue }));
                    }
                    if (error) setError(null);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <FaLanguage className="text-2xl text-gray-400" />
                <select
                  value={setData.targetLang}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Prevent source and target languages from being the same
                    if (newValue === setData.sourceLang) {
                      // Find a different source language
                      const otherLangs = SUPPORTED_LANGUAGES.filter(lang => lang.code !== newValue);
                      if (otherLangs.length > 0) {
                        setSetData(prev => ({ 
                          ...prev, 
                          targetLang: newValue,
                          sourceLang: otherLangs[0].code
                        }));
                      }
                    } else {
                      setSetData(prev => ({ ...prev, targetLang: newValue }));
                    }
                    if (error) setError(null);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Input Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowBulkInput(!showBulkInput)}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {showBulkInput ? 'Switch to Card View' : 'Import from Text'}
          </button>
        </div>

        {/* Bulk Input Section */}
        {showBulkInput ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <p className="text-sm text-gray-900 dark:text-gray-900 mb-2">
              Enter your terms and definitions, separated by tabs, one pair per line
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full h-64 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4"
              placeholder="term⇥definition&#10;term⇥definition"
            />
            <button
              onClick={handleBulkInputProcess}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Process
            </button>
          </div>
        ) : (
          /* Cards Section */
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex gap-4"
              >
                <div className="w-12 flex items-center justify-center text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter term"
                      value={card.term}
                      onChange={(e) => handleCardChange(index, 'term', e.target.value)}
                      onBlur={() => {
                        // Only translate if the term has content and definition is empty
                        if (card.term.trim() && !card.definition.trim()) {
                          handleTranslate(index, card.term);
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter definition"
                      value={card.definition}
                      onChange={(e) => handleCardChange(index, 'definition', e.target.value)}
                      onBlur={() => {
                        // Only translate if the definition has content and term is empty
                        if (card.definition.trim() && !card.term.trim()) {
                          handleTranslate(index, card.definition, true);
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteCard(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddCard}
              className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <FaPlus className="inline-block mr-2" />
              Add Card
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 animate-fade-in">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 animate-fade-in">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Success</p>
                <p>Set created successfully! Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSet}
            disabled={isSubmitting || loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin h-5 w-5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave className="h-5 w-5" />
                <span>Save Set</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}