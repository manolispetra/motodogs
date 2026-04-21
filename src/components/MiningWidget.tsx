'use client';

import {
  useState, useEffect, useRef, useCallback,
  createContext, useContext, ReactNode
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Zap, Users, Copy, Check, Clock, Twitter,
  Flame, Sparkles, TrendingUp, ArrowRight
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

export interface MiningProviderProps {
  address: string | null;
  username?: string;
  nftsOwned?: number;
  baseRate?: number;
  bonusPerReferral?: number;
  bonusPerNft?: number;
  maxOfflineHours?: number;
  onBalanceChange?: (mdog: number) => void;
  scrollTargetId?: string;
  children: ReactNode;
}

type MiningState = {
  mdog: number;
  lastTick: number;
  referrals: string[];
  sessionStart: number;
  lifetime: number;
};

const DEFAULT_STATE: MiningState = {
  mdog: 0, lastTick: 0, referrals: [], sessionStart: 0, lifetime: 0,
};

// ============================================================
// HELPERS
// ============================================================

function generateRefCode(address: string): string {
  let hash = 0;
  const input = address + 'motodogs_chrome_pack';
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars[h % chars.length];
    h = Math.floor(h / chars.length) + hash * (i + 1);
    h = Math.abs(h);
  }
  return `MOTO-${code.slice(0, 3)}${code.slice(3, 6)}`;
}

const storageKey = (addr: string) => `mdog_mining_${addr}`;

function loadMiningState(addr: string): MiningState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(storageKey(addr));
    if (!raw) return { ...DEFAULT_STATE, sessionStart: Date.now(), lastTick: Date.now() };
    const parsed = JSON.parse(raw);
    return {
      mdog: Number(parsed.mdog) || 0,
      lastTick: Number(parsed.lastTick) || Date.now(),
      referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [],
      sessionStart: Number(parsed.sessionStart) || Date.now(),
      lifetime: Number(parsed.lifetime) || Number(parsed.mdog) || 0,
    };
  } catch {
    return { ...DEFAULT_STATE, sessionStart: Date.now(), lastTick: Date.now() };
  }
}

function saveMiningState(addr: string, state: MiningState) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(storageKey(addr), JSON.stringify(state)); } catch {}
}

function fmtMDOG(n: number, decimals = 7): string {
  if (n === 0) return '0.' + '0'.repeat(decimals);
  return n.toFixed(decimals);
}

function fmtDuration(ms: number): string {
  if (ms < 60_000) return Math.floor(ms / 1000) + 's';
  if (ms < 3_600_000) return Math.floor(ms / 60_000) + 'm';
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return `${d}d ${h}h`;
}

function captureIncomingReferral() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (!ref || !/^MOTO-[A-Z0-9]{6}$/i.test(ref)) return;
    if (!localStorage.getItem('mdog_incoming_ref')) {
      localStorage.setItem('mdog_incoming_ref', ref.toUpperCase());
    }
  } catch {}
}

