import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'success' | 'error';
  onRetry?: () => void;
}

export function TransactionModal({ isOpen, onClose, status, onRetry }: TransactionModalProps) {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Transaction</h3>
            <p className="text-gray-600 mb-4">Please confirm the transaction in MetaMask</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Status:</span>
                  <span className="font-medium">Waiting for confirmation...</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
            <p className="text-gray-600 mb-6">Your tickets have been securely stored on the blockchain</p>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={onClose}
            >
              View My Tickets
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Failed</h3>
            <p className="text-gray-600 mb-6">The transaction was rejected or failed. Please try again.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {onRetry && (
                <Button className="bg-primary text-white hover:bg-primary/90" onClick={onRetry}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}