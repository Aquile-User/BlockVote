// src/App.jsx

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import ElectionList from "./components/ElectionList";
import ElectionDetail from "./components/ElectionDetail";

function App() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="*" element={<h2>Page not found</h2>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
