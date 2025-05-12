import { useEffect, useState } from 'react';
import questionsData from '../data/questions.json';
import { useNavigate } from 'react-router-dom';
import Calculator from '../components/Calculator';

const TestScreen = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 min
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  // Add new states for marked questions and submission summary
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [IsFullScreen, setIsFullScreen] = useState(false);
  // Add a new state variable to track if auto-submit is triggered by cheating
  const [isCheatDetected, setIsCheatDetected] = useState(false);
  // Add a new state to control calculator visibility
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    // Get test configuration from localStorage
    try {
      const configData = localStorage.getItem('testConfig');
      if (configData) {
        const config = JSON.parse(configData);
        
        // Set timer based on configuration
        if (config.testDuration) {
          setTimeLeft(config.testDuration);
        }
        
        // Filter questions based on subject, difficulty, etc.
        const filteredQuestions = questionsData.chemistry_questions.filter(q => 
          (!config.difficulty || q.difficulty.toLowerCase() === config.difficulty.toLowerCase()) &&
          (config.selectedTopics.length === 0 || config.selectedTopics.includes(q.chapter))
        );
        
        if (filteredQuestions.length > 0) {
          setQuestions(filteredQuestions);
        } else {
          // Fallback to all questions if filtering returns empty
          setQuestions(questionsData.chemistry_questions);
        }
      }
    } catch (error) {
      console.error("Error loading test configuration:", error);
      // Fallback to default
      setQuestions(questionsData.chemistry_questions);
    }

    // Load saved answers and marked questions from localStorage
    try {
      const savedAnswers = localStorage.getItem('testAnswers');
      if (savedAnswers) {
        setSelectedAnswers(JSON.parse(savedAnswers));
      }

      const savedMarked = localStorage.getItem('markedQuestions');
      if (savedMarked) {
        setMarkedQuestions(JSON.parse(savedMarked));
      }
    } catch (error) {
      console.error("Error loading saved responses:", error);
    }

    // Prompt for full screen
    requestFullScreen();
    
    // Add anti-copy paste functionality
    const preventCopyPaste = (e) => {
      e.preventDefault();
      alert("Copy and paste functions are disabled during the test.");
      return false;
    };
    
    // Prevent context menu (right-click)
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Add event listeners to prevent copying, cutting, pasting
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Add CSS to prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      
      // Reset CSS
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired(); // Call a new function for time expiration
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add this new function to handle time expiration
  const handleTimeExpired = () => {
    setShowSubmitSummary(true);
    
    // Show a time expired message (optional)
    alert("Time has expired! Your test will be automatically submitted.");
    
    // Give the user a few seconds to see the summary before auto-submitting
    setTimeout(() => {
      handleFinalSubmit();
    }, 5000); // 5 seconds delay
  };

  // Anti-cheating: Detect tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        // Show warning if user switches tabs
        if (document.hidden) {
          alert("Warning: Switching tabs during the test is recorded. Excessive switching may be flagged.");
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Modify the tab switch count effect
  useEffect(() => {
    if (tabSwitchCount >= 5) {
      // No alert - instead show warning in the summary modal
      setIsCheatDetected(true);
      setShowSubmitSummary(true);
      
      // Auto submit after 10 seconds
      setTimeout(() => {
        handleFinalSubmit();
      }, 10000); // 10 seconds delay
    }
  }, [tabSwitchCount]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('testAnswers', JSON.stringify(selectedAnswers));
  }, [selectedAnswers]);

  // Save marked questions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  }, [markedQuestions]);

  const requestFullScreen = () => {
    if (!document.fullscreenElement) {
      if (confirm('For better test experience, would you like to enter full-screen mode?')) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        setIsFullScreen(true);
      }
    }
  };

  const handleOptionSelect = (index, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [index]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleJumpTo = (index) => {
    setCurrentQuestionIndex(index);
  };

  const toggleMarkQuestion = () => {
    if (markedQuestions.includes(currentQuestionIndex)) {
      setMarkedQuestions(prev => prev.filter(idx => idx !== currentQuestionIndex));
    } else {
      setMarkedQuestions(prev => [...prev, currentQuestionIndex]);
    }
  };

  const isQuestionMarked = (index) => {
    return markedQuestions.includes(index);
  };

  // Handle submit button click to show summary first
  const handleShowSubmitSummary = () => {
    setShowSubmitSummary(true);
  };

  // Final submit after confirmation
  const handleFinalSubmit = () => {
    // Clear local storage of test data
    localStorage.removeItem('testAnswers');
    localStorage.removeItem('markedQuestions');
    
    // Navigate to results or home
    navigate('/');
  };

  // Cancel submission and continue test
  const handleCancelSubmit = () => {
    setShowSubmitSummary(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const total = questions.length;
    const attempted = Object.keys(selectedAnswers).length;
    const marked = markedQuestions.length;
    const unattempted = total - attempted;
    
    return { total, attempted, unattempted, marked };
  };

  const toggleCalculator = () => {
    setShowCalculator(prev => !prev);
  };

  if (!questions.length) return <p className="text-center mt-10">Loading questions...</p>;

  const question = questions[currentQuestionIndex];

  // Generate the question button class based on its status
  const getQuestionButtonClass = (index) => {
    if (index === currentQuestionIndex) {
      return 'bg-blue-600 text-white';
    } else if (isQuestionMarked(index)) {
      return 'bg-purple-500 text-white'; // Purple for marked questions
    } else if (selectedAnswers[index]) {
      return 'bg-green-500 text-white'; // Green for answered
    } else {
      return 'bg-gray-200 dark:bg-gray-700'; // Default for unattempted
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      {/* Submit Summary Modal */}
      {showSubmitSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Test Summary</h2>
            
            {isCheatDetected && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                <p className="text-red-700 dark:text-red-400 font-medium">
                  Warning: You've switched tabs 5 times. This is considered cheating behavior.
                </p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                  Your test will be automatically submitted in 10 seconds.
                </p>
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span>Total Questions:</span>
                <span className="font-bold">{getSummaryStats().total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Attempted Questions:</span>
                <span className="font-bold text-green-600">{getSummaryStats().attempted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Unattempted Questions:</span>
                <span className="font-bold text-red-600">{getSummaryStats().unattempted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-600">{getSummaryStats().marked}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span>Time Remaining:</span>
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {!isCheatDetected 
                ? "Are you sure you want to submit your test? You won't be able to change your answers after submission."
                : "Your test will be submitted automatically due to suspicious activity."}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleFinalSubmit}
                className={`${isCheatDetected ? 'w-full' : 'w-1/2'} bg-green-600 text-white py-2 rounded-lg hover:bg-green-700`}
              >
                Submit Test
              </button>
              
              {!isCheatDetected && (
                <button 
                  onClick={handleCancelSubmit}
                  className="w-1/2 bg-gray-300 dark:bg-gray-700 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Continue Test
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Question Navigation Palette */}
        <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`w-10 h-10 rounded-full text-sm font-bold ${getQuestionButtonClass(i)}`}
                onClick={() => handleJumpTo(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-green-500 rounded-full"></span>
              <span className="text-sm">Attempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-gray-200 dark:bg-gray-700 rounded-full"></span>
              <span className="text-sm">Unattempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-purple-500 rounded-full"></span>
              <span className="text-sm">Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-blue-600 rounded-full"></span>
              <span className="text-sm">Current Question</span>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-red-500">
            Tab switches detected: {tabSwitchCount}
          </div>
        </div>

        {/* Right: Main Question Area */}
        <div className="w-full md:w-3/4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1}</h2>
            <span className="text-lg font-mono bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">
              {formatTime(timeLeft)}
            </span>
          </div>

          <p className="mb-4">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <label key={i} className="block bg-gray-100 dark:bg-gray-700 p-2 rounded cursor-pointer">
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={opt}
                  checked={selectedAnswers[currentQuestionIndex] === opt}
                  onChange={() => handleOptionSelect(currentQuestionIndex, opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-between mt-6 gap-2">
            <button 
              onClick={handlePrev} 
              disabled={currentQuestionIndex === 0} 
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={toggleMarkQuestion}
              className={`px-4 py-2 ${
                isQuestionMarked(currentQuestionIndex)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600'
              } rounded`}
            >
              {isQuestionMarked(currentQuestionIndex) ? 'Unmark for Review' : 'Mark for Review'}
            </button>
            
            <button 
              onClick={handleNext} 
              disabled={currentQuestionIndex === questions.length - 1} 
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <button 
            onClick={handleShowSubmitSummary} 
            className="w-full mt-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Test
          </button>

          {/* Toggle Calculator Button */}
          <button
            onClick={toggleCalculator}
            className="w-full mt-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 2h8v12H6V4zm2 3a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 110-2h1V7a1 1 0 011-1zm4 7a1 1 0 100-2 1 1 0 000 2zm2-3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {showCalculator ? 'Hide Calculator' : 'Show Calculator'}
          </button>

          {/* Calculator Component */}
          {showCalculator && <Calculator onClose={toggleCalculator} />}
        </div>
      </div>
    </div>
  );
};

export default TestScreen;