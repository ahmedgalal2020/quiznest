"use client";

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaArrowLeft, FaArrowRight, FaVolumeUp, FaStar, FaRegStar, 
  FaEdit, FaShare, FaBookmark, FaRedo, FaPlay 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// تعريف أوضاع الدراسة
const STUDY_MODES = {
  CARDS: 'cards',
  LEARN: 'learn',
  WRITE: 'write',
  TEST: 'test'
};

// دالة للكشف عن وجود أحرف عربية
const containsArabic = (text) => /[\u0600-\u06FF]/.test(text);

// مكون لعرض البطاقة
function Flashcard({ card, isFlipped, onFlip, onMaster, isMastered }) {
  const text = isFlipped ? card?.answer : card?.question;
  const textStyle = containsArabic(text) && isFlipped 
    ? { transform: 'rotateY(180deg)', direction: 'rtl' } 
    : { direction: containsArabic(text) ? 'rtl' : 'ltr' };

  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('التحدث غير مدعوم في هذا المتصفح.');
    }
  }, []);

  return (
    <motion.div
      initial={{ rotateY: isFlipped ? 180 : 0, opacity: 0 }}
      animate={{ rotateY: isFlipped ? 180 : 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 
                 flex items-center justify-center text-center cursor-pointer transform"
      onClick={onFlip}
    >
      <div className="text-2xl font-semibold text-gray-900 dark:text-white" style={textStyle}>
        {text}
      </div>
      <div className="absolute bottom-4 right-4 flex gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            speakText(text);
          }}
          className="text-gray-500 hover:text-blue-500"
        >
          <FaVolumeUp size={24} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMaster();
          }}
          className="text-yellow-500 hover:text-yellow-600"
        >
          {isMastered ? <FaStar size={24} /> : <FaRegStar size={24} />}
        </button>
      </div>
    </motion.div>
  );
}

// مكون وضع التعلم
function LearnMode({ card, onNext, isMastered, onMaster }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidence, setConfidence] = useState(null);
  
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleConfidenceSelect = (level) => {
    setConfidence(level);
    // يمكن تنفيذ منطق لتتبع مستوى الثقة هنا
    if (level === 'high') {
      onMaster(); // إتقان البطاقة إذا كان مستوى الثقة عالي
    }
    
    // الانتقال للبطاقة التالية بعد اختيار مستوى الثقة
    setTimeout(() => {
      setShowAnswer(false);
      setConfidence(null);
      onNext();
    }, 500);
  };
  
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
          {card?.question}
        </div>
      </div>
      
      {!showAnswer ? (
        <button 
          onClick={handleShowAnswer}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-4"
        >
          عرض الإجابة
        </button>
      ) : (
        <div className="mt-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
            <div className="text-xl font-medium text-gray-900 dark:text-white">
              {card?.answer}
            </div>
          </div>
          
          <div className="text-center mb-2">كيف كان مستوى ثقتك بالإجابة؟</div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleConfidenceSelect('low')}
              className="py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              منخفض
            </button>
            <button 
              onClick={() => handleConfidenceSelect('medium')}
              className="py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
            >
              متوسط
            </button>
            <button 
              onClick={() => handleConfidenceSelect('high')}
              className="py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              عالي
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        {isMastered ? (
          <span className="text-green-500 flex items-center">
            <FaStar className="mr-1" /> تم إتقانها
          </span>
        ) : null}
      </div>
    </div>
  );
}

// مكون وضع الكتابة
function WriteMode({ card, onNext, isMastered, onMaster }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    // تحقق بسيط من الإجابة (يمكن تحسينه لاحقًا)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = card?.answer.trim().toLowerCase();
    
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      onMaster(); // إتقان البطاقة إذا كانت الإجابة صحيحة
    }
  };
  
  const handleNext = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
    onNext();
  };
  
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col">
      <div className="flex-1">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
          {card?.question}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
            disabled={isSubmitted}
          />
          
          {!isSubmitted ? (
            <button 
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-4"
            >
              تحقق
            </button>
          ) : (
            <div className="mt-4">
              <div className={`p-4 ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-lg mb-4`}>
                <div className="font-medium">
                  {isCorrect ? 'إجابة صحيحة!' : 'إجابة غير صحيحة'}
                </div>
                {!isCorrect && (
                  <div className="mt-2">
                    <div className="font-medium">الإجابة الصحيحة:</div>
                    <div>{card?.answer}</div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleNext}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                التالي
              </button>
            </div>
          )}
        </form>
      </div>
      
      <div className="mt-4 flex justify-end">
        {isMastered ? (
          <span className="text-green-500 flex items-center">
            <FaStar className="mr-1" /> تم إتقانها
          </span>
        ) : null}
      </div>
    </div>
  );
}

