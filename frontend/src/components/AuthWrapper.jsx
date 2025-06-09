import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Login from "./Login";
import Register from "./Register";

const AuthWrapper = ({ setUser, setIsConnected }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const switchToRegister = () => setAuthMode('register');
  const switchToLogin = () => setAuthMode('login');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-dark-bg via-dark-bg to-dark-accent">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          {authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
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
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.3 }}
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
