import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserLogin from "./UserLogin";
import UserRegister from "./UserRegister";

// Configuraciones constantes
const FLOATING_ELEMENTS = [
  { size: 'w-3 h-3', color: 'bg-primary-400', position: 'top-20 left-20', opacity: 'opacity-60', delay: '0s' },
  { size: 'w-2 h-2', color: 'bg-violet-400', position: 'top-40 right-32', opacity: 'opacity-40', delay: '1s' },
  { size: 'w-4 h-4', color: 'bg-emerald-400', position: 'bottom-32 left-32', opacity: 'opacity-50', delay: '2s' },
  { size: 'w-2 h-2', color: 'bg-amber-400', position: 'bottom-20 right-20', opacity: 'opacity-60', delay: '0.5s' }
];

const BACKGROUND_DECORATIONS = [
  { size: 'w-80 h-80', color: 'bg-primary-100', position: '-top-40 -right-40', opacity: 'opacity-60' },
  { size: 'w-80 h-80', color: 'bg-violet-100', position: '-bottom-40 -left-40', opacity: 'opacity-60' },
  { size: 'w-96 h-96', color: 'bg-emerald-50', position: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2', opacity: 'opacity-40' }
];

const TRANSITION_CONFIG = { duration: 0.4, ease: "easeInOut" };

const AuthWrapper = ({ setUser, setIsConnected }) => {
  const [authMode, setAuthMode] = useState('login');

  const switchToRegister = () => setAuthMode('register');
  const switchToLogin = () => setAuthMode('login');

  // Componente reutilizable para elementos flotantes
  const FloatingElement = ({ size, color, position, opacity, delay }) => (
    <div
      className={`absolute ${position} ${size} ${color} rounded-full animate-float ${opacity}`}
      style={{ animationDelay: delay }}
    />
  );

  // Componente reutilizable para decoraciones de fondo
  const BackgroundDecoration = ({ size, color, position, opacity }) => (
    <div className={`absolute ${position} ${size} ${color} rounded-full blur-3xl ${opacity}`} />
  );

  // Componente reutilizable para wrapper de animación
  const AnimatedWrapper = ({ mode, children }) => {
    const isLogin = mode === 'login';
    return (
      <motion.div
        key={mode}
        initial={{ opacity: 0, x: isLogin ? -300 : 300, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: isLogin ? 300 : -300, scale: 0.9 }}
        transition={TRANSITION_CONFIG}
      >
        {children}
      </motion.div>
    );
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-light-bg via-gray-50 to-primary-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {BACKGROUND_DECORATIONS.map((decoration, index) => (
          <BackgroundDecoration key={index} {...decoration} />
        ))}
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FLOATING_ELEMENTS.map((element, index) => (
          <FloatingElement key={index} {...element} />
        ))}
      </div>

      <div className="relative w-full max-w-6xl px-4">
        <AnimatePresence mode="wait">
          {authMode === 'login' ? (
            <AnimatedWrapper mode="login">
              <UserLogin
                setUser={setUser}
                setIsConnected={setIsConnected}
                switchToRegister={switchToRegister}
              />
            </AnimatedWrapper>
          ) : (
            <AnimatedWrapper mode="register">
              <UserRegister
                setUser={setUser}
                setIsConnected={setIsConnected}
                switchToLogin={switchToLogin}
              />
            </AnimatedWrapper>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthWrapper;
