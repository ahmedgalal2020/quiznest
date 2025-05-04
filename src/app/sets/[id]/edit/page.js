"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-hot-toast";
import { FaTrash, FaStar, FaRegStar, FaPlus, FaFolder, FaFolderOpen } from "react-icons/fa";

export default function EditSetPage({ params }) {
  // Use React.use() to unwrap params
  const { id } = use(params);
  const [set, setSet] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: false,
    folderId: null,
    flashcards: []
  });
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchSet();
      fetchFolders();
    } else {
      router.push("/login");
    }
  }, [user, id]);

  const fetchSet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching set: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        throw new Error("Failed to parse response data. The server response was not valid JSON.");
      }

      if (!data || !data.flashcards) {
        throw new Error("Invalid data format received from server");
      }

      setSet(data);

      // Initialize form data with set data
      setFormData({
        title: data.title,
        description: data.description || "",
        isPublic: data.isPublic,
        folderId: data.folderId,
        flashcards: data.flashcards.map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          hint: card.hint || "",
          notes: card.notes || "",
          difficulty: card.difficulty || "MEDIUM",
          isBookmarked: card.isBookmarked || false
        }))
      });
    } catch (error) {
      console.error("Error fetching set:", error);
      toast.error(error.message || "Failed to load set");
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/folders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching folders: ${response.status}`);
      }

      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFolderChange = (folderId) => {
    setFormData(prev => ({
      ...prev,
      folderId: folderId === "none" ? null : parseInt(folderId)
    }));
    setShowFolderSelect(false);
  };

  const handleCardChange = (index, field, value) => {
    const updatedCards = [...formData.flashcards];
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      flashcards: updatedCards
    }));
  };

  const toggleBookmark = (index) => {
    const updatedCards = [...formData.flashcards];
    updatedCards[index] = {
      ...updatedCards[index],
      isBookmarked: !updatedCards[index].isBookmarked
    };
    setFormData(prev => ({
      ...prev,
      flashcards: updatedCards
    }));
  };

  const addCard = () => {
    setFormData(prev => ({
      ...prev,
      flashcards: [
        ...prev.flashcards,
        {
          question: "",
          answer: "",
          hint: "",
          notes: "",
          difficulty: "MEDIUM",
          isBookmarked: false
        }
      ]
    }));
  };

  const removeCard = (index) => {
    if (formData.flashcards.length <= 1) {
      toast.error("A set must have at least one card");
      return;
    }

    const updatedCards = [...formData.flashcards];
    updatedCards.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      flashcards: updatedCards
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (formData.flashcards.length === 0) {
      toast.error("At least one flashcard is required");
      return;
    }

    for (let i = 0; i < formData.flashcards.length; i++) {
      const card = formData.flashcards[i];
      if (!card.question.trim() || !card.answer.trim()) {
        toast.error(`Card ${i + 1} must have both question and answer`);
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/sets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || errorData.message || "Failed to update set");
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing success response:", jsonError);
        throw new Error("Failed to parse response data. The server response was not valid JSON.");
      }

      if (!data || !data.success) {
        throw new Error("Invalid response from server");
      }

      toast.success("Set updated successfully");
      router.push(`/sets/${id}`);
    } catch (error) {
      console.error("Error updating set:", error);
      toast.error(error.message || "Failed to update set");
    } finally {
      setSaving(false);
    }
  };

  const getFilteredCards = () => {
    if (activeTab === "bookmarked") {
      return formData.flashcards.filter(card => card.isBookmarked);
    }
    return formData.flashcards;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg">Please log in to edit sets</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/sets/${id}`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          &larr; Back to Set
        </Link>
        <h1 className="text-2xl font-bold text-black  dark:text-white">Edit Set</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="title" className="text-black  dark:text-white block text-sm font-medium mb-1 ">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border text-black  border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className=" text-black  dark:text-white block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 text-black  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="text-black  dark:text-white ml-2 block text-sm">
                  Public Set
                </label>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFolderSelect(!showFolderSelect)}
                  className="text-black flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  {formData.folderId ? <FaFolderOpen className="mr-2" /> : <FaFolder className="mr-2" />}
                  {formData.folderId
                    ? folders.find(f => f.id === formData.folderId)?.name || "Loading folder..."
                    : "Select Folder"}
                </button>

                {showFolderSelect && (
                  <div className="absolute z-10 mt-1 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                    <ul className="text-black  dark:text-white py-1 max-h-60 overflow-auto">
                      <li
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleFolderChange("none")}
                      >
                        No Folder
                      </li>
                      {folders.map(folder => (
                        <li
                          key={folder.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleFolderChange(folder.id)}
                        >
                          {folder.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold  text-black  dark:text-white">Flashcards</h2>
            <button
              type="button"
              onClick={addCard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <FaPlus className="mr-2" /> Add Card
            </button>
          </div>

          <div className="mb-4">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('all')}
              >
                All Cards ({formData.flashcards.length})
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'bookmarked' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('bookmarked')}
              >
                Bookmarked ({formData.flashcards.filter(card => card.isBookmarked).length})
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {getFilteredCards().map((card, index) => {
              // Find the original index in the full array
              const originalIndex = formData.flashcards.findIndex(c =>
                card.id ? c.id === card.id : c === card
              );

              // Generate a unique key using id if available, or a combination of index and content
              const uniqueKey = card.id ? `card-${card.id}` : `new-card-${originalIndex}-${index}`;

              return (
                <div key={uniqueKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-black  dark:text-white">Card {originalIndex + 1}</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(originalIndex)}
                        className={`text-yellow-500 hover:text-yellow-600`}
                      >
                        {card.isBookmarked ? <FaStar size={18} /> : <FaRegStar size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCard(originalIndex)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black  dark:text-white ">
                        Question *
                      </label>
                      <textarea
                        value={card.question}
                        onChange={(e) => handleCardChange(originalIndex, "question", e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-black  dark:text-white ">
                        Answer *
                      </label>
                      <textarea
                        value={card.answer}
                        onChange={(e) => handleCardChange(originalIndex, "answer", e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-black  dark:text-white ">
                        Hint
                      </label>
                      <input
                        type="text"
                        value={card.hint}
                        onChange={(e) => handleCardChange(originalIndex, "hint", e.target.value)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-black  dark:text-white ">
                        Difficulty
                      </label>
                      <select
                        value={card.difficulty}
                        onChange={(e) => handleCardChange(originalIndex, "difficulty", e.target.value)}
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1 text-black  dark:text-white ">
                      Notes
                    </label>
                    <textarea
                      value={card.notes}
                      onChange={(e) => handleCardChange(originalIndex, "notes", e.target.value)}
                      rows="2"
                      className="w-full px-3  py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    ></textarea>
                  </div>
                </div>
              );
            })}

            {getFilteredCards().length === 0 && (
              <div className="text-center py-8 text-black  dark:text-white">
                {activeTab === "bookmarked" ? (
                  <p>No bookmarked cards. Bookmark cards to focus on them during study sessions.</p>
                ) : (
                  <p>No cards in this set. Add some cards to get started.</p>
                )}
              </div>
            )}
          </div>

          {activeTab === "all" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={addCard}
                className="text-blue-600 hover:text-blue-800"
              >
                + Add another card
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href={`/sets/${id}`}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
