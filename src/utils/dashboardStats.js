/**
 * Dashboard Statistics Utility Functions
 * Processes test data to generate analytics and insights
 */

/**
 * Calculate overall statistics from all tests
 * @param {array} tests - Array of test results
 * @returns {object} Overall statistics
 */
export const calculateOverallStats = (tests) => {
  if (!tests || tests.length === 0) {
    return {
      totalTests: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      averageAccuracy: 0,
      highestScore: 0,
      lowestScore: 0,
      totalQuestionsAttempted: 0
    };
  }

  const totalTests = tests.length;
  const scores = tests.map(t => t.results.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / totalTests;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  
  const totalTimeSpent = tests.reduce((sum, t) => sum + t.results.timeTaken, 0);
  const totalQuestionsAttempted = tests.reduce((sum, t) => sum + t.results.attempted, 0);
  const totalCorrect = tests.reduce((sum, t) => sum + t.results.correct, 0);
  const averageAccuracy = totalQuestionsAttempted > 0 
    ? (totalCorrect / totalQuestionsAttempted) * 100 
    : 0;

  return {
    totalTests,
    averageScore: Math.round(averageScore * 100) / 100,
    totalTimeSpent,
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    highestScore: Math.round(highestScore * 100) / 100,
    lowestScore: Math.round(lowestScore * 100) / 100,
    totalQuestionsAttempted
  };
};

/**
 * Calculate subject-wise performance
 * @param {array} tests - Array of test results
 * @returns {object} Subject-wise statistics
 */
export const calculateSubjectWiseStats = (tests) => {
  const subjectStats = {};

  tests.forEach(test => {
    const subject = test.testConfig.subject;
    
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        testsTaken: 0,
        totalScore: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalUnattempted: 0,
        averageScore: 0,
        accuracy: 0
      };
    }

    subjectStats[subject].testsTaken++;
    subjectStats[subject].totalScore += test.results.score;
    subjectStats[subject].totalQuestions += test.results.totalQuestions;
    subjectStats[subject].totalCorrect += test.results.correct;
    subjectStats[subject].totalIncorrect += test.results.incorrect;
    subjectStats[subject].totalUnattempted += test.results.unattempted;
  });

  // Calculate averages
  Object.keys(subjectStats).forEach(subject => {
    const stats = subjectStats[subject];
    stats.averageScore = Math.round((stats.totalScore / stats.testsTaken) * 100) / 100;
    stats.accuracy = stats.totalQuestions > 0 
      ? Math.round((stats.totalCorrect / (stats.totalQuestions - stats.totalUnattempted)) * 10000) / 100
      : 0;
  });

  return subjectStats;
};

/**
 * Calculate chapter-wise performance
 * @param {array} tests - Array of test results
 * @returns {array} Chapter performance data
 */
export const calculateChapterWiseStats = (tests) => {
  const chapterStats = {};

  tests.forEach(test => {
    if (test.questionResults) {
      test.questionResults.forEach(qResult => {
        const chapter = qResult.chapter;
        
        if (!chapterStats[chapter]) {
          chapterStats[chapter] = {
            chapter: chapter,
            totalQuestions: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0
          };
        }

        chapterStats[chapter].totalQuestions++;
        if (qResult.isCorrect) {
          chapterStats[chapter].correct++;
        } else if (qResult.userAnswer) {
          chapterStats[chapter].incorrect++;
        }
      });
    }
  });

  // Calculate accuracy and convert to array
  const chapterArray = Object.values(chapterStats).map(chapter => {
    const attempted = chapter.correct + chapter.incorrect;
    chapter.accuracy = attempted > 0 
      ? Math.round((chapter.correct / attempted) * 10000) / 100 
      : 0;
    return chapter;
  });

  // Sort by accuracy (lowest first - these are weak areas)
  return chapterArray.sort((a, b) => a.accuracy - b.accuracy);
};

/**
 * Identify weak chapters (accuracy < 60%)
 * @param {array} chapterStats - Chapter-wise statistics
 * @returns {array} Weak chapters
 */
export const identifyWeakChapters = (chapterStats) => {
  return chapterStats
    .filter(chapter => chapter.accuracy < 60 && chapter.totalQuestions >= 3)
    .slice(0, 5); // Top 5 weak chapters
};

/**
 * Identify strong chapters (accuracy > 80%)
 * @param {array} chapterStats - Chapter-wise statistics
 * @returns {array} Strong chapters
 */
export const identifyStrongChapters = (chapterStats) => {
  return chapterStats
    .filter(chapter => chapter.accuracy > 80 && chapter.totalQuestions >= 3)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5); // Top 5 strong chapters
};

