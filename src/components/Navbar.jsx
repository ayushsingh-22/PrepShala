import { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; 
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../Auth/firebase';
import logo from '../assets/logo.png';
import logo2 from '../assets/logo2.png';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMockTestClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-900 shadow-md">
      <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-white flex items-center">
        <img 
          src={theme === 'dark' ? logo2 : logo} 
          alt="TestShala Logo" 
          className="h-12 mr-3" 
        />
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-800 dark:text-white hover:underline">
          Home
        </Link>
        <Link
          to="/test-selection"
          className="text-gray-800 dark:text-white hover:underline"
          onClick={handleMockTestClick}
        >
          Mock Test
        </Link>
        
        {/* Conditional rendering based on authentication status */}
        {isLoggedIn ? (
          <>
            <Link 
              to="/dashboard" 
              className="text-gray-800 dark:text-white hover:underline"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">
            <button className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">
              Login
            </button>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-800 dark:text-yellow-300 p-2"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to be logged in to access the Mock Test feature. Would you like to login or create a new account?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/login');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/login?signup=true');  // Assuming your login page can handle a signup parameter
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
