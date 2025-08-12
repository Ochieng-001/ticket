import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Minus, Plus } from "lucide-react";
import { type Event, TicketType } from "@shared/schema";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { TransactionModal } from "@/components/TransactionModal";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  availableTickets: number[];
}

interface TicketQuantities {
  [TicketType.REGULAR]: number;
  [TicketType.VIP]: number;
  [TicketType.VVIP]: number;
}

export function EventModal({ isOpen, onClose, event, availableTickets }: EventModalProps) {
  const [quantities, setQuantities] = useState<TicketQuantities>({
    [TicketType.REGULAR]: 0,
    [TicketType.VIP]: 0,
    [TicketType.VVIP]: 0,
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const { purchaseTicket, isLoading } = useContract();
  const { isConnected } = useWallet();

  useEffect(() => {
    if (!isOpen) {
      setQuantities({
        [TicketType.REGULAR]: 0,
        [TicketType.VIP]: 0,
        [TicketType.VVIP]: 0,
      });
    }
  }, [isOpen]);

  if (!event) return null;

  const eventDate = new Date(event.eventDate * 1000);
  const ticketTypes = [
    { type: TicketType.REGULAR, name: "Regular", description: "General admission" },
    { type: TicketType.VIP, name: "VIP", description: "Premium seating + perks" },
    { type: TicketType.VVIP, name: "VVIP", description: "Exclusive access + dining" },
  ];

  const updateQuantity = (ticketType: TicketType, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [ticketType]: Math.max(0, prev[ticketType] + change),
    }));
  };

  const getTotalCost = () => {
    return Object.entries(quantities).reduce((total, [type, quantity]) => {
      const price = event.prices[parseInt(type)];
      return total + (price * quantity);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      return;
    }

    setShowTransactionModal(true);
    setTransactionStatus('loading');

    try {
      // For simplicity, we'll purchase each ticket type separately
      // In production, you might want to batch these or handle multiple purchases
      for (const [typeStr, quantity] of Object.entries(quantities)) {
        if (quantity > 0) {
          const ticketType = parseInt(typeStr) as TicketType;
          const priceKES = event.prices[ticketType];
          
          // Convert KES to ETH (simplified - in production you'd get real exchange rate)
          const priceETH = (priceKES * 0.0000075).toString(); // Approximate conversion
          
          for (let i = 0; i < quantity; i++) {
            await purchaseTicket(event.eventId, ticketType, `${ticketType}-${i + 1}`, priceETH);
          }
        }
      }
      
      setTransactionStatus('success');
      setTimeout(() => {
        setShowTransactionModal(false);
        onClose();
      }, 2000);
    } catch (error) {
      setTransactionStatus('error');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <div className="relative">
            <div className="w-full h-64 bg-gradient-to-r from-primary to-blue-600 rounded-lg"></div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h2>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{eventDate.toLocaleDateString()} • {eventDate.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-5 h-5 mr-2" />
                      <span>{event.supply.reduce((sum, s) => sum + s, 0)} capacity</span>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About this event</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description || "Join us for an amazing event experience with networking opportunities and great content."}
                    </p>
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6 sticky top-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Tickets</h3>
                    
                    <div className="space-y-4 mb-6">
                      {ticketTypes.map((ticketType, index) => (
                        <div key={ticketType.type} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{ticketType.name}</h4>
                              <p className="text-sm text-gray-600">{ticketType.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">KES {event.prices[ticketType.type].toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              Available: <span className="font-medium text-secondary">{availableTickets[index] || 0}</span>
                            </span>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => updateQuantity(ticketType.type, -1)}
                                disabled={quantities[ticketType.type] === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="mx-3 font-medium">{quantities[ticketType.type]}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => updateQuantity(ticketType.type, 1)}
                                disabled={quantities[ticketType.type] >= (availableTickets[index] || 0)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">KES {getTotalCost().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Gas fee (est.)</span>
                        <span className="font-medium">≈ 0.001 ETH</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <div className="text-right">
                          <div>KES {getTotalCost().toLocaleString()}</div>
                          <div className="text-sm text-gray-500">≈ {(getTotalCost() * 0.0000075).toFixed(6)} ETH</div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      disabled={getTotalTickets() === 0 || !isConnected || isLoading}
                      onClick={handlePurchase}
                    >
                      {!isConnected ? "Connect Wallet First" : 
                       isLoading ? "Processing..." : 
                       "Purchase with MetaMask"}
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Secure blockchain transaction via MetaMask
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        status={transactionStatus}
      />
    </>
  );
}
