import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Vote, 
  BarChart3, 
  LogOut,
  Shield,
  Wallet,
  Settings
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  };  const navItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      description: 'Overview & Statistics'
    },
    { 
      path: '/elections', 
      icon: Vote, 
      label: 'Elections',
      description: 'Active & Past Elections'
    },
    { 
      path: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      description: 'Vote Analytics & Charts'
    },
    { 
      path: '/admin', 
      icon: Settings, 
      label: 'Admin Panel',
      description: 'Manage Elections'
    }
  ];

  return (
    <motion.div 
      initial={{ x: -64 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 bg-dark-card border-r border-gray-700/50 z-50"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">EtherVote</h1>
            <p className="text-xs text-gray-400">Blockchain Voting</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.province || 'Dominican Republic'}
            </p>
          </div>
        </div>
        
        {/* Wallet Info */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">Wallet</span>
          </div>
          <p className="text-xs font-mono text-gray-400 break-all">
            {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'Not connected'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">Auth Method:</span>
            <span className="text-xs font-medium text-primary capitalize">
              {user?.authMethod || 'Generated'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/20 border border-primary/30 text-primary'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full p-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
