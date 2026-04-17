'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTODOGS } from '../config/nfts';

interface Notification {
  id: number;
  address: string;
  nftName: string;
}

// Bech32m alphabet (χαρακτήρες που εμφανίζονται σε taproot addresses)
const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function randomChar(): string {
  return BECH32_CHARS[Math.floor(Math.random() * BECH32_CHARS.length)];
}

function randomChars(n: number): string {
  return Array.from({ length: n }, randomChar).join('');
}

function makeMaskedTaproot(): string {
  // Μορφή: bc1p + 2 random + 12 αστερίσκοι + 4 random
  // π.χ. bc1pq7************9fd4
  return `bc1p${randomChars(2)}************${randomChars(4)}`;
}

function randInt(minSec: number, maxSec: number): number {
  return Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
}

// Timing config (σε δευτερόλεπτα)
const FIRST_NOTIFICATION_DELAY_MIN = 15;   // 15 sec μετά το load
const FIRST_NOTIFICATION_DELAY_MAX = 30;
const NEXT_NOTIFICATION_DELAY_MIN = 40 * 60; // 40 λεπτά
const NEXT_NOTIFICATION_DELAY_MAX = 60 * 60; // 60 λεπτά
const VISIBLE_DURATION_MS = 7000; // πόσο μένει visible

export default function PurchaseTicker() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    let mounted = true;
    let scheduleTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const showOne = () => {
      if (!mounted) return;

      const nft = MOTODOGS[Math.floor(Math.random() * MOTODOGS.length)];
      setNotification({
        id: Date.now(),
        address: makeMaskedTaproot(),
        nftName: nft.name,
      });

      hideTimer = setTimeout(() => {
        if (!mounted) return;
        setNotification(null);
      }, VISIBLE_DURATION_MS);
    };

    const scheduleNext = (delaySec: number) => {
      scheduleTimer = setTimeout(() => {
        showOne();
        const nextDelay = randInt(NEXT_NOTIFICATION_DELAY_MIN, NEXT_NOTIFICATION_DELAY_MAX);
        scheduleNext(nextDelay);
      }, delaySec * 1000);
    };

    const firstDelay = randInt(FIRST_NOTIFICATION_DELAY_MIN, FIRST_NOTIFICATION_DELAY_MAX);
    scheduleNext(firstDelay);

    return () => {
      mounted = false;
      clearTimeout(scheduleTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: -40, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -40, y: 10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 left-6 z-40 max-w-sm pointer-events-none"
        >
          <div className="relative bg-black/90 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl -z-10" />

            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/30">
                  🏍️
                </div>
                {/* Pulse dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-cyan-400 tracking-tight truncate">
                  {notification.address}
                </p>
                <p className="text-sm text-white leading-snug">
                  just pre-bought{' '}
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    {notification.nftName}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
