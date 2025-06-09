import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { 
  LogIn, 
  User, 
  CreditCard,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { validateDominicanID } from "../utils/dominican";

const Login = ({ setUser, setIsConnected, switchToRegister }) => {
  const [formData, setFormData] = useState({
    socialId: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatIdInput = (value) => {
    // Remove any existing formatting
    const numbers = value.replace(/\D/g, '');
    
    // Apply format: 000-0000000-0
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}-${numbers.slice(10, 11)}`;
    }
  };

  const handleIdChange = (e) => {
    const formatted = formatIdInput(e.target.value);
    handleInputChange('socialId', formatted);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
      if (!validateDominicanID(formData.socialId)) {
      toast.error("Please enter a valid Dominican ID (000-0000000-0)");
      return;
    }
      try {
      setLoading(true);
      console.log('Attempting login with:', { socialId: formData.socialId, name: formData.name });
      
      // First check localStorage
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const storedUser = JSON.parse(userData);
        console.log('Found stored user:', storedUser);
        
        // Verify credentials match
        if (storedUser.socialId === formData.socialId && 
            storedUser.name.toLowerCase() === formData.name.toLowerCase()) {
          setUser(storedUser);
          setIsConnected(true);
          toast.success(`Welcome back, ${storedUser.name}!`);
          return;
        } else {
          console.log('Stored user credentials do not match');
        }
      }

      // Check backend users.json via API
      try {
        console.log('Checking backend API...');
        const response = await fetch('http://localhost:3000/users');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const users = await response.json();
        console.log('Users from API:', Object.keys(users));
        
        // Find user by social ID (users object is keyed by socialId)
        const foundUser = users[formData.socialId];
        console.log('Found user in backend:', foundUser);
          if (foundUser && foundUser.name && 
            foundUser.name.toLowerCase() === formData.name.toLowerCase()) {
          // Create complete user object with socialId
          const completeUser = {
            ...foundUser,
            socialId: formData.socialId
          };
          
          console.log('Complete user object:', completeUser);
          
          // Store user in localStorage and set current user
          localStorage.setItem('currentUser', JSON.stringify(completeUser));
          setUser(completeUser);
          setIsConnected(true);
          toast.success(`Welcome back, ${foundUser.name}!`);
          console.log('Login successful');
          return;
        } else {
          console.log('User not found or name mismatch. Expected name:', foundUser?.name, 'Provided:', formData.name);
        }
      } catch (apiError) {
        console.error('API check failed:', apiError);
        toast.error(`API connection failed: ${apiError.message}`);
      }
      
      // If no match found, suggest registration
      toast.error("User not found. Please check your credentials or register.");
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-r from-primary to-purple rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">
            Sign in to access your voting account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Name Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </motion.div>

          {/* Dominican ID Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Dominican ID
            </label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="000-0000000-0"
              value={formData.socialId}
              onChange={handleIdChange}
              maxLength={13}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: 000-0000000-0
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={switchToRegister}
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              Register here
            </button>
          </p>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <UserCheck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-medium text-sm">Secure Login</h4>
              <p className="text-gray-400 text-xs mt-1">
                Your credentials are verified locally. We use blockchain technology 
                to ensure vote security and privacy.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
