'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, Calendar } from 'lucide-react';
import Link from 'next/link';
import { COLLECTION_STATS } from '../../config/nfts';

interface Purchase {
  nftId: number;
  nftName: string;
  address: string;
  mdogTokens: number;
}

export default function AirdropPage() {
  const [account, setAccount] = useState<{ address: string } | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const getWallet = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).opnet || (window as any).unisat;
  };

  const connect = async () => {
    try {
      const wallet = getWallet();
      
      if (!wallet) {
        alert('Please install OP_WALLET or UniSat Wallet!');
        return;
      }

      const accounts = await wallet.requestAccounts();
      
      if (accounts && accounts[0]) {
        setAccount({ address: accounts[0] });
        setIsConnected(true);
        loadPurchases(accounts[0]);
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      alert('Connection failed: ' + error.message);
    }
  };

  const loadPurchases = (address: string) => {
    if (typeof window === 'undefined') return;
    
    const allPurchases = Object.keys(localStorage)
      .filter(key => key.startsWith('purchase_'))
      .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
      .filter(p => p.address === address);
    
    setPurchases(allPurchases);
  };

  useEffect(() => {
    connect();
  }, []);

  const totalMDOG = purchases.length * COLLECTION_STATS.airdropPerNFT;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <motion.div
            className="inline-block mb-6"
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gift size={64} className="text-purple-400" />
          </motion.div>
          
          <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            MDOG AIRDROP
          </h1>
          
          <p className="text-xl text-gray-400">
            Every preminted MotoDog NFT earns you <span className="text-purple-400 font-bold">2,000 MDOG tokens</span>
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-3xl p-12 text-center">
            <p className="text-xl text-gray-300 mb-6">Connect your wallet to check your airdrop eligibility</p>
            <button 
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold hover:scale-105 transition"
            >
              CONNECT WALLET
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <Calendar size={32} className="text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Airdrop Date</p>
                  <p className="text-2xl font-black text-purple-400">May 22, 2026</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">NFTs Minted</p>
                  <p className="text-4xl font-black text-cyan-400">{purchases.length}</p>
                </div>
                
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">MDOG per NFT</p>
                  <p className="text-4xl font-black text-purple-400">{COLLECTION_STATS.airdropPerNFT.toLocaleString()}</p>
                </div>
                
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">Total MDOG</p>
                  <p className="text-4xl font-black text-pink-400">{totalMDOG.toLocaleString()}</p>
                </div>
              </div>

              {totalMDOG > 0 ? (
                <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-6 text-center">
                  <p className="text-lg font-bold text-green-400">✅ You're eligible for the airdrop!</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Your {totalMDOG.toLocaleString()} MDOG tokens will be airdropped on May 22, 2026
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-2xl p-6 text-center">
                  <p className="text-lg font-bold text-yellow-400">⚠️ No NFTs minted yet</p>
                  <p className="text-sm text-gray-400 mt-2 mb-4">
                    Mint a MotoDog NFT to become eligible for the airdrop
                  </p>
                  <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold hover:scale-105 transition">
                    MINT NOW
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 rounded-3xl p-8">
              <h2 className="text-2xl font-black mb-4 text-cyan-400">About MDOG Token</h2>
              
              <div className="space-y-4 text-gray-300">
                <p>
                  <span className="text-white font-bold">MDOG</span> is the governance and utility token of the MotoDogs ecosystem built on OpNet.
                </p>
                
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                    <span><span className="text-white font-bold">Governance:</span> Vote on DAO proposals and shape the future of MotoDogs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <span><span className="text-white font-bold">Staking:</span> Stake your MDOG to earn rewards and exclusive benefits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mt-2" />
                    <span><span className="text-white font-bold">Utility:</span> Access exclusive features, merchandise, and Gen 2 whitelist</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