/**
 * Calculate performance trend over time
 * @param {array} tests - Array of test results (should be sorted by timestamp)
 * @returns {array} Trend data for charting
 */
export const calculatePerformanceTrend = (tests) => {
  if (!tests || tests.length === 0) return [];

  return tests.slice(-10).map((test, index) => {
    const date = test.timestamp?.toDate ? test.timestamp.toDate() : new Date(test.timestamp);
    return {
      testNumber: index + 1,
      score: test.results.score,
      accuracy: test.results.attempted > 0 
        ? Math.round((test.results.correct / test.results.attempted) * 10000) / 100 
        : 0,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date
    };
  });
};

/**
 * Generate study recommendations based on performance
 * @param {array} weakChapters - Weak chapters data
 * @param {object} subjectStats - Subject-wise statistics
 * @param {object} overallStats - Overall statistics
 * @returns {array} Recommendations
 */
export const generateRecommendations = (weakChapters, subjectStats, overallStats) => {
  const recommendations = [];

  // Weak chapters recommendations
  if (weakChapters.length > 0) {
    recommendations.push({
      type: 'weak_chapters',
      priority: 'high',
      title: 'Focus on Weak Chapters',
      description: `You need improvement in: ${weakChapters.map(c => c.chapter).join(', ')}`,
      action: 'Practice these chapters with easy to medium difficulty questions'
    });
  }

  // Subject recommendations
  const subjects = Object.entries(subjectStats);
  const weakestSubject = subjects.reduce((min, [subject, stats]) => 
    stats.averageScore < (min.stats?.averageScore || Infinity) ? { subject, stats } : min
  , {});

  if (weakestSubject.subject && weakestSubject.stats.averageScore < 70) {
    recommendations.push({
      type: 'subject_focus',
      priority: 'medium',
      title: `Improve ${weakestSubject.subject}`,
      description: `Your average score in ${weakestSubject.subject} is ${weakestSubject.stats.averageScore}%`,
      action: `Take more ${weakestSubject.subject} tests and focus on fundamentals`
    });
  }

  // Time management
  const avgTimePerQuestion = overallStats.totalQuestionsAttempted > 0
    ? overallStats.totalTimeSpent / overallStats.totalQuestionsAttempted
    : 0;

  if (avgTimePerQuestion > 90) { // More than 1.5 minutes per question
    recommendations.push({
      type: 'time_management',
      priority: 'medium',
      title: 'Work on Speed',
      description: 'You\'re taking too much time per question',
      action: 'Practice timed quizzes with shorter durations to improve speed'
    });
  }

  // Accuracy vs Speed
  if (overallStats.averageAccuracy < 70) {
    recommendations.push({
      type: 'accuracy',
      priority: 'high',
      title: 'Focus on Accuracy',
      description: `Your accuracy is ${overallStats.averageAccuracy}%`,
      action: 'Review incorrect answers and understand concepts thoroughly'
    });
  }

  // Practice consistency
  if (overallStats.totalTests < 5) {
    recommendations.push({
      type: 'consistency',
      priority: 'low',
      title: 'Practice More Tests',
      description: 'Take more tests to build confidence and identify patterns',
      action: 'Aim for at least 2-3 tests per week'
    });
  }

  return recommendations;
};

/**
 * Format time in seconds to readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Get difficulty-wise performance
 * @param {array} tests - Array of test results
 * @returns {object} Difficulty-wise statistics
 */
export const calculateDifficultyWiseStats = (tests) => {
  const difficultyStats = {
    easy: { total: 0, correct: 0, incorrect: 0, accuracy: 0 },
    medium: { total: 0, correct: 0, incorrect: 0, accuracy: 0 },
    hard: { total: 0, correct: 0, incorrect: 0, accuracy: 0 }
  };

  tests.forEach(test => {
    if (test.questionResults) {
      test.questionResults.forEach(qResult => {
        const difficulty = qResult.difficulty?.toLowerCase() || 'medium';
        if (difficultyStats[difficulty]) {
          difficultyStats[difficulty].total++;
          if (qResult.isCorrect) {
            difficultyStats[difficulty].correct++;
          } else if (qResult.userAnswer) {
            difficultyStats[difficulty].incorrect++;
          }
        }
      });
    }
  });

  // Calculate accuracy
  Object.keys(difficultyStats).forEach(diff => {
    const stats = difficultyStats[diff];
    const attempted = stats.correct + stats.incorrect;
    stats.accuracy = attempted > 0 
      ? Math.round((stats.correct / attempted) * 10000) / 100 
      : 0;
  });

  return difficultyStats;
};
