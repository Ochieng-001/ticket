import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { web3Service } from "@/lib/web3";
import { TicketType, type Event, type Ticket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createEvent = useCallback(async (eventData: {
    name: string;
    description: string;
    venue: string;
    eventDate: string;
    prices: [number, number, number]; // KES prices
    supply: [number, number, number];
  }) => {
    setIsLoading(true);
    try {
      const contract = web3Service.getContract();
      
      // Convert KES prices to Wei
      const ethPrices = await Promise.all(
        eventData.prices.map(async (kesPrice) => {
          const ethAmount = await web3Service.kestoEth(kesPrice);
          return web3Service.parseEther(ethAmount);
        })
      );
      
      // Convert date to timestamp
      const eventTimestamp = Math.floor(new Date(eventData.eventDate).getTime() / 1000);
      
      const tx = await contract.createEvent(
        eventData.name,
        eventData.description,
        eventData.venue,
        eventTimestamp,
        ethPrices,
        eventData.supply
      );
      
      await tx.wait();
      
      toast({
        title: "Event Created",
        description: "Your event has been successfully created on the blockchain!",
      });
      
      return tx;
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const purchaseTicket = useCallback(async (
    eventId: number, 
    ticketType: TicketType, 
    seat: string,
    priceInEth: string
  ) => {
    setIsLoading(true);
    try {
      const contract = web3Service.getContract();
      const priceWei = web3Service.parseEther(priceInEth);
      
      const tx = await contract.purchaseTicket(eventId, ticketType, seat, {
        value: priceWei,
        gasLimit: 300000, // Set gas limit to prevent out of gas errors
      });
      
      await tx.wait();
      
      toast({
        title: "Ticket Purchased",
        description: "Your ticket has been successfully purchased!",
      });
      
      return tx;
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase ticket",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getEventDetails = useCallback(async (eventId: number) => {
    try {
      const contract = web3Service.getContract();
      
      // Get basic event details
      const eventDetails = await contract.getEventDetails(eventId);
      const eventSupply = await contract.getEventSupply(eventId);
      const availableTickets = await contract.getAvailableTickets(eventId);
      
      // Convert ETH prices back to KES
      const kessPrices = await Promise.all(
        eventDetails.prices.map(async (priceWei: bigint) => {
          const ethAmount = web3Service.formatEther(priceWei);
          return await web3Service.ethToKes(ethAmount);
        })
      );
      
      const event: Event = {
        eventId,
        name: eventDetails.name,
        description: "", // Description stored separately
        venue: eventDetails.venue,
        eventDate: Number(eventDetails.eventDate),
        prices: kessPrices,
        supply: eventSupply.supply.map((s: bigint) => Number(s)),
        sold: eventSupply.sold.map((s: bigint) => Number(s)),
        isActive: eventDetails.isActive,
        creator: "", // Would need separate call to get creator
      };
      
      return {
        event,
        availableTickets: availableTickets.map((a: bigint) => Number(a)),
      };
    } catch (error: any) {
      toast({
        title: "Failed to Load Event",
        description: error.message || "Could not load event details",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getUserTickets = useCallback(async (userAddress: string) => {
    try {
      const contract = web3Service.getContract();
      const ticketIds = await contract.getUserTickets(userAddress);
      
      const tickets = await Promise.all(
        ticketIds.map(async (ticketId: bigint) => {
          const ticketDetails = await contract.getTicketDetails(Number(ticketId));
          
          // Convert price back to KES
          const ethAmount = web3Service.formatEther(ticketDetails.purchasePrice);
          const kesPrice = await web3Service.ethToKes(ethAmount);
          
          const ticket: Ticket = {
            ticketId: Number(ticketId),
            eventId: Number(ticketDetails.eventId),
            owner: ticketDetails.ticketOwner,
            ticketType: ticketDetails.ticketType,
            purchasePrice: kesPrice,
            purchaseTime: Number(ticketDetails.purchaseTime),
            isUsed: ticketDetails.isUsed,
            seat: ticketDetails.seat,
          };
          
          return ticket;
        })
      );
      
      return tickets;
    } catch (error: any) {
      toast({
        title: "Failed to Load Tickets",
        description: error.message || "Could not load your tickets",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getEventCounter = useCallback(async () => {
    try {
      const contract = web3Service.getContract();
      const counter = await contract.eventCounter();
      return Number(counter);
    } catch (error: any) {
      console.error("Failed to get event counter:", error);
      return 0;
    }
  }, []);

  return {
    isLoading,
    createEvent,
    purchaseTicket,
    getEventDetails,
    getUserTickets,
    getEventCounter,
  };
}