// مكون وضع الاختبار
function TestMode({ cards, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(cards.length).fill(null));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  
  // Generate options for each question (including the correct answer and 3 distractors)
  const [options, setOptions] = useState([]);
  
  useEffect(() => {
    // Generate options for all questions
    const allOptions = cards.map((currentCard, idx) => {
      // Start with the correct answer
      const correctAnswer = currentCard.answer;
      
      // Get 3 other random answers from other cards
      const otherAnswers = cards
        .filter((card, i) => i !== idx && card.answer !== correctAnswer)
        .map(card => card.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      // Combine and shuffle
      const questionOptions = [correctAnswer, ...otherAnswers]
        .sort(() => Math.random() - 0.5);
      
      return questionOptions;
    });
    
    setOptions(allOptions);
  }, [cards]);
  
  const handleAnswerSelect = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < cards.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmit = () => {
    // Calculate results
    const correctAnswers = cards.map((card, index) => {
      return userAnswers[index] === card.answer;
    });
    
    const score = correctAnswers.filter(Boolean).length;
    const percentage = Math.round((score / cards.length) * 100);
    
    setResults({
      score,
      total: cards.length,
      percentage,
      correctAnswers
    });
    
    setIsSubmitted(true);
    
    // Notify parent component
    if (onComplete) {
      onComplete({
        score,
        total: cards.length,
        percentage,
        correctAnswers
      });
    }
  };
  
  const currentCard = cards[currentQuestionIndex];
  const currentOptions = options[currentQuestionIndex] || [];
  
  if (isSubmitted) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-6">نتائج الاختبار</h2>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-2">{results.percentage}%</div>
          <div className="text-lg">
            {results.score} من {results.total} إجابات صحيحة
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${results.correctAnswers[index] ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
              >
                <div className="font-medium mb-2">{card.question}</div>
                <div className="flex flex-col space-y-1">
                  <div>
                    <span className="font-medium">إجابتك: </span>
                    {userAnswers[index] || '(لم تجب)'}
                  </div>
                  {!results.correctAnswers[index] && (
                    <div>
                      <span className="font-medium">الإجابة الصحيحة: </span>
                      {card.answer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-6"
        >
          إعادة الاختبار
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium">
          السؤال {currentQuestionIndex + 1} من {cards.length}
        </div>
        <div className="text-sm text-gray-500">
          {userAnswers.filter(Boolean).length} من {cards.length} تم الإجابة عليها
        </div>
      </div>
      
      <div className="flex-1">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {currentCard?.question}
        </div>
        
        <div className="space-y-3">
          {currentOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                userAnswers[currentQuestionIndex] === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-lg ${currentQuestionIndex === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
        >
          السابق
        </button>
        
        {currentQuestionIndex < cards.length - 1 ? (
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            التالي
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            إنهاء الاختبار
          </button>
        )}
      </div>
    </div>
  );
}

// مكون لأزرار التنقل
function NavigationControls({ onPrevious, onNext, currentIndex, totalCards }) {
  return (
    <div className="flex justify-between items-center mt-6">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                   text-gray-700 dark:text-gray-300 disabled:opacity-50
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <FaArrowLeft className="inline-block mr-2" />
        السابق
      </button>
      <div className="text-gray-600 dark:text-gray-400">
        {currentIndex + 1} / {totalCards}
      </div>
      <button
        onClick={onNext}
        disabled={currentIndex === totalCards - 1}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg
                   text-gray-700 dark:text-gray-300 disabled:opacity-50
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        التالي
        <FaArrowRight className="inline-block ml-2" />
      </button>
    </div>
  );
}

// المكون الرئيسي
export default function SetView({ params }) {
  // استخدام hook "use" لفك الـ Promise الخاص بـ params
  const { id } = use(params);
  const router = useRouter();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(STUDY_MODES.CARDS);
  const [mastered, setMastered] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // تعريف الدوال قبل استخدامها في useEffect
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => 
      set?.flashcards && prev < set.flashcards.length - 1 ? prev + 1 : prev
    );
  }, [set]);

  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleMaster = useCallback(async () => {
    // Update local state
    setMastered((prev) => {
      const newMastered = [...prev];
      newMastered[currentCardIndex] = !newMastered[currentCardIndex];
      return newMastered;
    });

    // Save to database
    try {
      if (!set?.flashcards?.[currentCardIndex]) return;
      
      const currentCard = set.flashcards[currentCardIndex];
      const isBookmarked = !mastered[currentCardIndex]; // The new value after toggle
      
      // Create a copy of the current set data
      const updatedSet = { ...set };
      
      // Update the isBookmarked property for the current flashcard
      updatedSet.flashcards = updatedSet.flashcards.map((card, index) => {
        if (index === currentCardIndex) {
          return { ...card, isBookmarked };
        }
        return card;
      });
      
      // Send the update to the server
      const response = await fetch(`/api/sets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: updatedSet.title,
          description: updatedSet.description,
          isPublic: updatedSet.isPublic,
          folderId: updatedSet.folderId,
          flashcards: updatedSet.flashcards
        })
      });

      if (!response.ok) {
        console.error('Failed to update mastery status');
      } else {
        console.log('Successfully updated mastery status');
      }
    } catch (error) {
      console.error('Error updating mastery status:', error);
    }
  }, [currentCardIndex, set, mastered, id]);

  const handleShuffle = useCallback(() => {
    if (set?.flashcards) {
      const shuffled = [...set.flashcards].sort(() => Math.random() - 0.5);
      setSet({ ...set, flashcards: shuffled });
      setCurrentCardIndex(0);
      setIsShuffled((prev) => !prev);
    }
  }, [set]);

  // إضافة مستمع لضغطات المفاتيح للتنقل بين البطاقات
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case ' ':
          e.preventDefault();
          handleFlip();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, handleFlip]);

  // جلب بيانات المجموعة
  useEffect(() => {
    const fetchSet = async () => {
      try {
        const response = await fetch(`/api/sets/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('فشل في جلب المجموعة');

        const data = await response.json();
        setSet(data);
        setMastered(new Array(data.flashcards.length).fill(false));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [id]);

  // حالات التحميل والخطأ
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">خطأ: {error}</div>
      </div>
    );
  }

  if (!set?.flashcards?.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">لم يتم العثور على بطاقات في هذه المجموعة.</div>
      </div>
    );
  }

  const currentCard = set.flashcards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* قسم العنوان */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {set.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {set.description || 'لا يوجد وصف متاح'}
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push(`/sets/${id}/edit`)}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-500"
                aria-label="Edit set"
              >
                <FaEdit size={20} />
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                <FaShare size={20} />
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                <FaBookmark size={20} />
              </button>
            </div>
          </div>

          {/* تبويبات أوضاع الدراسة */}
          <div className="flex gap-4 mb-6">
            {Object.values(STUDY_MODES).map((mode) => (
              <button
                key={mode}
                onClick={() => setStudyMode(mode)}
                className={`px-4 py-2 rounded-lg ${
                  studyMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* شريط التقدم */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentCardIndex / (set.flashcards.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* قسم البطاقة */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative h-[400px]">
          <AnimatePresence mode="wait">
            {studyMode === STUDY_MODES.CARDS && (
              <Flashcard
                key={currentCardIndex + (isFlipped ? '-flipped' : '')}
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                onMaster={handleMaster}
                isMastered={mastered[currentCardIndex]}
              />
            )}
            
            {studyMode === STUDY_MODES.LEARN && (
              <LearnMode
                key={currentCardIndex + '-learn'}
                card={currentCard}
                onNext={handleNext}
                isMastered={mastered[currentCardIndex]}
                onMaster={handleMaster}
              />
            )}
            
            {studyMode === STUDY_MODES.WRITE && (
              <WriteMode
                key={currentCardIndex + '-write'}
                card={currentCard}
                onNext={handleNext}
                isMastered={mastered[currentCardIndex]}
                onMaster={handleMaster}
              />
            )}
            
            {studyMode === STUDY_MODES.TEST && (
              <TestMode
                key="test-mode"
                cards={set.flashcards}
                onComplete={(results) => {
                  // يمكن تنفيذ منطق لحفظ نتائج الاختبار هنا
                  console.log('Test completed with results:', results);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* أزرار التنقل - تظهر فقط في وضع البطاقات */}
      {studyMode === STUDY_MODES.CARDS && (
        <div className="max-w-4xl mx-auto">
          <NavigationControls
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentIndex={currentCardIndex}
            totalCards={set.flashcards.length}
          />
        </div>
      )}
      
      {/* أزرار الإجراءات */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaPlay />
            ابدأ من جديد
          </button>
          <button
            onClick={handleShuffle}
            className="px-6 py-3 bg-green-500 text-white rounded-lg
                       hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <FaRedo />
            {isShuffled ? 'إلغاء الخلط' : 'خلط'}
          </button>
        </div>
      </div>
    </div>
  );
}
