import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Badge } from "@/components/ui/badge";

export function WalletConnection() {
  const { isConnected, address, isConnecting, connectWallet, disconnectWallet } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-4">
        <Badge variant="secondary" className="bg-secondary/10 text-secondary">
          <Wallet className="w-4 h-4 mr-2" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={disconnectWallet}
          className="text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={connectWallet} 
      disabled={isConnecting}
      className="bg-primary hover:bg-primary/90 text-white"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
