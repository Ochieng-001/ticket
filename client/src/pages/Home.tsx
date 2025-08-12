import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard } from "@/components/EventCard";
import { EventModal } from "@/components/EventModal";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { type Event } from "@shared/schema";
import { Search, HelpCircle } from "lucide-react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contractABI";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [availableTickets, setAvailableTickets] = useState<number[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { getEventDetails, getEventCounter } = useContract();
  const { isConnected } = useWallet();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    // Show empty state if no contract address is configured
    if (!CONTRACT_ADDRESS) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Create a read-only provider to get events without wallet connection
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const eventCount = await contract.eventCounter();
        const eventPromises = [];
        
        for (let i = 1; i <= Number(eventCount); i++) {
          eventPromises.push(getEventDetailsReadOnly(contract, i));
        }
        
        const eventResults = await Promise.all(eventPromises);
        const activeEvents = eventResults.filter(event => event.isActive);
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventDetailsReadOnly = async (contract: ethers.Contract, eventId: number) => {
    const eventDetails = await contract.getEventDetails(eventId);
    const eventSupply = await contract.getEventSupply(eventId);
    
    // Convert ETH prices to KES using exchange rate
    const response = await fetch('/api/exchange-rate');
    const exchangeData = await response.json();
    const kessPrices = eventDetails.prices.map((priceWei: bigint) => {
      const ethAmount = parseFloat(ethers.formatEther(priceWei));
      return ethAmount * exchangeData.ethToKes;
    });
    
    return {
      eventId,
      name: eventDetails.name,
      description: "",
      venue: eventDetails.venue,
      eventDate: Number(eventDetails.eventDate),
      prices: kessPrices,
      supply: eventSupply.supply.map((s: bigint) => Number(s)),
      sold: eventSupply.sold.map((s: bigint) => Number(s)),
      isActive: eventDetails.isActive,
      creator: "",
    };
  };

  const handleEventClick = async (event: Event) => {
    if (!isConnected) {
      // Show a message to connect wallet first
      setSelectedEvent(event);
      setAvailableTickets(event.supply.map((supply, index) => supply - event.sold[index]));
      setIsEventModalOpen(true);
      return;
    }

    try {
      const result = await getEventDetails(event.eventId);
      setSelectedEvent(result.event);
      setAvailableTickets(result.availableTickets);
      setIsEventModalOpen(true);
    } catch (error) {
      console.error("Failed to load event details:", error);
    }
  };

  const getTotalAvailableTickets = (event: Event) => {
    return event.supply.reduce((total, supply, index) => {
      return total + (supply - event.sold[index]);
    }, 0);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Decentralized Event Ticketing</h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Secure, transparent, and blockchain-powered ticket purchases with MetaMask integration
            </p>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
          <div className="flex space-x-4">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="conferences">Conferences</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="popularity">Sort by Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-medium text-gray-500 mb-2">No events available</h3>
            <p className="text-gray-400">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                availableTickets={getTotalAvailableTickets(event)}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        )}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        availableTickets={availableTickets}
      />
    </div>
  );
}
