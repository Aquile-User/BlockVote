import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  CreditCard as Wallet,
  User,
  MapPin,
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle2 as Check,
  ArrowRight,
  AlertTriangle,
  Zap,
  Key,
  Download,
  AlertCircle
} from "lucide-react";
import { registerUser } from "../api";
import { DOMINICAN_PROVINCES, validateDominicanID } from "../utils/dominican";

const Register = ({ setUser, setIsConnected, switchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    socialId: "",
    province: "",
    authMethod: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [metamaskAvailable, setMetamaskAvailable] = useState(false);

  useEffect(() => {
    // Check if MetaMask is available
    setMetamaskAvailable(typeof window.ethereum !== 'undefined');
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!validateDominicanID(formData.socialId)) {
      toast.error("Please enter a valid Dominican ID (000-0000000-0)");
      return false;
    }
    if (!formData.province) {
      toast.error("Please select your province");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const connectMetaMask = async () => {
    if (!metamaskAvailable) {
      toast.error("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        toast.error("No MetaMask accounts found");
        return;
      }

      const address = accounts[0];

      // Register with MetaMask
      const userData = {
        socialId: formData.socialId,
        name: formData.name,
        province: formData.province,
        authMethod: 'metamask',
        metamaskAddress: address
      };

      const data = await registerUser(userData);

      // Save user data
      const completeUserData = { ...userData, address: data.address };
      localStorage.setItem('currentUser', JSON.stringify(completeUserData));

      setUser(completeUserData);
      setIsConnected(true);

      toast.success("Successfully registered with MetaMask!");

    } catch (error) {
      console.error('MetaMask connection error:', error);
      toast.error(error.response?.data?.error || "Failed to connect with MetaMask");
    } finally {
      setLoading(false);
    }
  };

  const generateWallet = async () => {
    try {
      setLoading(true);

      const userData = {
        socialId: formData.socialId,
        name: formData.name,
        province: formData.province,
        authMethod: 'generated'
      };

      const data = await registerUser(userData);
      setWalletInfo(data);

      // Save user data including private key for generated wallets
      const completeUserData = {
        ...userData,
        address: data.address,
        privateKey: data.privateKey
      };
      localStorage.setItem('currentUser', JSON.stringify(completeUserData));
      localStorage.setItem(`user-${data.socialId}`, JSON.stringify({
        address: data.address,
        privateKey: data.privateKey
      }));

      setStep(3);
      toast.success("Wallet generated successfully!");

    } catch (error) {
      console.error('Wallet generation error:', error);
      toast.error(error.response?.data?.error || "Failed to generate wallet");
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = () => {
    setUser(JSON.parse(localStorage.getItem('currentUser')));
    setIsConnected(true);
  };

  const formatIdInput = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as 000-0000000-0
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
    }
  };  // Función para obtener las clases dinámicas del contenedor según el paso
  const getContainerClasses = () => {
    const baseClasses = "w-full mx-auto transition-all duration-700 ease-in-out transform";

    switch (step) {
      case 1:
        return `${baseClasses} max-w-2xl`; // Más estrecho para formulario
      case 2:
        return `${baseClasses} max-w-lg`; // Mismo tamaño que login para consistencia
      case 3:
        return `${baseClasses} max-w-4xl`; // Ancho medio para información de billetera
      default:
        return `${baseClasses} max-w-5xl`;
    }
  };

  // Función para obtener las clases dinámicas del contenido según el paso
  const getContentClasses = () => {
    const baseClasses = "bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 relative overflow-hidden transition-all duration-700 transform";

    switch (step) {
      case 1:
        return `${baseClasses} p-8`; // Más padding para formulario
      case 2:
        return `${baseClasses} p-6`; // Padding normal para cards
      case 3:
        return `${baseClasses} p-6`; // Padding normal para información
      default:
        return `${baseClasses} p-6`;
    }
  };

  // Función para obtener estilos dinámicos del contenedor interno
  const getInnerContainerStyles = () => {
    switch (step) {
      case 1:
        return {
          padding: '2rem',
          minHeight: '400px'
        };
      case 2:
        return {
          padding: '1.5rem',
          minHeight: '500px'
        };
      case 3:
        return {
          padding: '1.5rem',
          minHeight: '450px'
        };
      default:
        return {
          padding: '1.5rem',
          minHeight: '400px'
        };
    }
  };

  return (<div className={getContainerClasses()}>
    <motion.div
      className={getContentClasses()}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      layout
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary-500 to-coral-500"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-100 to-primary-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-coral-100 to-violet-100 rounded-full blur-2xl opacity-40"></div>      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center mb-6 relative z-10"
        layout
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-emerald-700 to-slate-800 bg-clip-text text-transparent mb-2">
          Crear Cuenta
        </h1>
        <p className="text-slate-600 text-base font-medium">
          Únete a <span className="text-emerald-600 font-semibold">BlockVote</span> y participa
        </p>
      </motion.div><motion.div
        className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-soft transition-all duration-700"
        style={getInnerContainerStyles()}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Información Personal</h2>
                <p className="text-slate-600">Ingresa tus datos para comenzar</p>
              </div>                {/* Name Input */}
              <div className="relative">
                <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                  <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-emerald-600" />
                  </div>
                  Nombre Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder-slate-400 font-medium"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-primary-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Dominican ID Input */}              <div className="relative">
                <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                  <div className="w-5 h-5 bg-primary-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-3 h-3 text-primary-600" />
                  </div>
                  Cédula Dominicana
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder-slate-400 font-mono"
                    placeholder="000-0000000-0"
                    value={formData.socialId}
                    onChange={(e) => handleInputChange('socialId', formatIdInput(e.target.value))}
                    maxLength="13"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-primary-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                {!validateDominicanID(formData.socialId) && formData.socialId && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Formato requerido: 000-0000000-0
                  </p>
                )}
              </div>

              {/* Province Selection */}              <div className="relative">
                <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                  <div className="w-5 h-5 bg-coral-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-coral-600" />
                  </div>
                  Provincia
                </label>
                <div className="relative">
                  <select
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 font-medium appearance-none bg-no-repeat bg-right pr-12"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundSize: '20px',
                      backgroundPosition: 'right 16px center'
                    }}
                  >
                    <option value="">Selecciona tu provincia</option>
                    {DOMINICAN_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-coral-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-primary-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-primary-700 text-white font-semibold text-lg py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-button hover:shadow-button-hover flex items-center justify-center space-x-3 group"
              >
                <span>Continuar</span>
              </motion.button>
            </motion.div>
          )}          {/* Step 2: Enhanced Authentication Method */}          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full space-y-6"
            >
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-slate-900 mb-2"
                >
                  Elige tu Método de Autenticación
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-600 text-base"
                >
                  Selecciona cómo quieres proteger tu billetera y votos
                </motion.p>
              </div>              {/* Enhanced Generated Wallet Option - Now Primary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="group relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-500"
              >
                {/* Multiple Background Layers for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-100 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/95 via-white/90 to-white/80 backdrop-blur-sm rounded-2xl"></div>
                <div className="absolute inset-0 border-2 border-primary-200/60 rounded-2xl group-hover:border-primary-300/80 transition-all duration-300"></div>

                {/* Floating Decoration Elements */}
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary-200/30 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-emerald-300/40 rounded-full blur-sm"></div>                <div className="relative p-5">
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Enhanced Icon Container */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                      {/* Pulsing Ring */}
                      <div className="absolute inset-0 w-10 h-10 rounded-xl border-2 border-primary-400/50 animate-ping"></div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {/* Enhanced Title */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center flex-wrap gap-2">
                          Generar Billetera Nueva
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full border border-emerald-200 font-medium animate-pulse">
                            Recomendado
                          </span>
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Crea una nueva billetera segura automáticamente financiada para votar.
                        </p>
                      </div>

                      {/* Enhanced Button */}
                      <div className="space-y-2">                          <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateWallet}
                        disabled={loading}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-700 hover:from-primary-700 hover:to-emerald-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 border-2 border-primary-700/30 relative overflow-hidden group"
                      >
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <span className="relative z-10">
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Generando...</span>
                            </div>
                          ) : (
                            'Generar Billetera'
                          )}
                        </span>
                      </motion.button>

                        {/* Enhanced Features List */}
                        <div className="bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-200">
                          <div className="flex items-center justify-center space-x-2 text-emerald-700 text-xs mb-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">Características incluidas:</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs text-emerald-600">
                            <div className="flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Financiado</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Seguro</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Automático</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Instantáneo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>                    </div>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">O conecta con</span>
                </div>
              </motion.div>              {/* MetaMask Button - Google Style */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={metamaskAvailable ? { scale: 1.02 } : {}}
                whileTap={metamaskAvailable ? { scale: 0.98 } : {}}
                onClick={connectMetaMask}
                disabled={!metamaskAvailable || loading}
                className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 ${metamaskAvailable
                  ? 'bg-white border-gray-300 hover:border-orange-500 hover:shadow-md text-gray-700'
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <img
                  src="/src/assets/MetaMask-icon-fox.svg"
                  alt="MetaMask"
                  className="w-5 h-5"
                />
                <span className="font-medium">
                  {loading ? 'Conectando...' : 'Conectar con MetaMask'}
                </span>
                {!metamaskAvailable && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    No disponible
                  </span>
                )}                </motion.button>

              {/* Enhanced Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4 border-t border-slate-200"
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Volver a información personal</span>
                </button>
              </motion.div>
            </motion.div>
          )}            {/* Step 3: Enhanced Wallet Information */}
          {step === 3 && walletInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >              <div className="text-center mb-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-slate-900 mb-2"
                >
                  ¡Billetera Creada Exitosamente!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-600 text-base"
                >
                  Tu billetera ha sido financiada y está lista para usar
                </motion.p>
              </div>

              {/* Enhanced Wallet Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl"></div>
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl border border-primary-200"></div>
                  <div className="relative p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <Wallet className="w-5 h-5 mr-2 text-primary-600" />
                      Información de tu Billetera
                    </h3>

                    <div className="space-y-4">
                      {/* Address */}
                      <div className="group">                        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        Dirección de Billetera
                      </label>
                        <div className="relative">
                          <div className="bg-slate-100 backdrop-blur-sm rounded-xl p-3 border border-slate-200 group-hover:border-primary-300 transition-all duration-300">
                            <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                              {walletInfo.address}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        </div>
                      </div>

                      {/* Private Key */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Clave Privada
                          </label>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-all duration-200 border border-primary-200"
                          >
                            {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span className="text-sm font-medium">{showPrivateKey ? 'Ocultar' : 'Mostrar'}</span>
                          </motion.button>
                        </div>
                        <div className="relative">
                          <div className="bg-slate-100 backdrop-blur-sm rounded-xl p-3 border border-slate-200 group-hover:border-amber-300 transition-all duration-300">
                            <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                              {showPrivateKey ? walletInfo.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        </div>
                      </div>

                      {/* Funding Transaction */}
                      <div className="group">
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Transacción de Financiamiento
                        </label>
                        <div className="relative">
                          <div className="bg-slate-100 backdrop-blur-sm rounded-xl p-3 border border-slate-200 group-hover:border-emerald-300 transition-all duration-300">
                            <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                              {walletInfo.fundTxHash}
                            </p>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Security Warning */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl"></div>
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl border border-amber-200"></div>
                  <div className="relative p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-amber-700 mb-1">Aviso de Seguridad Importante</h4>
                        <div className="space-y-1 text-amber-800 text-sm">
                          <p className="leading-relaxed">
                            Tu clave privada ha sido guardada de forma segura en tu dispositivo.
                          </p>
                          <p className="leading-relaxed">
                            <strong className="text-amber-900">¡NUNCA compartas esta clave con nadie!</strong>
                            Se muestra aquí únicamente para propósitos de demostración.
                          </p>
                          <p className="text-xs text-amber-700">
                            Tip: Guarda esta información en un lugar seguro antes de continuar.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Enhanced Complete Button */}              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-2 flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={completeRegistration}
                  className="w-64 bg-gradient-to-r from-emerald-500 via-emerald-600 to-primary-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-primary-700 text-white font-bold text-lg py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-button hover:shadow-button-hover flex items-center justify-center group"
                >
                  <span>Completar Registro</span>
                </motion.button></motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Login Link */}
      {switchToLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-4"
        >
          <div className="relative">
            <p className="text-slate-600 text-base">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={switchToLogin}
                className="text-primary-600 hover:text-primary-700 font-semibold transition-all duration-300 hover:underline decoration-2 underline-offset-2 relative group"
              >
                Inicia sesión aquí
                <span className="absolute inset-0 bg-primary-100 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 -m-1"></span>
              </button>
            </p>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center mt-4">
        <p className="text-gray-500 text-sm">
          Powered by blockchain technology for transparent and secure voting
        </p>
      </div>
    </motion.div>
  </div>
  );
};

export default Register;
