import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import questionsData from "../data/questions.json";
import Calculator from "../components/Calculator";
import { useAuth } from "../context/AuthContext";
import { saveTestResult } from "../services/firestoreService";

const TestScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(900);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [isCheatDetected, setIsCheatDetected] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [testConfig, setTestConfig] = useState({});
  const [initialTime, setInitialTime] = useState(900);

  // Define handleFinalSubmit function first so it can be used in useEffect hooks
  const handleFinalSubmit = useCallback(async () => {
    // Calculate test results
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const questionResults = [];

    questions.forEach((q, index) => {
      const userAnswer = selectedAnswers[index];
      const isCorrect = userAnswer === q.answer;
      
      if (!userAnswer) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }

      questionResults.push({
        questionId: `q${index}`,
        chapter: q.chapter,
        difficulty: q.difficulty,
        question: q.question,
        userAnswer: userAnswer || null,
        correctAnswer: q.answer,
        isCorrect: isCorrect,
        wasMarked: markedQuestions.includes(index)
      });
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const timeTaken = initialTime - timeLeft;

    // Prepare test data
    const testData = {
      testConfig: {
        subject: testConfig.subject || 'Chemistry',
        scope: testConfig.scope || 'complete',
        chapters: testConfig.selectedTopics || [],
        difficulty: testConfig.difficulty || 'All',
        duration: initialTime
      },
      results: {
        totalQuestions: questions.length,
        attempted: Object.keys(selectedAnswers).length,
        correct: correct,
        incorrect: incorrect,
        unattempted: unattempted,
        marked: markedQuestions.length,
        score: Math.round(score * 100) / 100,
        timeTaken: timeTaken,
        timeLeft: timeLeft
      },
      questionResults: questionResults,
      antiCheatFlags: {
        tabSwitches: tabSwitchCount,
        fullscreenExits: 0
      }
    };

    // Save to Firestore
    try {
      if (currentUser) {
        await saveTestResult(currentUser.uid, testData);
        console.log('Test results saved successfully');
      }
    } catch (error) {
      console.error('Error saving test results:', error);
    }

    // Clean up and navigate
    localStorage.removeItem("testAnswers");
    localStorage.removeItem("markedQuestions");
    localStorage.removeItem("testConfig");
    navigate("/dashboard");
  }, [questions, selectedAnswers, markedQuestions, initialTime, timeLeft, testConfig, tabSwitchCount, currentUser, navigate]);

  useEffect(() => {
    const loadConfigAndQuestions = () => {
      try {
        const config = JSON.parse(localStorage.getItem("testConfig")) || {};
        setTestConfig(config);
        setTimeLeft(config.testDuration || 900);
        setInitialTime(config.testDuration || 900);

        const filtered = questionsData.chemistry_questions.filter(q =>
          (!config.difficulty || q.difficulty.toLowerCase() === config.difficulty.toLowerCase()) &&
          (config.selectedTopics?.length === 0 || config.selectedTopics.includes(q.chapter))
        );

        setQuestions(filtered.length ? filtered : questionsData.chemistry_questions);
      } catch {
        setQuestions(questionsData.chemistry_questions);
      }

      // Restore answers and marked questions
      setSelectedAnswers(JSON.parse(localStorage.getItem("testAnswers")) || {});
      setMarkedQuestions(JSON.parse(localStorage.getItem("markedQuestions")) || {});
    };

    const disableCheatActions = () => {
      const handler = e => {
        e.preventDefault();
        alert("Copy, paste, and right-click are disabled during the test.");
        return false;
      };

      document.addEventListener("copy", handler);
      document.addEventListener("cut", handler);
      document.addEventListener("paste", handler);
      document.addEventListener("contextmenu", handler);
      document.body.style.userSelect = "none";

      return () => {
        ["copy", "cut", "paste", "contextmenu"].forEach(event => document.removeEventListener(event, handler));
        document.body.style.userSelect = "";
      };
    };

    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        if (confirm("Enter fullscreen for better experience?")) {
          document.documentElement.requestFullscreen().catch(err => {
            console.warn('Fullscreen request failed:', err);
          });
        }
      }
    };

    loadConfigAndQuestions();
    enterFullscreen();
    const cleanup = disableCheatActions();
    return cleanup;
  }, []);

  // ⏰ Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Time has expired. Submitting your test.");
          setTimeout(() => {
            handleFinalSubmit();
          }, 3000);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinalSubmit]);

  // 🚨 Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(count => {
          const newCount = count + 1;
          if (newCount >= 5) {
            setIsCheatDetected(true);
            setShowSubmitSummary(true);
            setTimeout(() => {
              handleFinalSubmit();
            }, 10000);
          } else {
            alert("Warning: Tab switching is being recorded.");
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleFinalSubmit]);

  // 💾 Save state changes
  useEffect(() => {
    localStorage.setItem("testAnswers", JSON.stringify(selectedAnswers));
  }, [selectedAnswers]);

  useEffect(() => {
    localStorage.setItem("markedQuestions", JSON.stringify(markedQuestions));
  }, [markedQuestions]);

  const handleOptionSelect = (index, option) => {
    setSelectedAnswers(prev => ({ ...prev, [index]: option }));
  };

  const toggleMarkQuestion = () => {
    setMarkedQuestions(prev =>
      prev.includes(currentQuestionIndex)
        ? prev.filter(i => i !== currentQuestionIndex)
        : [...prev, currentQuestionIndex]
    );
  };

  const formatTime = secs =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  const getQuestionClass = index => {
    if (index === currentQuestionIndex) return "bg-blue-600 text-white";
    if (markedQuestions.includes(index)) return "bg-purple-500 text-white";
    if (selectedAnswers[index]) return "bg-green-500 text-white";
    return "bg-gray-200 dark:bg-gray-700";
  };

  const stats = {
    total: questions.length,
    attempted: Object.keys(selectedAnswers).length,
    marked: markedQuestions.length,
    unattempted: questions.length - Object.keys(selectedAnswers).length
  };

  const question = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">

      {/* 💬 Submit Summary Modal */}
      {showSubmitSummary && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Test Summary</h2>
            {isCheatDetected && (
              <div className="bg-red-100 dark:bg-red-900 text-red-600 p-3 rounded mb-4">
                Tab switches exceeded limit. Auto-submitting in 10 seconds.
              </div>
            )}
            {["Total", "Attempted", "Unattempted", "Marked for Review"].map((label, i) => (
              <div key={i} className="flex justify-between mb-1">
                <span>{label}</span>
                <span className="font-bold">
                  {label === "Total" && stats.total}
                  {label === "Attempted" && stats.attempted}
                  {label === "Unattempted" && stats.unattempted}
                  {label === "Marked for Review" && stats.marked}
                </span>
              </div>
            ))}
            <div className="flex justify-between mt-3 border-t pt-2">
              <span>Time Left:</span>
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>

            {!isCheatDetected && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to submit? You can’t change answers later.
              </p>
            )}

            <div className="mt-4 flex gap-4">
              <button 
                onClick={handleFinalSubmit} 
                className="bg-green-600 hover:bg-green-700 w-full text-white py-2 rounded font-semibold transition-colors duration-200"
              >
                Submit Test
              </button>
              {!isCheatDetected && (
                <button 
                  onClick={() => setShowSubmitSummary(false)} 
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 w-full py-2 rounded font-semibold transition-colors duration-200"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* 📘 Navigation Palette */}
        <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-bold mb-2">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQuestionIndex(i)}
                className={`w-10 h-10 rounded-full text-sm font-bold ${getQuestionClass(i)}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Legend color="green-500" label="Attempted" />
            <Legend color="gray-400" label="Unattempted" />
            <Legend color="purple-500" label="Marked" />
            <Legend color="blue-600" label="Current" />
          </div>
          <div className="mt-3 text-red-600 text-sm">
            Tab switches: {tabSwitchCount}
          </div>
        </div>

        {/* ❓ Question Panel */}
        <div className="w-full md:w-3/4 bg-white dark:bg-gray-800 p-6 rounded shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1}</h2>
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>

          <p className="mb-4">{question?.question}</p>
          <div className="space-y-2">
            {(question?.options || []).map((opt, i) => (
              <label key={i} className="block p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <input type="radio" className="mr-2"
                  checked={selectedAnswers[currentQuestionIndex] === opt || false}
                  onChange={() => handleOptionSelect(currentQuestionIndex, opt)} />
                {opt}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-between mt-6 gap-2">
            <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(i => i - 1)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Previous</button>
            <button onClick={toggleMarkQuestion}
              className={`px-4 py-2 rounded ${markedQuestions.includes(currentQuestionIndex)
                ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-600"}`}>
              {markedQuestions.includes(currentQuestionIndex) ? "Unmark" : "Mark for Review"}
            </button>
            <button disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex(i => i + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Next</button>
          </div>

          <button onClick={() => setShowSubmitSummary(true)}
            className="w-full mt-6 py-3 bg-green-600 text-white rounded">Submit Test</button>

          <button onClick={() => setShowCalculator(p => !p)}
            className="w-full mt-4 py-2 bg-indigo-600 text-white rounded">
            {showCalculator ? "Hide" : "Show"} Calculator
          </button>

          {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
        </div>
      </div>
    </div>
  );
};

// 🔁 Reusable legend for palette
const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={`w-4 h-4 bg-${color} inline-block rounded-full`}></span>
    <span>{label}</span>
  </div>
);

export default TestScreen;
