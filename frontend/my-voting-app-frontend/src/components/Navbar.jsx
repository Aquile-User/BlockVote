// src/components/Navbar.jsx

import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <NavLink
        to="/register"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Register
      </NavLink>
      <NavLink
        to="/elections"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Elections
      </NavLink>
    </nav>
  );
}
