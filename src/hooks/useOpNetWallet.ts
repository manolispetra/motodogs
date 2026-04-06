'use client';

import { useState, useEffect, useCallback } from 'react';

interface OpNetAccount {
  address: string;
  publicKey: string;
}

interface UseOpNetWallet {
  account: OpNetAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

declare global {
  interface Window {
    opnet?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      // Bitcoin transaction methods
      sendBitcoin: (params: { to: string; value: number }) => Promise<{ txid: string }>;
      signAndSendTransaction: (params: { to: string; value: number; data?: string }) => Promise<{ txid: string }>;
    };
  }
}

export function useOpNetWallet(): UseOpNetWallet {
  const [account, setAccount] = useState<OpNetAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount({
        address: accounts[0],
        publicKey: accounts[0]
      });
      localStorage.setItem('opnet_connected', 'true');
    } else {
      setAccount(null);
      localStorage.removeItem('opnet_connected');
    }
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined') return;
    
    if (!window.opnet) {
      alert('OpNet Wallet not found! Please install OP_WALLET extension from Chrome Web Store.');
      window.open('https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb', '_blank');
      return;
    }

    try {
      setIsLoading(true);
      const accounts = await window.opnet.requestAccounts();
      
      if (accounts && accounts.length > 0) {
        setAccount({
          address: accounts[0],
          publicKey: accounts[0]
        });
        localStorage.setItem('opnet_connected', 'true');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    localStorage.removeItem('opnet_connected');
  };

  // Auto-connect if previously connected
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('opnet_connected');
      
      if (wasConnected && window.opnet) {
        try {
          const accounts = await window.opnet.getAccounts();
          if (accounts && accounts.length > 0) {
            setAccount({
              address: accounts[0],
              publicKey: accounts[0]
            });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();

    // Listen for account changes
    if (window.opnet) {
      window.opnet.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.opnet) {
        window.opnet.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged]);

  return {
    account,
    isConnected: !!account,
    isLoading,
    connect,
    disconnect
  };
}
