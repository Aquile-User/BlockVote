import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Vote,
  Users,
  Clock,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Wallet,
  ExternalLink
} from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { getElectionById, getResults, submitVote, hasVoted } from "../api";
import { CONFIG } from "../config";

// Utility function to get total registered users
const getTotalRegisteredUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/users');
    const users = await response.json();
    return Object.keys(users).length;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return 6; // Fallback to known user count
  }
};

const ElectionDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const electionId = Number(id);

  const [election, setElection] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfirmVote, setShowConfirmVote] = useState(false);
  useEffect(() => {
    loadElectionData();
  }, [electionId, user]);
  const loadElectionData = async () => {
    try {
      setLoading(true);

      // Get real election data from API - aprovechando el caché para getResults
      const [electionData, resultsData, totalRegisteredUsers] = await Promise.all([
        getElectionById(electionId),
        getResults(electionId),
        getTotalRegisteredUsers()
      ]);

      // Determine election status based on time and disabled flag
      const currentTime = Date.now() / 1000; // Current time in seconds
      let status;
      if (electionData.disabled) {
        status = "disabled";
      } else if (currentTime < electionData.startTime) {
        status = "upcoming";
      } else if (currentTime > electionData.endTime) {
        status = "expired";
      } else {
        status = "active";
      }

      // Format election data
      const formattedElection = {
        electionId: electionData.electionId,
        name: electionData.name,
        description: "Vote for the next leader of the Dominican Republic",
        startDate: new Date(electionData.startTime * 1000).toISOString(),
        endDate: new Date(electionData.endTime * 1000).toISOString(),
        startTime: electionData.startTime,
        endTime: electionData.endTime,
        status: status,
        location: "Dominican Republic",
        type: "presidential",
        totalVoters: totalRegisteredUsers,
        candidates: electionData.candidates
      };

      setElection(formattedElection);
      setResults(resultsData);

      // Check if user has already voted using blockchain data (priority)
      if (user?.socialId) {
        try {
          const votingStatus = await hasVoted(electionId, user.socialId);
          setHasVoted(votingStatus.hasVoted);
          // Clear localStorage if blockchain says not voted (contract might have been redeployed)
          if (!votingStatus.hasVoted) {
            const votedKey = `voted-${user.socialId}-${electionId}`;
            localStorage.removeItem(votedKey);
          }
        } catch (error) {
          console.error('Error checking voting status:', error);
          // Use localStorage as fallback if blockchain check fails
          const votedKey = `voted-${user.socialId}-${electionId}`;
          const localVoted = localStorage.getItem(votedKey) === 'true';

          // If we have local storage indicating the user voted, trust it
          // since blockchain verification failed (network issues, etc.)
          if (localVoted) {
            setHasVoted(true);
            console.log('Using localStorage voting status due to blockchain verification failure');
          } else {
            // Only set to false if localStorage also says not voted
            setHasVoted(false);
          }
        }
      }

    } catch (error) {
      console.error('Error loading election:', error);
      toast.error('Failed to load election details');
      // Fallback to mock data if API fails
      const totalUsers = await getTotalRegisteredUsers();
      const mockElection = {
        electionId: 1,
        name: "Presidential Election 2024",
        description: "Vote for the next President of the Dominican Republic",
        startDate: "2024-01-15T09:00:00Z",
        endDate: "2024-01-15T18:00:00Z",
        status: "active",
        location: "Dominican Republic",
        type: "presidential",
        totalVoters: totalUsers,
        candidates: ["Candidate A", "Candidate B"]
      };

      const mockResults = {
        "Candidate A": 2,
        "Candidate B": 1
      };

      setElection(mockElection);
      setResults(mockResults);
    } finally {
      setLoading(false);
    }
  };
  const handleVoteSubmit = (e) => {
    e.preventDefault();

    if (!selectedCandidate) {
      toast.error("Please select a candidate");
      return;
    }

    if (!user) {
      toast.error("Please register first");
      return;
    }

    setShowConfirmVote(true);
  };

  const handleVote = async () => {
    try {
      setVoting(true);
      setShowConfirmVote(false);

      let signature;
      let voterAddress;

      // Handle different authentication methods
      if (user.authMethod === 'metamask') {
        // Use MetaMask for signing
        if (!window.ethereum) {
          throw new Error("MetaMask not found");
        } const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        voterAddress = await signer.getAddress();

        console.log('MetaMask address:', voterAddress);
        console.log('Registered address:', user.address);

        // Verify the signer address matches the user's registered address
        if (voterAddress.toLowerCase() !== user.address.toLowerCase()) {
          throw new Error(`MetaMask account (${voterAddress}) doesn't match registered address (${user.address}). Please switch to the correct account in MetaMask.`);
        }        // Create message hash for signing
        const contractAddress = CONFIG.CONTRACT_ADDRESS;
        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "string", "address", "address"],
          [electionId, selectedCandidate, voterAddress, contractAddress]
        );

        console.log('Signing data:', {
          electionId,
          selectedCandidate,
          voterAddress,
          contractAddress,
          messageHash
        });

        // Sign with MetaMask
        signature = await signer.signMessage(ethers.getBytes(messageHash));
        console.log('Generated signature:', signature);

      } else if (user.authMethod === 'generated') {
        // Use stored private key
        const stored = JSON.parse(localStorage.getItem(`user-${user.socialId}`));
        if (!stored || !stored.privateKey) {
          throw new Error("No private key found. Please re-register.");
        }

        const wallet = new ethers.Wallet(stored.privateKey);
        voterAddress = wallet.address;

        // Create message hash for signing
        const contractAddress = CONFIG.CONTRACT_ADDRESS;
        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "string", "address", "address"],
          [electionId, selectedCandidate, voterAddress, contractAddress]
        );

        // Sign the message
        signature = await wallet.signMessage(ethers.getBytes(messageHash));
      } else {
        throw new Error("Unknown authentication method");
      }      // Submit vote
      const response = await submitVote({
        socialId: user.socialId,
        electionId: electionId,
        selectedCandidate: selectedCandidate,
        signature: signature,
      });

      console.log('Vote response:', response);

      if (response.error) {
        throw new Error(response.error);
      }      // Mark as voted locally (backup)
      const votedKey = `voted-${user.socialId}-${electionId}`;
      localStorage.setItem(votedKey, 'true');

      // Store transaction hash for later reference
      if (response.txHash) {
        localStorage.setItem(`txHash-${user.socialId}-${electionId}`, response.txHash);
      }

      // Update voting status immediately 
      setHasVoted(true);// Show success message with transaction hash
      const txHash = response.txHash || 'Transaction submitted';
      if (response.txHash) {
        // Create a custom toast with clickable explorer link
        toast.success(
          <div>
            Vote submitted successfully!<br />
            <a
              href={`https://www.megaexplorer.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              View on MegaETH Explorer: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>,
          { duration: 10000 } // Show for 10 seconds
        );
      } else {
        toast.success(`Vote submitted successfully! TX: ${txHash}`);
      }

      // Refresh results after a short delay
      setTimeout(async () => {
        await loadElectionData();
      }, 3000);

    } catch (error) {
      console.error('Voting error:', error);
      toast.error(error.message || "Vote submission failed");
    } finally {
      setVoting(false);
    }
  };

  const getVotePercentage = (candidate) => {
    if (!results) return 0;
    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
    return totalVotes > 0 ? (results[candidate] / totalVotes * 100) : 0;
  };

  const getTotalVotes = () => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, count) => sum + count, 0);
  };

  const getChartOption = () => {
    if (!results) return {};

    const data = Object.entries(results).map(([name, votes]) => ({
      value: votes,
      name: name
    }));

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Live Results',
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        textStyle: {
          color: '#ffffff'
        },
        formatter: '{a} <br/>{b}: {c} votes ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        textStyle: {
          color: '#9ca3af'
        }
      },
      series: [
        {
          name: 'Votes',
          type: 'pie',
          radius: ['50%', '80%'],
          center: ['50%', '45%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            color: '#ffffff',
            formatter: '{b}\n{d}%'
          },
          itemStyle: {
            color: (params) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
              return colors[params.dataIndex % colors.length];
            }
          }
        }
      ]
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Election Not Found</h2>
        <p className="text-gray-600 mb-6">The election you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/elections')} className="btn-primary">
          Back to Elections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/elections')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{election.name}</h1>
            <p className="text-gray-500">Election #{election.electionId} • {election.type.charAt(0).toUpperCase() + election.type.slice(1)}</p>
          </div>
        </div>

        <div className={`
          px-4 py-1.5 rounded-full font-medium
          ${election.status === 'active' ? 'bg-green-100 text-green-600 border border-green-300' :
            election.status === 'upcoming' ? 'bg-blue-100 text-blue-600 border border-blue-300' :
              election.status === 'expired' ? 'bg-gray-100 text-gray-600 border border-gray-300' :
                'bg-red-100 text-red-600 border border-red-300'}
        `}>
          {election.status === 'active' ? 'Active' :
            election.status === 'upcoming' ? 'Upcoming' :
              election.status === 'expired' ? 'Ended' : 'Disabled'}
        </div>
      </div>

      {/* Election Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Vote for the next leader of the Dominican Republic</h2>
              <p className="text-gray-600">{election.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 flex items-center space-x-4 border border-blue-200 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">Start Date</p>
                  <p className="text-gray-800 font-semibold">{formatDate(election.startDate)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 flex items-center space-x-4 border border-yellow-200 shadow-sm">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">End Date</p>
                  <p className="text-gray-800 font-semibold">{formatDate(election.endDate)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 flex items-center space-x-4 border border-green-200 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">Location</p>
                  <p className="text-gray-800 font-semibold">{election.location}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 flex items-center space-x-4 border border-purple-200 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">Registered Voters</p>
                  <p className="text-gray-800 font-semibold">{election.totalVoters.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voting Form */}
          {!hasVoted && election.status === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Vote className="w-6 h-6 text-primary-600" />
                <span>Cast Your Vote</span>
              </h2>

              <form onSubmit={handleVoteSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select a candidate:
                  </label>
                  <div className="space-y-4">
                    {election.candidates.map((candidate) => (
                      <label
                        key={candidate}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedCandidate === candidate
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          value={candidate}
                          checked={selectedCandidate === candidate}
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedCandidate === candidate
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-400'
                          }`}>
                          {selectedCandidate === candidate && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-lg">{candidate}</p>
                          <p className="text-gray-600 text-sm">
                            Current votes: <span className="text-primary-600 font-medium">{results?.[candidate] || 0}</span> (<span className="text-primary-600">{getVotePercentage(candidate).toFixed(1)}%</span>)
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={voting || !selectedCandidate}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {voting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Vote...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Submit Secure Vote</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}          {/* Vote Confirmation */}
          {hasVoted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border-2 border-green-400 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Vote Successfully Cast!</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Your vote has been securely recorded on the blockchain. Thank you for participating in this election.
              </p>

              {localStorage.getItem(`txHash-${user?.socialId}-${electionId}`) && (
                <a
                  href={`https://www.megaexplorer.xyz/tx/${localStorage.getItem(`txHash-${user?.socialId}-${electionId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 mt-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View transaction on MegaETH Explorer</span>
                </a>
              )}
            </motion.div>
          )}

          {/* Expired Election Message */}
          {election.status === 'expired' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-2 border-gray-400 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Election Has Ended</h2>
              </div>
              <p className="text-gray-600">
                This election ended on {new Date(election.endTime * 1000).toLocaleString()}.
                Voting is no longer available, but you can view the final results below.
              </p>
            </motion.div>
          )}

          {/* Upcoming Election Message */}
          {election.status === 'upcoming' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-2 border-blue-400 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Election Starts Soon</h2>
              </div>
              <p className="text-gray-600">
                This election will begin on {new Date(election.startTime * 1000).toLocaleString()}.
                Please check back when voting opens.
              </p>
            </motion.div>
          )}

          {/* Disabled Election Message */}
          {election.status === 'disabled' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-2 border-red-400 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Election Disabled</h2>
              </div>
              <p className="text-gray-600">
                This election has been temporarily disabled by administrators.
                Voting is currently not available.
              </p>
            </motion.div>
          )}
        </div>

        {/* Results Sidebar */}
        <div className="space-y-6">
          {/* Live Results Chart */}          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Election Statistics</h3>
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-100 rounded-xl p-4 border border-primary-200 text-center">
                <p className="text-4xl font-bold text-primary-700">{getTotalVotes()}</p>
                <p className="text-primary-600 font-medium mt-1">Total Votes</p>
              </div>

              <div className="bg-green-100 rounded-xl p-4 border border-green-200 text-center">
                <p className="text-4xl font-bold text-green-700">
                  {election.totalVoters > 0 ? Math.round((getTotalVotes() / election.totalVoters) * 100) : 0}%
                </p>
                <p className="text-green-600 font-medium mt-1">Participation</p>
              </div>

              <div className="bg-amber-100 rounded-xl p-4 border border-amber-200 text-center">
                <p className="text-4xl font-bold text-amber-700">{election.candidates.length}</p>
                <p className="text-amber-600 font-medium mt-1">Candidates</p>
              </div>

              <div className="bg-purple-100 rounded-xl p-4 border border-purple-200 text-center">
                <p className="text-4xl font-bold text-purple-700">
                  {results && Object.values(results).length > 0 ?
                    Math.max(...Object.values(results)) : 0}
                </p>
                <p className="text-purple-600 font-medium mt-1">Highest Votes</p>
              </div>
            </div>
          </motion.div>

          {/* Detailed Results */}          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Vote className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-bold text-gray-800">Detailed Results</h3>
            </div>

            <div className="space-y-5">
              {election.candidates.map((candidate, index) => {
                const votes = results?.[candidate] || 0;
                const percentage = getVotePercentage(candidate); const colorsClasses = [
                  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-300' },
                  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', light: 'bg-emerald-300' },
                  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', light: 'bg-amber-300' },
                  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', light: 'bg-purple-300' },
                  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', light: 'bg-pink-300' }
                ];
                const colorClass = colorsClasses[index % colorsClasses.length];

                return (
                  <div key={candidate} className={`bg-white rounded-xl p-4 border ${colorClass.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg text-gray-800">{candidate}</span>
                      <span className={`${colorClass.text} font-medium ${colorClass.bg} px-3 py-1 rounded-full`}>
                        {votes} votes
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                        className={`${colorClass.light} h-5 rounded-full`}
                      />
                    </div>

                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600 text-sm">{Math.round(percentage)}% completed</span>
                      <span className={`${colorClass.text} font-medium`}>{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Blockchain Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <span>Blockchain Security</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-600">Network:</span>
                <span className="text-gray-800 font-medium bg-blue-100 px-3 py-1 rounded-full text-sm">MegaETH Testnet</span>
              </div>

              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-600">Contract:</span>
                <span className="text-gray-800 font-mono text-xs bg-gray-100 px-3 py-1 rounded-full">
                  {CONFIG.CONTRACT_ADDRESS.slice(0, 8)}...{CONFIG.CONTRACT_ADDRESS.slice(-6)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-600">Security:</span>
                <span className="text-gray-800 font-medium bg-green-100 px-3 py-1 rounded-full text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Verified
                </span>
              </div>
            </div>

            <a
              href={`https://www.megaexplorer.xyz/address/${CONFIG.CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 w-full mt-4 flex items-center justify-center space-x-2 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Explorer</span>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Vote Confirmation Modal */}
      <AnimatePresence>
        {showConfirmVote && (<motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirmVote(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-200 pb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Vote className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm Your Vote</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3 font-medium">You are about to vote for:</p>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg shadow-inner">
                <p className="text-gray-800 font-semibold text-lg">{selectedCandidate}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-700 font-medium">Important Notice</h4>
                  <p className="text-gray-700 mt-1">
                    Your vote will be permanently recorded on the blockchain and cannot be changed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmVote(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex-1 border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={voting}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Voting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Confirm Vote</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElectionDetail;
