import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Login from "./Login";
import Register from "./Register";

const AuthWrapper = ({ setUser, setIsConnected }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const switchToRegister = () => setAuthMode('register');
  const switchToLogin = () => setAuthMode('login');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-light-bg via-gray-50 to-primary-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-3 h-3 bg-primary-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-32 w-2 h-2 bg-violet-400 rounded-full animate-float opacity-40" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-4 h-4 bg-emerald-400 rounded-full animate-float opacity-50" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-amber-400 rounded-full animate-float opacity-60" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative w-full max-w-lg">
        <AnimatePresence mode="wait">
          {authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Login 
                setUser={setUser} 
                setIsConnected={setIsConnected}
                switchToRegister={switchToRegister}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Register 
                setUser={setUser} 
                setIsConnected={setIsConnected}
                switchToLogin={switchToLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthWrapper;
