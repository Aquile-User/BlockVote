import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import firewallAqua from '../assets/firewallAqua.png';
import {
  Menu,
  X,
  ShieldCheck,
  LogOut,
  User,
  MapPin,
  Wallet,
  ChevronDown
} from 'lucide-react';

const Topbar = ({ user }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  }; const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      description: 'Resumen y estadísticas',
      color: 'primary'
    },
    {
      path: '/elections',
      label: 'Elecciones',
      description: 'Elecciones activas y pasadas',
      color: 'emerald'
    },
    {
      path: '/admin',
      label: 'Administración',
      description: 'Gestionar elecciones',
      color: 'amber'
    }
  ];
  const ProfileCard = () => (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200/50 flex flex-col gap-4 min-w-[320px]">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{user?.name || 'Usuario'}</h2>
          <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-mono mt-1">
            <span className="text-xs mr-1">ID:</span>
            {user?.socialId || 'No disponible'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">
        <div className="bg-white/60 rounded-2xl p-4 border border-gray-200/50">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Ubicación</p>
              <p className="text-gray-900 font-semibold truncate">
                {user?.province || 'No establecida'}
              </p>
              <p className="text-gray-500 text-xs">República Dominicana 🇩🇴</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 rounded-2xl p-4 border border-gray-200/50">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Billetera Digital</p>
              <p className="text-gray-900 font-mono text-sm truncate">
                {user?.address ? `${user.address.slice(0, 8)}...${user.address.slice(-6)}` : 'Sin billetera'}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {user?.authMethod || 'Generada automáticamente'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-2 flex items-center justify-center space-x-2 p-3 w-full text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-200/50"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold">Cerrar Sesión</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Topbar */}      <div className="hidden lg:block sticky top-0 left-0 right-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">            {/* Logo */}
            <div className="flex items-center space-x-3">              <div className="flex items-center">
              <img src={firewallAqua} alt="Firewall Aqua" className="h-[34.5px] w-8 mr-2" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  BlockVote
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide">
                  Votación Blockchain
                </p>
              </div>
            </div>
            </div>

            {/* Navigation */}            <nav>
              <ul className="flex items-center space-x-2">                {navItems.map((item) => {
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive
                          ? `bg-${item.color}-50 text-${item.color}-600 shadow-sm`
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`
                      }
                    >
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
              </ul>
            </nav>

            {/* User Profile */}            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-300 group border border-transparent hover:border-gray-100"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 z-20"
                    >
                      <ProfileCard />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Topbar */}      <div className="lg:hidden sticky top-0 left-0 right-0 z-30 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-gray-800">
              BlockVote
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="w-5 h-5 text-gray-700" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>          {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <nav className="p-4">
              <ul className="flex flex-col space-y-2">                {navItems.map((item) => {
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 p-3 rounded-lg ${isActive
                          ? `bg-${item.color}-50 text-${item.color}-600`
                          : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </NavLink>
                  </li>
                );
              })}
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Mobile Profile Card */}
        <AnimatePresence>
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
                onClick={() => setIsProfileOpen(false)}
              ></div>
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed inset-x-4 top-20 mx-auto max-w-sm z-50"
              >
                <ProfileCard />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Topbar;
