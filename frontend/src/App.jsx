import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Topbar from "./components/layout/Topbar";
import AuthWrapper from "./components/auth/AuthWrapper";
import UserDashboard from "./components/user/UserDashboard";
import ElectionList from "./components/election/ElectionList";
import ElectionDetail from "./components/election/ElectionDetail";
import AdminDashboard from "./components/admin/AdminDashboard";
import NetworkStatus from "./components/common/NetworkStatus";

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is registered
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsConnected(true);
    }
  }, []);
  return (
    <div className="min-h-screen bg-light-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-white text-gray-900 border border-gray-200 shadow-medium',
          duration: 4000,
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#ffffff',
            },
          },
        }}
      />      {isConnected ? (
        <div className="flex flex-col bg-light-bg min-h-screen">
          <Topbar user={user} />
          <NetworkStatus />
          <main className="flex-1 p-4 md:p-6 lg:p-8 pt-2 md:pt-4">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<UserDashboard user={user} />} />
                <Route path="/elections" element={<ElectionList user={user} />} />
                <Route path="/elections/:id" element={<ElectionDetail user={user} />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={
                  <div className="card p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h2>
                    <p className="text-gray-600 mb-4">La página que buscas no existe.</p>
                    <button
                      onClick={() => window.history.back()}
                      className="btn-primary"
                    >
                      Volver atrás
                    </button>
                  </div>
                } />
              </Routes>
            </div>
          </main>
        </div>
      ) : (
        <AuthWrapper setUser={setUser} setIsConnected={setIsConnected} />
      )}
    </div>
  );
}

export default App;
