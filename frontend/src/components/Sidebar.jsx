import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Vote, 
  BarChart3, 
  LogOut,
  Shield,
  Wallet,
  Settings,
  Menu,
  X,
  ChevronRight,
  MapPin
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.reload();
  };

  const navItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
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
      path: '/analytics', 
      icon: BarChart3, 
      label: 'Analíticas',
      description: 'Gráficos y análisis de votos',
      color: 'violet'
    },
    { 
      path: '/admin', 
      icon: Settings, 
      label: 'Administración',
      description: 'Gestionar elecciones',
      color: 'amber'
    }
  ];

  const sidebarContent = (
    <>      {/* Header */}
      <div className="p-6 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-button">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-20 blur-sm -z-10"></div>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  BlockVote
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Votación Blockchain
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop collapse button with subtle animation */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl hover:bg-slate-100 transition-all duration-300 group"
          >
            <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </div>      {/* User Info */}
      <div className="p-6 border-b border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-coral-400 via-coral-500 to-coral-600 rounded-2xl flex items-center justify-center shadow-medium">
              <span className="text-lg font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-soft">
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
            </div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user?.province || 'República Dominicana'}
              </p>
            </div>
          )}
        </div>
        
        {/* Enhanced Wallet Info */}
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 p-4 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 shadow-soft"
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 tracking-wide">BILLETERA</span>
            </div>
            
            <div className="relative">
              <p className="text-xs font-mono text-slate-600 break-all bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-inner-soft">
                {user?.address ? `${user.address.slice(0, 8)}...${user.address.slice(-6)}` : 'No conectado'}
              </p>
              {/* Copy button subtle indicator */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-400 rounded-full opacity-60"></div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium">Método:</span>
              <span className="text-xs font-semibold px-2 py-1 bg-primary-100 text-primary-700 rounded-lg capitalize">
                {user?.authMethod || 'Generado'}
              </span>
            </div>
          </motion.div>
        )}
      </div>      {/* Enhanced Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 p-3'} rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 via-primary-50 to-primary-100/50 text-primary-700 shadow-soft border border-primary-200/50'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 hover:shadow-soft'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative transition-all duration-300 ${isActive ? 'text-primary-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {/* Active indicator with sophisticated animation */}
                      {isActive && (
                        <>
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -inset-2 bg-gradient-to-r from-primary-100 via-primary-50 to-primary-100 rounded-xl -z-10 opacity-60"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full shadow-sm"
                          />
                        </>
                      )}
                    </div>
                    
                    {!isCollapsed && (
                      <motion.div 
                        className="flex-1 min-w-0"
                        initial={false}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-sm font-semibold tracking-wide">{item.label}</p>
                        <p className="text-xs opacity-75 truncate font-medium">{item.description}</p>
                      </motion.div>
                    )}

                    {/* Enhanced tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-slate-300 text-[10px] mt-0.5">{item.description}</div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </div>
                    )}

                    {/* Subtle hover effect */}
                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary-200/20 to-primary-300/20 opacity-0 group-hover:opacity-100' 
                        : 'bg-slate-200/50 opacity-0 group-hover:opacity-100'
                    }`}></div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>      {/* Enhanced Footer */}
      <div className="p-4 border-t border-slate-200/80">
        <button
          onClick={handleLogout}
          className={`group relative flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 p-3'} w-full text-slate-600 hover:text-rose-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-rose-100/50 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] border border-transparent hover:border-rose-200/50`}
        >
          <div className="relative">
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-rose-500 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>
          
          {!isCollapsed && (
            <span className="text-sm font-semibold tracking-wide">Cerrar Sesión</span>
          )}
          
          {/* Enhanced tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
              <div className="font-semibold">Cerrar Sesión</div>
              <div className="text-slate-300 text-[10px] mt-0.5">Salir de la aplicación</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>      {/* Mobile menu button with sophisticated design */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white rounded-2xl shadow-strong flex items-center justify-center text-slate-600 border border-slate-200/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="relative">
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <div className="absolute inset-0 bg-primary-500 rounded-full opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
        </div>
      </button>

      {/* Mobile overlay with blur */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar with enhanced styling */}
      <motion.div 
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:block fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-slate-200/80 z-30 shadow-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
        }}
      >
        {sidebarContent}
      </motion.div>

      {/* Mobile Sidebar with enhanced styling */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200/80 z-50 shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)'
            }}
          >
            {sidebarContent}
          </motion.div>
        )}      </AnimatePresence>
    </>
  );
};

export default Sidebar;
