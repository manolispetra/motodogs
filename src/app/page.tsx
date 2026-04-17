'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Wallet as WalletIcon, Loader2, Zap, Target, Rocket, Twitter } from 'lucide-react';
import { MOTODOGS, PRESALE_WALLET, COLLECTION_STATS, MotoDog } from '../config/nfts';
import Link from 'next/link';
import PurchaseTicker from '../components/PurchaseTicker';

const AMOUNT_SATS = 7442;
const AMOUNT_BTC = (AMOUNT_SATS / 100000000).toFixed(8);

// Discord icon
const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 71 55" fill="currentColor">
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
  </svg>
);

export default function HomePage() {
  const [account, setAccount] = useState<{ address: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<MotoDog | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [totalMinted, setTotalMinted] = useState(0);

  useEffect(() => {
    const targetDate = new Date('2026-05-22T00:00:00Z').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const purchases = Object.keys(localStorage).filter(key => key.startsWith('purchase_')).length;
      setTotalMinted(purchases);
    }
  }, []);

  const getWallet = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).opnet || (window as any).unisat;
  };

  const connect = async () => {
    try {
      const wallet = getWallet();
      
      if (!wallet) {
        alert('Please install OP_WALLET or UniSat Wallet!');
        window.open('https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb', '_blank');
        return;
      }

      const accounts = await wallet.requestAccounts();
      
      if (accounts && accounts[0]) {
        setAccount({ address: accounts[0] });
        setIsConnected(true);
        console.log('✅ Connected:', accounts[0]);
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      alert('Connection failed: ' + error.message);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
  };

  const handleBuy = (nft: MotoDog) => {
    if (!isConnected) {
      connect();
      return;
    }
    setSelectedNFT(nft);
  };

  const handlePrebuy = async () => {
    const wallet = getWallet();
    
    if (!wallet) {
      alert("Please install OP_WALLET or UniSat Wallet!");
      return;
    }

    if (!account || !account.address) {
      alert("Please connect your wallet first!");
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Calling OpNet sendBitcoin via _request...');
      console.log('From:', account.address);
      console.log('To:', PRESALE_WALLET);
      console.log('Amount:', AMOUNT_SATS, 'sats');
      
      // Correct OpNet wallet payment method
      const txid = await wallet._request({
        method: "sendBitcoin",
        params: {
          from: account.address,
          to: PRESALE_WALLET,
          amount: AMOUNT_SATS.toString(),
          utxos: [],
          feeRate: 2,
          priorityFee: "0"
        }
      });
      
      console.log('✅ TX SUCCESS:', txid);
      alert(`✅ Payment Successful!\n\nTransaction ID:\n${txid}\n\nYour MotoDog NFT will be minted and sent to your wallet within 24 hours!`);
      
      if (selectedNFT && account) {
        const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(purchaseId, JSON.stringify({
          nftId: selectedNFT.id,
          nftName: selectedNFT.name,
          nftImage: selectedNFT.image,
          address: account.address,
          txHash: txid,
          timestamp: Date.now(),
          mdogTokens: COLLECTION_STATS.airdropPerNFT
        }));
        
        setTotalMinted(prev => prev + 1);
      }
      
      setSelectedNFT(null);
      
    } catch (error: any) {
      console.error('❌ TX Error:', error);
      
      if (error.code === 4001 || error.message?.includes("reject") || error.message?.includes("cancel")) {
        alert("❌ Payment Cancelled\n\nYou rejected the transaction.");
      } else {
        alert("❌ Payment Failed\n\n" + (error.message || "Transaction failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const closePurchaseModal = () => {
    setSelectedNFT(null);
    setLoading(false);
  };

  const scrollToSection = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  };

  const getUserMDOG = () => {
    if (!account || typeof window === 'undefined') return 0;
    const userPurchases = Object.keys(localStorage)
      .filter(key => key.startsWith('purchase_'))
      .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
      .filter(p => p.address === account.address);
    return userPurchases.length * COLLECTION_STATS.airdropPerNFT;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        {typeof window !== 'undefined' && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -100,
              rotate: Math.random() * 360 
            }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: Math.random() * 360 + 360
            }}
            transition={{ 
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <img src="/logo-new.png" alt="MotoDogs" className="h-16 w-16" />
              <div>
                <h1 className="text-2xl font-black tracking-tight">MOTODOGS</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('story')} className="text-sm font-semibold hover:text-cyan-400 transition">STORY</button>
              <button onClick={() => scrollToSection('collection')} className="text-sm font-semibold hover:text-cyan-400 transition">COLLECTION</button>
              <button onClick={() => scrollToSection('roadmap')} className="text-sm font-semibold hover:text-cyan-400 transition">ROADMAP</button>
              <Link href="/inventory" className="text-sm font-semibold hover:text-cyan-400 transition">MY INVENTORY</Link>
              <Link href="/airdrop" className="text-sm font-semibold hover:text-cyan-400 transition">AIRDROP</Link>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://x.com/MOTODOGSCLUB" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition">
                <Twitter size={20} />
              </a>
              <a href="https://discord.gg/fvhk39mW" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition">
                <DiscordIcon />
              </a>

              {isConnected && account ? (
                <div className="hidden md:flex items-center gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-full">
                    <p className="font-mono text-xs">{account.address.slice(0,6)}...{account.address.slice(-4)}</p>
                    {getUserMDOG() > 0 && (
                      <p className="text-[10px] text-purple-400 mt-1">{getUserMDOG().toLocaleString()} MDOG</p>
                    )}
                  </div>
                  <button onClick={disconnect} className="text-xs font-bold text-red-400 hover:text-red-300">DISCONNECT</button>
                </div>
              ) : (
                <button 
                  onClick={connect} 
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-sm hover:scale-105 transition"
                >
                  <WalletIcon size={18} /> CONNECT
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm font-mono text-cyan-400 mb-4 tracking-widest">LAUNCH IN</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { label: 'DAYS', value: countdown.days },
                { label: 'HRS', value: countdown.hours },
                { label: 'MIN', value: countdown.minutes },
                { label: 'SEC', value: countdown.seconds }
              ].map(({ label, value }) => (
                <div key={label} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-xl" />
                  <div className="relative bg-black/80 border border-cyan-400/30 rounded-2xl p-6 min-w-[100px]">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500 uppercase mt-2 tracking-widest">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="collection" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            CHOOSE YOUR LEGEND
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MOTODOGS.map((dog, i) => (
              <motion.div
                key={dog.id}
                className="group relative bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition" />
                
                <div className="relative aspect-square bg-black p-4">
                  <img src={dog.image} alt={dog.name} className="w-full h-full object-contain" />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-black/80 border border-cyan-400/50 rounded-full text-xs font-bold text-cyan-400">
                    {dog.rarity}
                  </div>
                </div>
                
                <div className="relative p-5">
                  <h3 className="text-xl font-black mb-1">{dog.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{dog.title}</p>
                  
                  <div className="flex justify-between mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Available</p>
                      <p className="text-lg font-bold text-green-400">{dog.available}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Price</p>
                      <p className="text-lg font-bold text-cyan-400">{AMOUNT_BTC} BTC</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBuy(dog)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-sm hover:scale-105 transition"
                  >
                    {!isConnected ? 'CONNECT & MINT' : 'MINT NOW'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="story" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="relative bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-cyan-400/20 rounded-3xl p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                THE LEGEND OF THE CHROME PACK
              </h2>
              
              <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                <p className="text-2xl font-bold text-cyan-400">
                  BEFORE THE MAINNET… THERE WAS THE STREET. 🏍️
                </p>

                <p>Seven strays. Seven streets. One destiny written in UTXOs and chrome.</p>

                <p className="border-l-2 border-cyan-400/40 pl-6 italic text-gray-400">
                  On <span className="text-cyan-400 font-semibold not-italic">March 19, 2026</span>, Bitcoin woke up smart. OP_NET went live on L1 — no bridges, no wrappers, no new chain. Every transaction on OP_NET <span className="text-white not-italic">is</span> a Bitcoin transaction. BTC is the gas. The founders took the credit. The streets knew better.
                </p>

                <p>These dogs were running <span className="text-cyan-400 font-semibold">P2OP</span> outputs before they had a name. Deploying kibble contracts on paper napkins. Settling beefs in sats, finalizing them in epochs. They didn't wait for consensus. They <span className="italic">were</span> consensus.</p>

                <p><span className="text-cyan-400 font-black">DIESEL DUKE</span> — The OG Bulldog. Coded Bitcoin before Satoshi made it cool. Rolled a Harley with a hardware wallet strapped to the tank. Legend says he mined the first block on a pocket calculator in '08 and deployed the first OP-20 on a bar napkin the night before mainnet. Nobody believed him. They do now. 💎</p>

                <p><span className="text-purple-400 font-black">MIDNIGHT HOWLER</span> — Husky hacker. Dark web drifter. Cracked post-quantum <span className="font-mono text-sm text-purple-300">MLDSA</span> on a laptop powered by three Red Bulls and spite — then handed the exploit back with a sticky note: "patch it, bark at me if you need me." Disappeared into the mempool in 2014. Some say he's still there, trading OP-20s from the shadow nodes. 🌙</p>

                <p><span className="text-yellow-400 font-black">TINY THUNDER</span> — Chihuahua. God complex. Lambo fund. Day-traded his way from food stamps to Forbes farming <span className="text-yellow-300 font-semibold">$PILL</span> on <span className="text-yellow-300 font-semibold">MotoSwap</span>. Lost it all on LUNA. Made it back on the next epoch. "Slow blocks, fast money" — tattooed on his left paw. Respect the hustle. ⚡</p>

                <p><span className="text-orange-400 font-black">BEACH BARKER</span> — Golden Retriever. DeFi influencer before Instagram existed. Surfed, deployed yield farms at sunset, retired at 25 with zero wrapped BTC in his bag. His only tweet: <span className="italic">"Why wrap Bitcoin when Bitcoin is the gas?"</span> — 47k retweets. Now teaches native DeFi to dolphins. Living the dream. 🏖️</p>

                <p><span className="text-pink-400 font-black">ROSA ROCKET</span> — Poodle princess. Punk rocker. Protocol pioneer. Authored the first dog-to-dog OP-20 payment channel before OP_NET had a website. "Venmo? Nah, <span className="italic">WOOF-mo</span> — settled on L1, finalized in one epoch, no custodian, no daddy." She said it first. 💅</p>

                <p><span className="text-gray-300 font-black">SHADOW STRIDER</span> — The silent Husky. No socials. No fucks. Just code, black coffee, cold wallets, and a <span className="text-gray-100 font-semibold">Proof of Calculation</span> rig running in a cabin no one can find. Rumor has it he holds 10% of all Bitcoin. Rumor has it he doesn't exist. Rumor has it you're looking at him right now. 👁️</p>

                <p><span className="text-red-400 font-black">DUKE JR.</span> — The son who surpassed the father. Diesel taught him Solidity. He taught the world Rust. Then OP_NET taught him AssemblyScript — and he taught the VM. The cycle continues on Bitcoin itself. 🔥</p>

                <p className="text-3xl font-black text-center mt-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                  7777 SLOTS. 7 LEGENDS. 1 BLOCKCHAIN.<br/>
                  NO BRIDGES. NO WRAPPERS. PURE BITCOIN. 🐾⚡
                </p>

                <p className="text-center text-xl text-gray-400 mt-6">
                  Ride or die. No paper paws. Diamond collars only.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="roadmap" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            THE ROADMAP
          </h2>
          
          <div className="space-y-6">
            {[
              { icon: Zap, title: 'Q2 2025: IGNITION', items: ['7777 MotoDogs Presale', '2,000 MDOG per NFT', 'Community Discord Launch'] },
              { icon: Rocket, title: 'MAY 22 2026: LIFTOFF', items: ['NFT Delivery', 'MDOG Airdrop', 'OpNet Mainnet Integration', 'Staking Goes Live'] },
              { icon: Target, title: 'Q3-Q4 2026: DOMINATION', items: ['Secondary Market Launch', 'MotoDogs DAO', 'Exclusive Merch Drop', 'Gen 2 Teaser'] }
            ].map((phase, idx) => (
              <motion.div
                key={idx}
                className="flex gap-6"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-2xl flex items-center justify-center">
                    <phase.icon size={24} className="text-cyan-400" />
                  </div>
                </div>
                
                <div className="flex-1 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-cyan-400/20 rounded-2xl p-6">
                  <h3 className="text-2xl font-black mb-4 text-cyan-400">{phase.title}</h3>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePurchaseModal}
          >
            <motion.div
              className="relative bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-3xl max-w-md w-full p-8"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 blur-xl rounded-3xl" />
              
              <div className="relative">
                <h3 className="text-2xl font-black mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  CONFIRM MINT
                </h3>
                
                <div className="flex gap-6 mb-8">
                  <img src={selectedNFT.image} alt={selectedNFT.name} className="w-28 h-28 rounded-2xl border border-cyan-400/30" />
                  <div>
                    <h4 className="text-xl font-black mb-2">{selectedNFT.name}</h4>
                    <p className="text-sm text-gray-400 mb-4">{selectedNFT.title}</p>
                    <p className="text-2xl font-black text-cyan-400">{AMOUNT_BTC} BTC</p>
                    <p className="text-sm text-purple-400 mt-2">+ {COLLECTION_STATS.airdropPerNFT.toLocaleString()} MDOG</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closePurchaseModal}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold transition"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handlePrebuy}
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'MINT NOW'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchaseTicker />

      <footer className="relative border-t border-white/10 py-12 text-center">
        <p className="text-gray-500 font-mono text-sm">© 2025 MOTODOGS • BUILT ON BITCOIN OPNET</p>
        <p className="text-xs text-gray-600 mt-2">NOT FINANCIAL ADVICE • DYOR • RIDE OR DIE 🏍️</p>
      </footer>
    </div>
  );
}