function registerReferralIfAny(newUserAddress: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const code = localStorage.getItem('mdog_incoming_ref');
    if (!code) return null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('mdog_mining_')) continue;
      const addr = key.substring('mdog_mining_'.length);
      if (addr === newUserAddress) continue;
      if (generateRefCode(addr) === code) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const state = JSON.parse(raw);
          if (!Array.isArray(state.referrals)) state.referrals = [];
          if (!state.referrals.includes(newUserAddress)) {
            state.referrals.push(newUserAddress);
            localStorage.setItem(key, JSON.stringify(state));
            localStorage.removeItem('mdog_incoming_ref');
            localStorage.setItem(
              `mdog_ref_notify_${addr}`,
              JSON.stringify({ newUser: newUserAddress, at: Date.now() })
            );
            return addr;
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

// ============================================================
// CONTEXT
// ============================================================

type MiningContextValue = {
  address: string | null;
  refCode: string;
  mdog: number;
  lifetime: number;
  effectiveRate: number;
  dailyRate: number;
  baseRate: number;
  bonusPerReferral: number;
  bonusPerNft: number;
  maxOfflineHours: number;
  nftsOwned: number;
  referrals: string[];
  referralCount: number;
  refBoost: number;
  nftBoost: number;
  totalMultiplier: number;
  sessionUptime: number;
  scrollTargetId: string;
  copied: boolean;
  copyLink: () => void;
  shareTwitter: () => void;
  offlineGain: number | null;
  dismissOfflineGain: () => void;
  showToast: { msg: string; type: 'milestone' | 'referral' } | null;
};

const MiningCtx = createContext<MiningContextValue | null>(null);
const useMining = () => useContext(MiningCtx);

// ============================================================
// PROVIDER
// ============================================================

export function MiningProvider({
  address,
  nftsOwned = 0,
  baseRate = 0.00001,
  bonusPerReferral = 2,
  bonusPerNft = 10,
  maxOfflineHours = 24,
  onBalanceChange,
  scrollTargetId = 'mining',
  children,
}: MiningProviderProps) {
  const [state, setState] = useState<MiningState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState<{ msg: string; type: 'milestone' | 'referral' } | null>(null);
  const [offlineGain, setOfflineGain] = useState<number | null>(null);
  const [sessionUptime, setSessionUptime] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastMilestoneRef = useRef<number>(0);

  const refCode = address ? generateRefCode(address) : '';
  const referralCount = state.referrals.length;
  const refBoost = referralCount * bonusPerReferral;
  const nftBoost = nftsOwned * bonusPerNft;
  const totalMultiplier = 1 + (refBoost + nftBoost) / 100;
  const effectiveRate = baseRate * totalMultiplier;
  const dailyRate = effectiveRate * 86400;

  useEffect(() => { captureIncomingReferral(); }, []);

  useEffect(() => {
    if (!address) { setState(DEFAULT_STATE); return; }
    const loaded = loadMiningState(address);
    const now = Date.now();
    if (loaded.lastTick > 0) {
      const elapsedMs = now - loaded.lastTick;
      const cappedMs = Math.min(elapsedMs, maxOfflineHours * 3_600_000);
      if (cappedMs > 5_000) {
        const gained = (cappedMs / 1000) * effectiveRate;
        loaded.mdog += gained;
        loaded.lifetime += gained;
        setOfflineGain(gained);
      }
    }
    loaded.lastTick = now;
    loaded.sessionStart = now;
    setState(loaded);

    const referrer = registerReferralIfAny(address);
    if (referrer) {
      setShowToast({ msg: 'Welcome! You gave a +2% boost to your referrer.', type: 'referral' });
      setTimeout(() => setShowToast(null), 5000);
    }
    try {
      const notifKey = `mdog_ref_notify_${address}`;
      const notif = localStorage.getItem(notifKey);
      if (notif) {
        setShowToast({ msg: '🎉 New referral joined! +2% mining rate', type: 'referral' });
        setTimeout(() => setShowToast(null), 5000);
        localStorage.removeItem(notifKey);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const dt = Math.min(5, (now - prev.lastTick) / 1000);
        if (dt <= 0) return prev;
        const add = dt * effectiveRate;
        const newState = {
          ...prev,
          mdog: prev.mdog + add,
          lifetime: prev.lifetime + add,
          lastTick: now,
        };
        const milestones = [0.001, 0.01, 0.1, 1, 10, 100, 1000];
        for (const m of milestones) {
          if (prev.mdog < m && newState.mdog >= m && m > lastMilestoneRef.current) {
            lastMilestoneRef.current = m;
            setShowToast({ msg: `🏆 ${m} MDOG milestone!`, type: 'milestone' });
            setTimeout(() => setShowToast(null), 4000);
            playMilestoneSound();
            break;
          }
        }
        saveMiningState(address, newState);
        if (onBalanceChange) onBalanceChange(newState.mdog);
        return newState;
      });
      setSessionUptime((u) => u + 1000);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, effectiveRate]);

  useEffect(() => {
    return () => {
      if (address) saveMiningState(address, state);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playMilestoneSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.25, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(g);
        g.connect(master);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } catch {}
  };

  const copyLink = useCallback(async () => {
    if (!refCode) return;
    const url = `${window.location.origin}/?ref=${refCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [refCode]);

  const shareTwitter = () => {
    if (!refCode) return;
    const url = `${window.location.origin}/?ref=${refCode}`;
    const text = `I'm mining $MDOG on @MOTODOGSCLUB — 7777 Chrome Pack NFTs on Bitcoin OP_NET. Use my link for +2% bonus: ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const dismissOfflineGain = useCallback(() => setOfflineGain(null), []);

  const ctx: MiningContextValue = {
    address, refCode,
    mdog: state.mdog, lifetime: state.lifetime,
    effectiveRate, dailyRate, baseRate, bonusPerReferral, bonusPerNft, maxOfflineHours,
    nftsOwned, referrals: state.referrals, referralCount,
    refBoost, nftBoost, totalMultiplier, sessionUptime,
    scrollTargetId, copied, copyLink, shareTwitter,
    offlineGain, dismissOfflineGain, showToast,
  };

  return (
    <MiningCtx.Provider value={ctx}>
      {children}

      {/* OFFLINE GAIN MODAL */}
      <AnimatePresence>
        {offlineGain !== null && offlineGain > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[70] flex items-center justify-center p-6"
            onClick={dismissOfflineGain}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-sm w-full bg-gradient-to-br from-orange-500/20 via-black to-purple-500/20 border-2 border-orange-400/40 rounded-2xl p-7 text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl" />
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center shadow-[0_0_30px_rgba(247,147,26,0.5)]"
                >
                  <div className="text-3xl font-black text-black" style={{ fontFamily: 'serif' }}>₿</div>
                </motion.div>
                <div className="text-[10px] font-mono text-orange-300 tracking-widest mb-2">WELCOME BACK</div>
                <h3 className="text-2xl font-black mb-2 text-white">The rigs kept running</h3>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 font-mono mb-4">
                  +{fmtMDOG(offlineGain, 6)}
                </div>
                <div className="text-xs text-gray-400 mb-5">MDOG accrued offline</div>
                <button
                  onClick={dismissOfflineGain}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full font-bold text-sm text-black hover:scale-105 transition"
                >CLAIM</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed bottom-6 right-6 z-[75] pointer-events-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/40 blur-2xl rounded-2xl" />
              <div className={`relative bg-black border-2 rounded-2xl px-5 py-3 shadow-[0_0_30px_rgba(247,147,26,0.4)] ${
                showToast.type === 'referral' ? 'border-pink-400/60' : 'border-orange-400/60'
              }`}>
                <div className={`text-[10px] font-mono tracking-widest mb-1 ${
                  showToast.type === 'referral' ? 'text-pink-300' : 'text-orange-300'
                }`}>
                  {showToast.type === 'referral' ? 'REFERRAL' : 'MILESTONE'}
                </div>
                <div className="text-sm font-bold text-white">{showToast.msg}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MiningCtx.Provider>
  );
}

// ============================================================
// PILL — goes in the nav
// ============================================================

export function MiningPill() {
  const ctx = useMining();
  if (!ctx || !ctx.address) return null;

  const scrollToSection = () => {
    document.getElementById(ctx.scrollTargetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={scrollToSection}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-cyan-500/20 border border-orange-400/40 rounded-full cursor-pointer hover:border-orange-400 transition relative overflow-hidden"
      title="Click to see your mining station"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-cyan-500/10"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <Cpu size={12} className="text-orange-400 relative z-10" />
      <div className="relative z-10 flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-white tabular-nums">
          {fmtMDOG(ctx.mdog, 7)}
        </span>
        <span className="font-mono text-[9px] text-orange-300">MDOG</span>
      </div>
      {(ctx.refBoost + ctx.nftBoost) > 0 && (
        <div className="relative z-10 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/30 border border-orange-400/50 rounded-full">
          <TrendingUp size={9} className="text-orange-300" />
          <span className="font-mono text-[9px] font-bold text-orange-200">
            +{ctx.refBoost + ctx.nftBoost}%
          </span>
        </div>
      )}
      <motion.div
        className="relative z-10 w-1.5 h-1.5 rounded-full bg-green-400"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.button>
  );
}

// ============================================================
// SECTION — goes in main body
// ============================================================

export function MiningSection() {
  const ctx = useMining();
  if (!ctx) {
    return (
      <section className="py-20 text-center text-gray-500">
        <p className="text-xs font-mono">MiningSection requires MiningProvider.</p>
      </section>
    );
  }

  const {
    address, refCode, mdog, lifetime, effectiveRate, dailyRate,
    baseRate, bonusPerReferral, bonusPerNft, maxOfflineHours,
    nftsOwned, referrals, referralCount, refBoost, nftBoost,
    totalMultiplier, sessionUptime, scrollTargetId,
    copied, copyLink, shareTwitter,
  } = ctx;

  return (
    <section id={scrollTargetId} className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-orange-500/10 border border-orange-400/30 rounded-full">
            <Cpu size={14} className="text-orange-400" />
            <span className="text-xs font-mono text-orange-300 tracking-widest">
              MDOG MINING STATION · LIVE
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-cyan-400">
            MINE WHILE YOU RIDE
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Passive $MDOG accrual. Earn while the site is open — or offline up to {maxOfflineHours}h.
            Boost your rate by holding NFTs and referring the Pack.
          </p>
        </motion.div>

        {address ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT: RIG */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/40 via-pink-500/40 to-cyan-500/40 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-black border-2 border-orange-400/40 rounded-2xl overflow-hidden">
                <div className="relative aspect-square bg-gradient-to-br from-black via-purple-950/30 to-black flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.1) 0 1px, transparent 1px 3px)' }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-br from-orange-400/20 to-transparent blur-2xl" />
                  </motion.div>
                  <motion.div
                    className="relative z-10"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-orange-800 flex items-center justify-center shadow-[0_0_60px_rgba(247,147,26,0.6)]"
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="text-7xl md:text-8xl font-black text-black/80" style={{ fontFamily: 'serif' }}>₿</div>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="p-5 bg-gradient-to-b from-black to-purple-950/10">
                  <div className="text-center mb-4">
                    <div className="font-mono text-[10px] text-orange-300 tracking-widest mb-1">TOTAL MINED</div>
                    <div
                      className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 font-mono"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {fmtMDOG(mdog, 7)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">$MDOG</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-[9px] font-mono text-cyan-300 tracking-widest mb-1">RATE</div>
                      <div className="font-mono text-sm text-white tabular-nums">{fmtMDOG(effectiveRate, 8)}/s</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] font-mono text-pink-300 tracking-widest mb-1">DAILY</div>
                      <div className="font-mono text-sm text-white tabular-nums">{dailyRate.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: CONTROL PANEL */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-cyan-500/5 to-green-500/5 border border-cyan-400/20 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-cyan-400" />
                    <h3 className="text-xs font-mono text-cyan-300 tracking-widest">MINING STATUS</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-mono text-green-400 tracking-widest">ONLINE</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 mb-1">BASE</div>
                    <div className="font-mono text-xs text-white">{fmtMDOG(baseRate, 7)}/s</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 mb-1">REF BOOST</div>
                    <div className="font-mono text-xs text-orange-300 font-bold">+{refBoost}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 mb-1">NFT BOOST</div>
                    <div className="font-mono text-xs text-pink-300 font-bold">+{nftBoost}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 mb-1">UPTIME</div>
                    <div className="font-mono text-xs text-white">
                      <Clock size={10} className="inline mr-1" />{fmtDuration(sessionUptime)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                  <span>Multiplier: <span className="text-orange-300 font-bold">×{totalMultiplier.toFixed(2)}</span></span>
                  <span>Lifetime: <span className="text-white font-bold">{fmtMDOG(lifetime, 4)}</span></span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-purple-500/10 border-2 border-orange-400/30 rounded-2xl p-5 overflow-hidden"
              >
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-orange-400" />
                      <h3 className="text-xs font-mono text-orange-300 tracking-widest">REFERRAL BOOST</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-gray-500 tracking-widest">CURRENT BOOST</div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 leading-none">
                        +{refBoost}%
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4">
                    Each friend who joins via your link gives you{' '}
                    <span className="text-orange-300 font-bold">+{bonusPerReferral}%</span>{' '}
                    mining rate — forever.
                  </p>

                  <div className="mb-4">
                    <div className="text-[10px] font-mono text-gray-500 tracking-wider mb-2">YOUR REFERRAL LINK</div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/60 border border-orange-400/30 rounded-lg px-3 py-2.5 font-mono text-xs text-orange-300 truncate">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/?ref={refCode}
                      </div>
                      <button
                        onClick={copyLink}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-bold text-xs text-black hover:scale-105 transition flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-mono text-gray-500 tracking-wider">
                        {referralCount} REFERRAL{referralCount !== 1 ? 'S' : ''}
                      </div>
                      <div className="flex -space-x-2">
                        {referrals.slice(0, 6).map((addr, i) => (
                          <div
                            key={addr}
                            className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-mono text-[9px] font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, hsl(${(addr.charCodeAt(0) * 13 + i * 47) % 360}, 70%, 50%), hsl(${(addr.charCodeAt(1) * 17 + i * 31) % 360}, 70%, 40%))`,
                            }}
                            title={`${addr.slice(0, 6)}...${addr.slice(-4)}`}
                          >
                            {addr.slice(2, 4).toUpperCase()}
                          </div>
                        ))}
                        {referralCount > 6 && (
                          <div className="w-7 h-7 rounded-full border-2 border-black bg-black flex items-center justify-center font-mono text-[9px] text-orange-300">
                            +{referralCount - 6}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={shareTwitter}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-mono transition"
                    >
                      <Twitter size={11} /> SHARE
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-400/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={14} className="text-pink-400" />
                  <h3 className="text-xs font-mono text-pink-300 tracking-widest">PACK BENEFITS</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-pink-300 tracking-widest">NFT OWNERSHIP</span>
                      <span className="font-mono text-sm text-white font-bold">{nftsOwned} held</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Each MotoDog NFT grants{' '}
                      <span className="text-pink-300 font-bold">+{bonusPerNft}%</span> mining.{' '}
                      {nftsOwned > 0
                        ? <span className="text-pink-400">Active: +{nftBoost}%</span>
                        : <span className="text-gray-500">Mint one to unlock.</span>}
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-orange-300 tracking-widest">OFFLINE CAP</span>
                      <span className="font-mono text-sm text-white font-bold">{maxOfflineHours}h</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Close the tab and come back. We'll credit up to {maxOfflineHours} hours of accrual.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center p-10 bg-gradient-to-br from-orange-500/5 to-pink-500/5 border-2 border-dashed border-orange-400/30 rounded-2xl"
          >
            <Cpu size={48} className="mx-auto text-orange-400/50 mb-4" />
            <h3 className="text-2xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
              CONNECT TO START MINING
            </h3>
            <p className="text-gray-400 mb-6">
              Your mining rate is tied to your wallet. Connect to begin accruing $MDOG at{' '}
              <span className="text-orange-300 font-mono">{baseRate}/s</span>.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-gray-500 flex-wrap">
              <div className="flex items-center gap-1"><Sparkles size={11} className="text-orange-400" /> Offline accrual</div>
              <ArrowRight size={11} />
              <div className="flex items-center gap-1"><Users size={11} className="text-pink-400" /> Referral boost</div>
              <ArrowRight size={11} />
              <div className="flex items-center gap-1"><Flame size={11} className="text-cyan-400" /> NFT multiplier</div>
            </div>
          </motion.div>
        )}

        <p className="mt-8 text-center text-[10px] font-mono text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Mining balances are stored locally in your browser per wallet address. MDOG accrued
          here contributes to your on-chain airdrop allocation at launch. Clearing browser data
          may reset local balances — they can be reconciled from snapshot on mainnet.
        </p>
      </div>
    </section>
  );
}

export default MiningProvider;
