import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getUserTestHistory, getAllUserTests } from '../services/firestoreService';
import {
  calculateOverallStats,
  calculateSubjectWiseStats,
  calculateChapterWiseStats,
  identifyWeakChapters,
  identifyStrongChapters,
  calculatePerformanceTrend,
  formatTime,
  calculateDifficultyWiseStats
} from '../utils/dashboardStats';
import { generateAIRecommendations, getAIServiceStatus } from '../services/geminiService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap,
  Trophy
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [recentTests, setRecentTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [subjectStats, setSubjectStats] = useState({});
  const [weakChapters, setWeakChapters] = useState([]);
  const [strongChapters, setStrongChapters] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [difficultyStats, setDifficultyStats] = useState({});
  const [recsLoading, setRecsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile and test history
        const [, recent, all] = await Promise.all([
          getUserProfile(currentUser.uid),
          getUserTestHistory(currentUser.uid, 5),
          getAllUserTests(currentUser.uid)
        ]);

        setRecentTests(recent);
        setAllTests(all);

        if (all && all.length > 0) {
          // Calculate all statistics
          const overall = calculateOverallStats(all);
          const subjects = calculateSubjectWiseStats(all);
          const chapters = calculateChapterWiseStats(all);
          const weak = identifyWeakChapters(chapters);
          const strong = identifyStrongChapters(chapters);
          const trend = calculatePerformanceTrend(all);
          const difficulty = calculateDifficultyWiseStats(all);

          setOverallStats(overall);
          setSubjectStats(subjects);
          setWeakChapters(weak);
          setStrongChapters(strong);
          setPerformanceTrend(trend);
          setDifficultyStats(difficulty);

          // Generate AI recommendations
          setRecsLoading(true);
          const status = getAIServiceStatus();
          setAiStatus(status);
          
          const analysisData = {
            overallStats: overall,
            subjectWiseStats: subjects,
            chapterWiseStats: chapters,
            weakChapters: weak,
            strongChapters: strong,
            performanceTrend: trend,
            difficultyStats: difficulty
          };

          const aiRecs = await generateAIRecommendations(analysisData);
          setRecommendations(aiRecs);
          setRecsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (!allTests || allTests.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}! 👋
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <div className="mb-6">
              <BookOpen className="w-20 h-20 mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Start Your Journey!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                You haven't taken any tests yet. Take your first test to see personalized analytics, 
                track your progress, and identify areas for improvement.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/test-selection')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold 
                       transition-colors duration-200 inline-flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Take Your First Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student'}!
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Total Tests"
            value={overallStats?.totalTests || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<Trophy className="w-8 h-8" />}
            title="Average Score"
            value={`${overallStats?.averageScore || 0}%`}
            color="bg-green-500"
          />
          <StatCard
            icon={<Target className="w-8 h-8" />}
            title="Accuracy"
            value={`${overallStats?.averageAccuracy || 0}%`}
            color="bg-purple-500"
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            title="Time Spent"
            value={formatTime(overallStats?.totalTimeSpent || 0)}
            color="bg-orange-500"
          />
        </div>

        {/* Performance Trend Chart */}
        {performanceTrend.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Performance Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} name="Score %" />
                <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} name="Accuracy %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subject-wise Performance & Difficulty Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance */}
          {Object.keys(subjectStats).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Subject-wise Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(subjectStats).map(([subject, stats]) => ({
                  subject,
                  score: stats.averageScore,
                  accuracy: stats.accuracy
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#3B82F6" name="Avg Score %" />
                  <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Difficulty Performance */}
          {difficultyStats && Object.keys(difficultyStats).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-6 h-6" />
                Difficulty-wise Accuracy
              </h2>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(difficultyStats).map(([diff, stats]) => ({
                        name: diff.charAt(0).toUpperCase() + diff.slice(1),
                        value: parseFloat(stats.accuracy.toFixed(1))
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value }) => `${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(difficultyStats).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {Object.entries(difficultyStats).map(([diff, stats], index) => (
                    <div key={diff} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}: {stats.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Tests & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Recent Tests
            </h2>
            <div className="space-y-3">
              {recentTests.map((test, index) => (
                <div key={index} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 
                                           dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {test.testConfig.subject} - {test.testConfig.scope}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {test.timestamp?.toDate ? test.timestamp.toDate().toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      test.results.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      test.results.score >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {test.results.score}%
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>✓ {test.results.correct} Correct</span>
                    <span>✗ {test.results.incorrect} Wrong</span>
                    <span>⏱ {formatTime(test.results.timeTaken)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {(recommendations.length > 0 || recsLoading) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-6 h-6" />
                AI-Powered Recommendations
                {recsLoading && <span className="text-xs ml-auto text-blue-500 animate-pulse">Generating...</span>}
              </h2>
              {recsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {aiStatus?.mode === 'AI-powered' ? 'Generating personalized recommendations with AI...' : 'Loading recommendations...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className={`border-l-4 rounded-lg p-4 ${
                      rec.priority === 'High' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      rec.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-start gap-2">
                        {rec.priority === 'High' ? <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" /> :
                         rec.priority === 'Medium' ? <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" /> :
                         <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {rec.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {rec.description}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                            💡 {rec.actionable || rec.action}
                          </p>
                          {rec.estimatedImpact && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                              Expected impact: {rec.estimatedImpact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiStatus && aiStatus.mode === 'Fallback (rule-based)' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center italic">
                      Showing rule-based recommendations. Set up Gemini API for AI-powered insights.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weak & Strong Chapters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weak Chapters */}
          {weakChapters.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Need Improvement
              </h2>
              <div className="space-y-3">
                {weakChapters.map((chapter, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {chapter.chapter}
                      </h3>
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {chapter.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${chapter.accuracy}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {chapter.correct}/{chapter.totalQuestions} correct
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Chapters */}
          {strongChapters.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Strong Areas
              </h2>
              <div className="space-y-3">
                {strongChapters.map((chapter, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {chapter.chapter}
                      </h3>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {chapter.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${chapter.accuracy}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {chapter.correct}/{chapter.totalQuestions} correct
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Keep Going! 🚀</h2>
          <p className="mb-6">Ready to improve your performance? Take another test now!</p>
          <button
            onClick={() => navigate('/test-selection')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold 
                     hover:bg-gray-100 transition-colors duration-200 inline-flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Start New Test
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;