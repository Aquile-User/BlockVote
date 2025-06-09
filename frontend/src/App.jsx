import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import AuthWrapper from "./components/AuthWrapper";
import Dashboard from "./components/Dashboard";
import Elections from "./components/Elections";
import ElectionDetail from "./components/ElectionDetail";
import Analytics from "./components/Analytics";
import AdminPage from "./components/AdminPage";

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  console.log('App component loading...', { user, isConnected });

  useEffect(() => {
    console.log('App useEffect running...');
    // Check if user is registered
    const userData = localStorage.getItem('currentUser');
    console.log('Current user data from localStorage:', userData);
    if (userData) {
      setUser(JSON.parse(userData));
      setIsConnected(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      <div style={{position: 'fixed', top: '10px', left: '10px', color: 'white', zIndex: 9999, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '5px'}}>
        Debug: App loaded, isConnected: {isConnected ? 'true' : 'false'}
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-dark-card text-white border border-gray-700',
          duration: 4000,
        }}
      />
      
      {isConnected ? (
        <div className="flex">
          <Sidebar user={user} />
          <main className="flex-1 ml-64 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/elections" element={<Elections user={user} />} />
              <Route path="/elections/:id" element={<ElectionDetail user={user} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={
                <div className="card p-8 text-center">
                  <h2 className="text-2xl font-bold text-red-400">Page not found</h2>
                  <p className="text-gray-400 mt-2">The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      ) : (
        <div>
          <div style={{color: 'white', padding: '20px'}}>Loading AuthWrapper...</div>
          <AuthWrapper setUser={setUser} setIsConnected={setIsConnected} />
        </div>
      )}
    </div>
  );
}

export default App;
