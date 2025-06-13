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
  };
  return (
    <div className="w-full">
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/50 p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary-500 to-coral-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-100 to-primary-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-coral-100 to-violet-100 rounded-full blur-2xl opacity-40"></div>        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8 relative z-10"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-emerald-700 to-slate-800 bg-clip-text text-transparent mb-3">
            Crear Cuenta
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Únete a <span className="text-emerald-600 font-semibold">BlockVote</span> y participa
          </p>

          {/* Enhanced Progress Indicator */}
          <div className="flex items-center justify-center space-x-3 mt-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= stepNum
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-soft'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                  {step > stepNum ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNum
                  )}
                  {step === stepNum && (
                    <div className="absolute inset-0 bg-emerald-500 rounded-2xl opacity-20 animate-ping"></div>
                  )}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 rounded-full transition-all duration-500 ${step > stepNum
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-slate-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-soft">
          <div className="relative z-10">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Información Personal</h2>
                  <p className="text-slate-600">Ingresa tus datos para comenzar</p>
                </div>              {/* Name Input */}
                <div className="relative">
                  <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
                    <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <User className="w-3 h-3 text-emerald-600" />
                    </div>
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder-slate-400 font-medium"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-primary-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                {/* Dominican ID Input */}              <div className="relative">
                  <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
                    <div className="w-5 h-5 bg-primary-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-primary-600" />
                    </div>
                    Cédula Dominicana
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder-slate-400 font-mono"
                      placeholder="000-0000000-0"
                      value={formData.socialId}
                      onChange={(e) => handleInputChange('socialId', formatIdInput(e.target.value))}
                      maxLength="13"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-primary-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {!validateDominicanID(formData.socialId) && formData.socialId && (
                    <p className="text-xs text-rose-500 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Formato requerido: 000-0000000-0
                    </p>
                  )}
                </div>

                {/* Province Selection */}              <div className="relative">
                  <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
                    <div className="w-5 h-5 bg-coral-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-coral-600" />
                    </div>
                    Provincia
                  </label>
                  <div className="relative">
                    <select
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 font-medium appearance-none bg-no-repeat bg-right pr-12"
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
                  className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-primary-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-primary-700 text-white font-semibold text-lg py-4 px-6 rounded-2xl transition-all duration-300 shadow-button hover:shadow-button-hover flex items-center justify-center space-x-3 group"
                >
                  <span>Continuar</span>
                </motion.button>
              </motion.div>
            )}          {/* Step 2: Enhanced Authentication Method */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4"
                  >                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                      <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>                  <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-slate-900 mb-3"
                  >
                    Elige tu Método de Autenticación
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-600 text-lg"
                  >
                    Selecciona cómo quieres proteger tu billetera y votos
                  </motion.p>
                </div>

                <div className="space-y-6">
                  {/* Enhanced MetaMask Option */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`group relative overflow-hidden ${metamaskAvailable
                      ? 'cursor-pointer hover:scale-[1.02]'
                      : 'opacity-50 cursor-not-allowed'
                      } transition-all duration-300`}
                  >                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl border border-orange-200"></div>
                    <div className="relative p-8">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg">
                            <Wallet className="w-8 h-8 text-white" />
                          </div>
                          {metamaskAvailable && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">                          <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
                            Conectar MetaMask
                            {!metamaskAvailable && (
                              <span className="ml-3 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full border border-red-200">
                                No disponible
                              </span>
                            )}
                          </h3>
                          <p className="text-slate-700 text-base leading-relaxed mb-6">
                            Usa tu billetera MetaMask existente para una experiencia segura y familiar.
                            Ideal si ya tienes experiencia con blockchain.
                          </p>
                          <div className="flex items-center space-x-4">
                            <motion.button
                              whileHover={metamaskAvailable ? { scale: 1.05 } : {}}
                              whileTap={metamaskAvailable ? { scale: 0.95 } : {}}
                              onClick={connectMetaMask}
                              disabled={!metamaskAvailable || loading}
                              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${metamaskAvailable
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-soft hover:shadow-glow'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              {loading ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Conectando...</span>
                                </div>
                              ) : (
                                'Conectar MetaMask'
                              )}
                            </motion.button>                            {metamaskAvailable && (
                              <div className="flex items-center space-x-2 text-emerald-700 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Disponible</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>                  {/* Enhanced Generated Wallet Option */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="group relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl border border-primary-200"></div>
                    <div className="relative p-8">
                      <div className="flex items-start space-x-6">
                        <div className="relative">                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-3xl flex items-center justify-center shadow-lg">
                          <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">                          <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
                            Generar Billetera Nueva
                            <span className="ml-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full border border-emerald-200">
                              Recomendado
                            </span>
                          </h3>
                          <p className="text-slate-700 text-base leading-relaxed mb-6">
                            Crea una nueva billetera segura automáticamente financiada para votar.
                            Perfecto para usuarios nuevos en blockchain.
                          </p>
                          <div className="space-y-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={generateWallet}
                              disabled={loading}
                              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50"
                            >
                              {loading ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Generando...</span>
                                </div>
                              ) : (
                                'Generar Billetera'
                              )}
                            </motion.button>                            <div className="flex items-center space-x-2 text-emerald-700 text-sm">
                              <Check className="w-4 h-4" />
                              <span>Financiamiento automático incluido</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="pt-8 border-t border-slate-200"
                >                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
                  >
                    <span>Volver a información personal</span>
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Enhanced Wallet Information */}
            {step === 3 && walletInfo && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-slate-900 mb-3"
                  >
                    ¡Billetera Creada Exitosamente!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-600 text-lg"
                  >
                    Tu billetera ha sido financiada y está lista para usar
                  </motion.p>
                </div>

                {/* Enhanced Wallet Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-6"
                >                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl border border-primary-200"></div>
                    <div className="relative p-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                        <Wallet className="w-6 h-6 mr-3 text-primary-600" />
                        Información de tu Billetera
                      </h3>

                      <div className="space-y-6">
                        {/* Address */}                        <div className="group">
                          <label className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-3 block">
                            Dirección de Billetera
                          </label>
                          <div className="relative">
                            <div className="bg-slate-100 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 group-hover:border-primary-300 transition-all duration-300">
                              <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                                {walletInfo.address}
                              </p>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                          </div>
                        </div>                        {/* Private Key */}
                        <div className="group">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                              Clave Privada
                            </label>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-xl transition-all duration-200 border border-primary-200"
                            >
                              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              <span className="text-sm font-medium">{showPrivateKey ? 'Ocultar' : 'Mostrar'}</span>
                            </motion.button>
                          </div>
                          <div className="relative">
                            <div className="bg-slate-100 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 group-hover:border-amber-300 transition-all duration-300">
                              <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                                {showPrivateKey ? walletInfo.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                              </p>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                          </div>
                        </div>

                        {/* Funding Transaction */}
                        <div className="group">
                          <label className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-3 block">
                            Transacción de Financiamiento
                          </label>                          <div className="relative">
                            <div className="bg-slate-100 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 group-hover:border-emerald-300 transition-all duration-300">
                              <p className="font-mono text-slate-800 break-all text-sm leading-relaxed">
                                {walletInfo.fundTxHash}
                              </p>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Security Warning */}                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl border border-amber-200"></div>
                    <div className="relative p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-amber-700 mb-3">Aviso de Seguridad Importante</h4>
                          <div className="space-y-2 text-amber-800">
                            <p className="leading-relaxed">
                              Tu clave privada ha sido guardada de forma segura en tu dispositivo.
                            </p>
                            <p className="leading-relaxed">
                              <strong className="text-amber-900">¡NUNCA compartas esta clave con nadie!</strong>
                              Se muestra aquí únicamente para propósitos de demostración.
                            </p>
                            <p className="text-sm text-amber-700">
                              Tip: Guarda esta información en un lugar seguro antes de continuar.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Enhanced Complete Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="pt-4"
                >                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={completeRegistration}
                    className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-primary-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-primary-700 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 shadow-button hover:shadow-button-hover flex items-center justify-center space-x-3 group"
                  >
                    <Check className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Completar Registro</span>
                  </motion.button>
                </motion.div>            </motion.div>
            )}
          </div>
        </div>        {/* Login Link */}
        {switchToLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-6"
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
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Powered by blockchain technology for transparent and secure voting
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
