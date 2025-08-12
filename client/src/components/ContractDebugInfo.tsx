import { CONTRACT_ADDRESS } from "@/lib/contractABI";

export function ContractDebugInfo() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
      <div className="text-xs text-yellow-700 space-y-1">
        <div>Contract Address: {CONTRACT_ADDRESS || "Not configured"}</div>
        <div>Network: {window.ethereum ? "MetaMask detected" : "No wallet detected"}</div>
        <div>Environment: {import.meta.env.MODE}</div>
      </div>
      {!CONTRACT_ADDRESS && (
        <div className="mt-2 text-xs text-red-600">
          ⚠️ Contract address not set. Please configure VITE_CONTRACT_ADDRESS environment variable.
        </div>
      )}
    </div>
  );
}