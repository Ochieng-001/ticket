import { useState, useEffect, useCallback } from "react";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      const connectedAddress = await web3Service.checkConnection();
      if (connectedAddress) {
        setIsConnected(true);
        setAddress(connectedAddress);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const connectedAddress = await web3Service.connectWallet();
      setIsConnected(true);
      setAddress(connectedAddress);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
  }, []);

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    isConnected,
    address,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };
}
