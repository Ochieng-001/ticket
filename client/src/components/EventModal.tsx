import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Minus,
  Plus,
  Star,
  Crown,
  Sparkles,
  Shield,
  CreditCard,
} from "lucide-react";
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

export function EventModal({
  isOpen,
  onClose,
  event,
  availableTickets,
}: EventModalProps) {
  const [quantities, setQuantities] = useState<TicketQuantities>({
    [TicketType.REGULAR]: 0,
    [TicketType.VIP]: 0,
    [TicketType.VVIP]: 0,
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const { purchaseTicket, isLoading } = useContract();
  const { isConnected, connectWallet, isConnecting } = useWallet();

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
    {
      type: TicketType.REGULAR,
      name: "Regular",
      description: "General admission with standard seating",
      icon: <Star className="w-4 h-4" />,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    {
      type: TicketType.VIP,
      name: "VIP",
      description: "Premium seating + priority access + refreshments",
      icon: <Crown className="w-4 h-4" />,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      type: TicketType.VVIP,
      name: "VVIP",
      description: "Exclusive access + private dining + meet & greet",
      icon: <Sparkles className="w-4 h-4" />,
      gradient: "from-yellow-400 via-orange-500 to-red-500",
      bgGradient: "from-yellow-50 to-orange-50",
    },
  ];

  const updateQuantity = (ticketType: TicketType, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketType]: Math.max(0, prev[ticketType] + change),
    }));
  };

  const getTotalCost = () => {
    return Object.entries(quantities).reduce((total, [type, quantity]) => {
      const price = event.prices[parseInt(type)];
      return total + price * quantity;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    // Ensure we have MetaMask and wallet is connected
    if (!window.ethereum) {
      alert("Please install MetaMask to purchase tickets");
      return;
    }

    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setShowTransactionModal(true);
    setTransactionStatus("loading");

    try {
      // Purchase each ticket type separately
      for (const [typeStr, quantity] of Object.entries(quantities)) {
        if (quantity > 0) {
          const ticketType = parseInt(typeStr) as TicketType;
          console.log(
            `Purchasing ${quantity} tickets of type ${ticketType} for event ${event.eventId}`
          );

          for (let i = 0; i < quantity; i++) {
            // Use the original purchase function that gets the correct price from the contract
            await purchaseTicket(
              event.eventId,
              ticketType,
              `${event.name}-${ticketType}-${Date.now()}-${i}`,
              event.prices[ticketType] // Pass KES price, let the contract handle conversion
            );
          }
        }
      }

      setTransactionStatus("success");
      setTimeout(() => {
        setShowTransactionModal(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Purchase failed:", error);
      setTransactionStatus("error");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-gray-50 to-white border-0 shadow-2xl">
          <div className="relative overflow-hidden">
            {/* Hero Section */}
            <div className="relative h-80 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-8 right-12 w-32 h-32 rounded-full bg-white/20 animate-pulse"></div>
                <div className="absolute bottom-8 left-12 w-24 h-24 rounded-full bg-white/15 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/10 animate-pulse delay-500"></div>
              </div>

              <div className="relative z-10 p-8 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Badge className="bg-white/20 text-white border-white/30 rounded-full">
                    Live Event
                  </Badge>
                  <Badge className="bg-green-500/90 text-white border-0 rounded-full">
                    {availableTickets.reduce(
                      (sum, tickets) => sum + tickets,
                      0
                    )}{" "}
                    Available
                  </Badge>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  {event.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Calendar className="w-6 h-6 text-blue-200" />
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">
                        Event Date
                      </p>
                      <p className="font-semibold">
                        {eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-white/80">
                        {eventDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <MapPin className="w-6 h-6 text-pink-200" />
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">
                        Venue
                      </p>
                      <p className="font-semibold truncate">{event.venue}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <Users className="w-6 h-6 text-purple-200" />
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">
                        Capacity
                      </p>
                      <p className="font-semibold">
                        {event.supply.reduce((sum, s) => sum + s, 0)} guests
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Details */}
                <div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-6 h-6 mr-2 text-indigo-600" />
                      Event Details
                    </h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {event.description ||
                          "Join us for an amazing event experience with networking opportunities, great content, and unforgettable moments. This blockchain-secured event ensures your ticket is authentic and transferable."}
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Total Capacity
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {event.supply.reduce((sum, s) => sum + s, 0)}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Tickets Sold
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {event.sold.reduce((sum, s) => sum + s, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Selection */}
                <div>
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <CreditCard className="w-6 h-6 mr-2 text-purple-600" />
                      Select Your Tickets
                    </h3>

                    <div className="space-y-4 mb-6">
                      {ticketTypes.map((ticketType, index) => (
                        <div
                          key={ticketType.type}
                          className={`bg-gradient-to-r ${
                            ticketType.bgGradient
                          } border-2 border-transparent hover:border-indigo-200 rounded-xl p-4 transition-all duration-200 ${
                            quantities[ticketType.type] > 0
                              ? "ring-2 ring-indigo-300"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`bg-gradient-to-r ${ticketType.gradient} text-white p-2 rounded-lg`}
                              >
                                {ticketType.icon}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {ticketType.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {ticketType.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                KES{" "}
                                {event.prices[ticketType.type].toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                ≈ $
                                {(
                                  event.prices[ticketType.type] * 0.0075
                                ).toFixed(2)}{" "}
                                USD
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  availableTickets[index] > 20
                                    ? "secondary"
                                    : availableTickets[index] > 0
                                    ? "default"
                                    : "destructive"
                                }
                                className="rounded-full"
                              >
                                {availableTickets[index] || 0} available
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 rounded-full border-2 hover:bg-gray-100"
                                onClick={() =>
                                  updateQuantity(ticketType.type, -1)
                                }
                                disabled={quantities[ticketType.type] === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>

                              <div className="bg-white rounded-lg px-4 py-2 min-w-12 text-center">
                                <span className="text-lg font-bold text-gray-900">
                                  {quantities[ticketType.type]}
                                </span>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-10 h-10 p-0 rounded-full border-2 hover:bg-gray-100"
                                onClick={() =>
                                  updateQuantity(ticketType.type, 1)
                                }
                                disabled={
                                  quantities[ticketType.type] >=
                                    (availableTickets[index] || 0) ||
                                  (availableTickets[index] || 0) === 0
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Cost */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-100">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Subtotal ({getTotalTickets()} tickets)
                          </span>
                          <span className="font-medium">
                            KES {getTotalCost().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Blockchain fee (est.)
                          </span>
                          <span className="font-medium text-green-600">
                            ≈ $0.50 USD
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-indigo-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">
                            Total Amount
                          </span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              KES {getTotalCost().toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              ≈ ${(getTotalCost() * 0.0075).toFixed(2)} USD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <Button
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={
                        getTotalTickets() === 0 || isLoading || isConnecting
                      }
                      onClick={isConnected ? handlePurchase : connectWallet}
                    >
                      {!window.ethereum
                        ? "🦊 Install MetaMask"
                        : isConnecting
                        ? "🔗 Connecting..."
                        : !isConnected
                        ? "🔗 Connect Wallet to Purchase"
                        : isLoading
                        ? "⏳ Processing Transaction..."
                        : getTotalTickets() === 0
                        ? "Select Tickets"
                        : `🎫 Purchase ${getTotalTickets()} Ticket${
                            getTotalTickets() !== 1 ? "s" : ""
                          }`}
                    </Button>

                    <div className="flex items-center justify-center mt-4 space-x-2 text-xs text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>Secured by Ethereum blockchain technology</span>
                    </div>
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
