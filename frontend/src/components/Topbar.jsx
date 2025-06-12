import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Vote,
  Settings,
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
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutGrid,
      label: 'Dashboard',
      description: 'Resumen y estadísticas',
      color: 'primary'
    },
    {
      path: '/elections',
      icon: Vote,
      label: 'Elecciones',
      description: 'Elecciones activas y pasadas',
      color: 'emerald'
    },
    {
      path: '/admin',
      icon: Settings,
      label: 'Administración',
      description: 'Gestionar elecciones',
      color: 'amber'
    }
  ];

  const ProfileCard = () => (
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-200/50 flex flex-col gap-4 min-w-[320px]">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white/50">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-soft">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Usuario'}</h2>
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
      {/* Desktop Topbar */}
      <div className="hidden lg:block sticky top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-button">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl opacity-20 blur-sm -z-10"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  BlockVote
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Votación Blockchain
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav>
              <ul className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? `bg-gradient-to-r from-${item.color}-50 to-${item.color}-100/50 text-${item.color}-700 shadow-soft border border-${item.color}-200/50`
                              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl hover:bg-slate-100 transition-colors duration-300 group"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-coral-400 via-coral-500 to-coral-600 rounded-xl flex items-center justify-center shadow-medium">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-soft">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
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

      {/* Mobile Topbar */}
      <div className="lg:hidden sticky top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-button">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              BlockVote
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <User className="w-5 h-5 text-slate-700" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200/80 overflow-hidden"
            >
              <nav className="p-4">
                <ul className="flex flex-col space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-xl ${
                              isActive
                                ? `bg-${item.color}-50 text-${item.color}-700`
                                : 'text-slate-600 hover:bg-slate-100'
                            }`
                          }
                        >
                          <Icon className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.description}</p>
                          </div>
                        </NavLink>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
