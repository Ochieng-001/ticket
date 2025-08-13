import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );

        const eventCount = await contract.eventCounter();
        const eventPromises = [];

        for (let i = 1; i <= Number(eventCount); i++) {
          eventPromises.push(getEventDetailsReadOnly(contract, i));
        }

        const eventResults = await Promise.all(eventPromises);
        const activeEvents = eventResults.filter((event) => event.isActive);
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventDetailsReadOnly = async (
    contract: ethers.Contract,
    eventId: number
  ) => {
    const eventDetails = await contract.getEventDetails(eventId);
    const eventSupply = await contract.getEventSupply(eventId);

    // Convert ETH prices to KES using exchange rate
    const response = await fetch("/api/exchange-rate");
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
      setAvailableTickets(
        event.supply.map((supply, index) => supply - event.sold[index])
      );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-indigo-500/20 animate-pulse"></div>
          <div className="absolute top-40 right-32 w-32 h-32 rounded-full bg-purple-500/20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/3 w-48 h-48 rounded-full bg-pink-500/20 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <span className="text-sm font-medium">
                🚀 Powered by Blockchain Technology
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              BlockTicket
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
              The future of event ticketing is here. Secure, transparent, and
              fraud-proof ticket purchases powered by Ethereum smart contracts.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Blockchain Secured</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm">MetaMask Integration</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                <span className="text-sm">Fraud Prevention</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="rgb(249 250 251)"
            ></path>
          </svg>
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Events
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse through our collection of blockchain-secured events and
            purchase tickets with complete confidence.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium">
              {events.length} Events Available
            </div>
            <div className="text-sm text-gray-500">
              All events verified on blockchain
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Select>
              <SelectTrigger className="w-[200px] bg-white border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="conferences">Conferences</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="theater">Theater</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[200px] bg-white border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="popularity">Sort by Popularity</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden"
              >
                <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <div className="text-6xl">🎭</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              No Events Yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Events will appear here once they're created by administrators.
              Check back soon for exciting upcoming events!
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full text-indigo-600 font-medium">
              🔗 Powered by Blockchain Technology
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
