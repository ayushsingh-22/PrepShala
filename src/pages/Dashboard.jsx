import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen p-8 bg-blue-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Dashboard</h1>
        
        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-md mb-6">
          <p className="dark:text-white">
            Welcome, {currentUser?.email || 'User'}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded-md">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">Recent Tests</h2>
            <p className="text-gray-600 dark:text-gray-300">You haven't taken any tests yet.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded-md">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">Performance</h2>
            <p className="text-gray-600 dark:text-gray-300">No performance data available.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;