import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractABI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS environment variable.");
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Initialize contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      
      return address;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Please connect to MetaMask to continue.");
      }
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async checkConnection(): Promise<string | null> {
    if (!window.ethereum || !CONTRACT_ADDRESS) return null;

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.listAccounts();
      
      if (accounts.length > 0) {
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
        return await this.signer.getAddress();
      }
      
      return null;
    } catch (error) {
      console.error("Error checking connection:", error);
      return null;
    }
  }

  getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error("Contract not initialized. Please connect wallet first.");
    }
    return this.contract;
  }

  getSigner(): ethers.JsonRpcSigner {
    if (!this.signer) {
      throw new Error("Signer not available. Please connect wallet first.");
    }
    return this.signer;
  }

  // Convert ETH to Wei
  parseEther(value: string): bigint {
    return ethers.parseEther(value);
  }

  // Convert Wei to ETH
  formatEther(value: bigint): string {
    return ethers.formatEther(value);
  }

  // Convert KES to ETH based on current exchange rate
  async kestoEth(kesAmount: number): Promise<string> {
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      const ethAmount = kesAmount * data.kesToEth;
      return ethAmount.toString();
    } catch (error) {
      // Fallback rate if API fails
      const fallbackRate = 0.0000075; // 1 KES = 0.0000075 ETH
      return (kesAmount * fallbackRate).toString();
    }
  }

  // Convert ETH to KES
  async ethToKes(ethAmount: string): Promise<number> {
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      return parseFloat(ethAmount) * data.ethToKes;
    } catch (error) {
      // Fallback rate if API fails
      const fallbackRate = 133333; // 1 ETH = 133,333 KES
      return parseFloat(ethAmount) * fallbackRate;
    }
  }
}

export const web3Service = new Web3Service();
