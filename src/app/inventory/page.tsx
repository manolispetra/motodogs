'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { COLLECTION_STATS } from '../../config/nfts';

interface Purchase {
  nftId: number;
  nftName: string;
  nftImage: string;
  address: string;
  txHash: string;
  timestamp: number;
  mdogTokens: number;
}

export default function InventoryPage() {
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
      .filter(p => p.address === address)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    setPurchases(allPurchases);
  };

  useEffect(() => {
    connect();
  }, []);

  const totalMDOG = purchases.length * COLLECTION_STATS.airdropPerNFT;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          MY INVENTORY
        </h1>

        {!isConnected ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-6">Connect your wallet to view your inventory</p>
            <button 
              onClick={connect}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold hover:scale-105 transition"
            >
              CONNECT WALLET
            </button>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">No MotoDogs minted yet</p>
            <Link href="/" className="inline-block mt-6 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold hover:scale-105 transition">
              MINT NOW
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-2xl p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Total MotoDogs</p>
                  <p className="text-3xl font-black text-cyan-400">{purchases.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total MDOG Tokens (on May 22)</p>
                  <p className="text-3xl font-black text-purple-400">{totalMDOG.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {purchases.map((purchase, idx) => (
                <motion.div
                  key={idx}
                  className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="aspect-square bg-black p-4">
                    <img src={purchase.nftImage} alt={purchase.nftName} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-black mb-2">{purchase.nftName}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {new Date(purchase.timestamp).toLocaleDateString()}
                    </p>
                    
                    <div className="bg-black/50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500">TX Hash</p>
                      <a 
                        href={`https://mempool.space/tx/${purchase.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono break-all"
                      >
                        {purchase.txHash.slice(0, 16)}...{purchase.txHash.slice(-8)}
                      </a>
                    </div>
                    
                    <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                      <p className="text-sm font-bold text-purple-400">+ {purchase.mdogTokens.toLocaleString()} MDOG</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
