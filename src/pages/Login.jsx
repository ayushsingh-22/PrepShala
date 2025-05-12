import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../Auth/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const Login = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  // Error state management
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  // Check for signup parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: '',
      general: ''
    }));

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    
    // Clear previous errors
    setErrors({
      email: '',
      password: '',
      general: ''
    });

    // Validate form
    let hasError = false;
    
    if (!email) {
      setErrors(prev => ({...prev, email: 'Email is required'}));
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({...prev, email: 'Please enter a valid email'}));
      hasError = true;
    }

    if (!password) {
      setErrors(prev => ({...prev, password: 'Password is required'}));
      hasError = true;
    } else if (isSignUp && password.length < 6) {
      setErrors(prev => ({...prev, password: 'Password must be at least 6 characters'}));
      hasError = true;
    }
    
    if (hasError) return;

    try {
      setLoading(true);
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Show success message
        setErrors(prev => ({...prev, general: 'Registration successful! Redirecting...'}));
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(error);
      
      // Map Firebase error messages to specific field errors
      switch(error.code) {
        case 'auth/email-already-in-use':
          setErrors(prev => ({...prev, email: 'This email is already registered'}));
          break;
        case 'auth/user-not-found':
          setErrors(prev => ({...prev, email: 'No account found with this email'}));
          break;
        case 'auth/wrong-password':
          setErrors(prev => ({...prev, password: 'Incorrect password'}));
          break;
        case 'auth/invalid-credential':
          setErrors(prev => ({...prev, general: 'Invalid email or password. Please check your credentials.'}));
          break;
        case 'auth/weak-password':
          setErrors(prev => ({...prev, password: 'Password is too weak (min. 6 characters)'}));
          break;
        case 'auth/invalid-email':
          setErrors(prev => ({...prev, email: 'Invalid email format'}));
          break;
        case 'auth/too-many-requests':
          setErrors(prev => ({...prev, general: 'Too many failed login attempts. Please try again later.'}));
          break;
        default:
          setErrors(prev => ({...prev, general: `Authentication error: ${error.message || 'Unknown error'}`}));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">
          {isSignUp ? 'Create an Account' : 'Login to Your Account'}
        </h2>

        {/* Toggle between login and signup */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrors({ email: '', password: '', general: '' });
                setFormData({ email: '', password: '' });
              }}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                !isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrors({ email: '', password: '', general: '' });
                setFormData({ email: '', password: '' });
              }}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* General error/success message */}
        {errors.general && (
          <div className={`p-2 mb-4 text-sm rounded ${
            errors.general.includes('successful')
              ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
          }`}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 ${
                errors.email ? 'border-red-500 dark:border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 ${
                errors.password ? 'border-red-500 dark:border-red-500' : ''
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-300 disabled:opacity-70"
          >
            {loading ? 'Processing...' : isSignUp ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm dark:text-gray-300">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp((prev) => !prev);
              setErrors({ email: '', password: '', general: '' });
            }}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {isSignUp ? 'Login here' : 'Register now'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
