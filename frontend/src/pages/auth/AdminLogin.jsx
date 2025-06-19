import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Terminal,
  Database,
  Cpu,
  Wifi,
  Globe,
  ShieldCheck,
  Binary,
  Scan,
  Server,
  Fingerprint
} from "lucide-react";

// Configuraciones constantes
const TYPING_TEXT = "ADMINISTRATIVE_PROTOCOL_INITIATED";
const TYPING_SPEED = 60;
const SCAN_INCREMENT = 2;

const SYSTEM_ICONS = [
  { Icon: Database, label: "Database", delay: 0.1 },
  { Icon: Wifi, label: "Network", delay: 0.2 },
  { Icon: Cpu, label: "Processing", delay: 0.3 },
  { Icon: Server, label: "Server", delay: 0.4 },
  { Icon: Globe, label: "Global", delay: 0.5 },
  { Icon: Binary, label: "Binary", delay: 0.6 },
];

const PARTICLES_COUNT = 20;
const LINES_COUNT = 8;

// Generador de partículas optimizado
const generateParticles = (count) => Array.from({ length: count }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5
}));

// Componente para input reutilizable
const FormInput = ({ label, type, value, onChange, placeholder, icon: Icon, isPassword = false, showPassword, setShowPassword, focusedField, setFocusedField }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: type === 'text' ? 0.8 : 0.9 }}
  >
    <label className="block text-sm font-medium text-slate-700 mb-3">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <input
        type={isPassword && !showPassword ? "password" : "text"}
        value={value}
        onChange={onChange}
        onFocus={() => setFocusedField(type)}
        onBlur={() => setFocusedField(null)}
        className={`w-full pl-12 ${isPassword ? 'pr-16' : 'pr-4'} py-4 bg-slate-50/80 border-2 rounded-xl text-slate-800 placeholder-slate-500 transition-all duration-300 focus:outline-none ${focusedField === type
            ? 'border-primary-500 bg-white shadow-glow'
            : 'border-slate-300 hover:border-slate-400 hover:bg-white/60'
          }`}
        placeholder={placeholder}
        required
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors p-1"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
      {focusedField === type && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute ${isPassword ? 'right-12' : 'right-4'} top-1/2 transform -translate-y-1/2`}
        >
          <div className={`w-2 h-2 ${type === 'text' ? 'bg-primary-500' : 'bg-emerald-500'} rounded-full animate-pulse`} />
        </motion.div>
      )}
    </div>
  </motion.div>
);

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  // Efecto de escritura automática para el encabezado
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setTypingText(TYPING_TEXT.slice(0, i));
      i++;
      if (i > TYPING_TEXT.length) clearInterval(timer);
    }, TYPING_SPEED);
    return () => clearInterval(timer);
  }, []);

  // Animación de escaneo de seguridad
  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev >= 100 ? 0 : prev + SCAN_INCREMENT));
    }, 100);
    return () => clearInterval(interval);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (credentials.username === "eljefe" && credentials.password === "123456") {
      localStorage.setItem('adminSession', 'true');
      localStorage.setItem('adminAuthenticated', 'true');
      toast.success("🔐 Access Granted - Administrator Portal Activated");
      onLogin();
    } else {
      toast.error("⚠️ Authentication Failed - Access Denied");
    }

    setLoading(false);
  };

  // Usar las constantes para generar elementos
  const backgroundParticles = generateParticles(PARTICLES_COUNT); return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">

      {/* Patrones geométricos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-emerald-500/5 to-primary-500/5 opacity-40"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>

      {/* Partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-primary-500/15 rounded-full blur-sm"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>      {/* Líneas de conexión animadas */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {Array.from({ length: LINES_COUNT }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-transparent via-primary-400/40 to-transparent"
            style={{
              width: '200%',
              height: '1px',
              top: `${10 + i * 12}%`,
              left: '-50%',
              transformOrigin: 'center'
            }}
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-6xl mx-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Panel izquierdo - Información del sistema */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:block space-y-8"
          >
            {/* Header principal */}
            <div className="text-center lg:text-left">              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 via-emerald-600 to-primary-700 bg-clip-text text-transparent leading-tight">
                BlockVote
              </h1>
              <h2 className="text-2xl font-semibold text-slate-700 mt-2">
                Administrative Portal
              </h2>
            </motion.div>

              <div className="font-mono text-primary-600 text-sm tracking-wider mb-4">
                {typingText}<span className="animate-pulse text-emerald-600">█</span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed">
                Secure blockchain voting platform with advanced authentication protocols.
                Administrative access required for election management and system oversight.
              </p>
            </div>            {/* Grid de iconos del sistema */}
            <div className="grid grid-cols-3 gap-4">
              {SYSTEM_ICONS.map(({ Icon, label, delay }, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + delay, duration: 0.5 }} className="group relative p-4 bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-xl hover:border-primary-400/60 hover:bg-white/90 transition-all duration-300 shadow-soft"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-primary-500/15 rounded-lg group-hover:bg-primary-500/25 transition-colors">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                  </div>

                  {/* Efecto de hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 rounded-xl opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Barra de progreso de escaneo */}            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center">
                  <Scan className="w-4 h-4 mr-2" />
                  Security Scan
                </span>
                <span className="text-primary-600 font-mono">{scanProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Panel derecho - Formulario de login */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative"
          >            {/* Efectos de brillo */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-emerald-500/10 to-primary-500/10 rounded-3xl blur-xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Card principal del login */}
            <div className="relative bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-2xl"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}>

              {/* Header del formulario */}
              <div className="text-center mb-8">
                {/* Icono central animado */}
                <motion.div
                  className="relative w-20 h-20 mx-auto mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1, type: "spring", bounce: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  {/* Anillos orbitales */}
                  <motion.div
                    className="absolute inset-0 border-2 border-primary-500/40 rounded-2xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute -inset-2 border border-emerald-500/30 rounded-3xl"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  System Authentication
                </h3>
                <p className="text-slate-600 text-sm">
                  Enter your administrative credentials
                </p>
              </div>              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-6">                {/* Campo de usuario */}
                <FormInput
                  label="Administrator Username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter admin username"
                  icon={User}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />

                {/* Campo de contraseña */}
                <FormInput
                  label="Security Passphrase"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password"
                  icon={Lock}
                  isPassword={true}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />

                {/* Botón de envío */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <button
                    type="submit"
                    disabled={loading || !credentials.username || !credentials.password}
                    className="w-full relative py-4 px-6 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl 
                             transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                             hover:from-primary-500 hover:to-emerald-500 hover:shadow-button-hover
                             focus:outline-none focus:ring-4 focus:ring-primary-500/30"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Authenticating System...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <Fingerprint className="w-5 h-5" />
                        <span>Initiate Authentication</span>
                      </div>
                    )}

                    {/* Efecto de hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-xl"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </button>
                </motion.div>
              </form>

              {/* Footer */}              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 text-center space-y-3"
              >
                <div className="flex items-center justify-center space-x-2 text-slate-600 text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>Secured by blockchain technology</span>
                </div>
                <p className="text-xs text-slate-500">
                  Administrative access required for election management and system configuration
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
