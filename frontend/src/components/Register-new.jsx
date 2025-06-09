import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { 
  Shield, 
  Wallet, 
  User, 
  MapPin, 
  CreditCard,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { registerUser } from "../api";
import { DOMINICAN_PROVINCES, validateDominicanId } from "../utils/dominican";

const Register = ({ setUser, setIsConnected }) => {
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
    if (!validateDominicanId(formData.socialId)) {
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-dark-bg to-gray-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EtherVote</h1>
          <p className="text-gray-400">Secure Blockchain Voting System</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-px ${
                    step > stepNum ? 'bg-primary' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Personal Information</h2>
                <p className="text-gray-400 text-sm">Enter your details to get started</p>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Dominican ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Dominican ID (Cédula)
                </label>
                <input
                  type="text"
                  placeholder="000-0000000-0"
                  value={formData.socialId}
                  onChange={(e) => handleInputChange('socialId', formatIdInput(e.target.value))}
                  className="input-field"
                  maxLength={13}
                />
                {formData.socialId && !validateDominicanId(formData.socialId) && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Invalid ID format. Use: 000-0000000-0
                  </div>
                )}
              </div>

              {/* Province Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Province
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select your province</option>
                  {DOMINICAN_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNext}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Authentication Method */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Choose Authentication</h2>
                <p className="text-gray-400 text-sm">Select how you want to secure your votes</p>
              </div>

              {/* MetaMask Option */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                metamaskAvailable 
                  ? 'border-gray-600 hover:border-primary bg-gray-800/30' 
                  : 'border-gray-700 bg-gray-800/20 opacity-50 cursor-not-allowed'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">
                      Connect MetaMask Wallet
                      {!metamaskAvailable && <span className="text-red-400 text-sm ml-2">(Not Available)</span>}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Use your existing MetaMask wallet for secure voting
                    </p>
                    <button
                      onClick={connectMetaMask}
                      disabled={!metamaskAvailable || loading}
                      className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Connecting...' : 'Connect MetaMask'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Wallet Option */}
              <div className="p-4 border-2 border-gray-600 hover:border-primary bg-gray-800/30 rounded-lg cursor-pointer transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">Generate New Wallet</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Create a new secure wallet automatically funded for voting
                    </p>
                    <button
                      onClick={generateWallet}
                      disabled={loading}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Wallet'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="btn-secondary w-full"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* Step 3: Wallet Information (Generated Wallet Only) */}
          {step === 3 && walletInfo && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Wallet Created Successfully!</h2>
                <p className="text-gray-400 text-sm">Your wallet has been funded and is ready to use</p>
              </div>

              {/* Wallet Details */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-medium text-white mb-3">Wallet Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Address</label>
                      <p className="font-mono text-sm text-gray-300 break-all mt-1">
                        {walletInfo.address}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Private Key</label>
                        <button
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-xs text-primary hover:text-primary-dark flex items-center space-x-1"
                        >
                          {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPrivateKey ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-sm text-gray-300 break-all mt-1">
                        {showPrivateKey ? walletInfo.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Funding Transaction</label>
                      <p className="font-mono text-sm text-gray-300 break-all mt-1">
                        {walletInfo.fundTxHash}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Warning */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-400 mb-1">Important Security Notice</h4>
                      <p className="text-amber-200 text-sm">
                        Your private key has been saved securely. Never share it with anyone. 
                        This is shown here for testing purposes only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={completeRegistration}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Complete Registration</span>
              </button>
            </motion.div>
          )}
        </div>

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
