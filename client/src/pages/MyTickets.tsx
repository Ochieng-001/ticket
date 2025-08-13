import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCard } from "@/components/TicketCard";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { type Ticket, type Event } from "@shared/schema";
import { Ticket as TicketIcon } from "lucide-react";

interface TicketWithEvent extends Ticket {
  event: Event;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getUserTickets, getEventDetails } = useContract();
  const { isConnected, address } = useWallet();

  useEffect(() => {
    if (isConnected && address) {
      loadUserTickets();
    }
  }, [isConnected, address]);

  const loadUserTickets = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const userTickets = await getUserTickets(address);

      // Fetch event details for each ticket
      const ticketsWithEvents = await Promise.all(
        userTickets.map(async (ticket) => {
          const eventResult = await getEventDetails(ticket.eventId);
          return {
            ...ticket,
            event: eventResult.event,
          };
        })
      );

      setTickets(ticketsWithEvents);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">My Tickets</h2>
            <p className="text-gray-600">
              Connect your wallet to view your tickets
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My Tickets
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your blockchain-secured tickets are safe and verified. Present the
            QR codes at events for seamless entry.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="bg-gray-200 p-4 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-400 mb-6">
              Purchase your first blockchain ticket to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.ticketId}
                ticket={ticket}
                eventName={ticket.event.name}
                eventDate={new Date(ticket.event.eventDate * 1000)}
                venue={ticket.event.venue}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
