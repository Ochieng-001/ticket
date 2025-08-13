import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { web3Service } from "@/lib/web3";
import { TicketType, type Event, type Ticket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createEvent = useCallback(
    async (eventData: {
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
        const eventTimestamp = Math.floor(
          new Date(eventData.eventDate).getTime() / 1000
        );

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
          description:
            "Your event has been successfully created on the blockchain!",
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
    },
    [toast]
  );

  const purchaseTicket = useCallback(
    async (
      eventId: number,
      ticketType: TicketType,
      seat: string,
      priceInKes: number
    ) => {
      setIsLoading(true);
      try {
        console.log(
          `Purchasing ticket: eventId=${eventId}, type=${ticketType}, seat=${seat}, priceKES=${priceInKes}`
        );

        const contract = web3Service.getContract();

        // Get the actual price from the smart contract to ensure we send exactly what's expected
        const eventDetails = await contract.getEventDetails(eventId);
        const contractPriceWei = eventDetails.prices[ticketType];

        console.log(
          `Contract expects price in Wei: ${contractPriceWei.toString()}`
        );
        console.log(
          `Contract expects price in ETH: ${web3Service.formatEther(
            contractPriceWei
          )}`
        );

        const priceWei = contractPriceWei; // Use exact price from contract

        console.log(
          `Using exact contract price in Wei: ${priceWei.toString()}`
        );
        console.log(
          `Using exact contract price in ETH: ${web3Service.formatEther(
            priceWei
          )}`
        );

        // Validate the event is still active
        if (!eventDetails.isActive) {
          throw new Error("Event is not active");
        }
        console.log("Event validation passed:", eventDetails.name);

        // Check if tickets are available for this type
        try {
          const availableTickets = await contract.getAvailableTickets(eventId);
          if (Number(availableTickets[ticketType]) <= 0) {
            throw new Error("No tickets available for this type");
          }
          console.log(
            `Available tickets for type ${ticketType}:`,
            Number(availableTickets[ticketType])
          );
        } catch (availabilityError: any) {
          console.error("Ticket availability check failed:", availabilityError);
          throw new Error("Unable to check ticket availability");
        }

        // Check user's balance before attempting purchase
        const signer = web3Service.getSigner();
        const userBalance = await signer.provider.getBalance(
          await signer.getAddress()
        );

        console.log(
          `User balance: ${web3Service.formatEther(userBalance)} ETH`
        );
        console.log(
          `Required amount: ${web3Service.formatEther(priceWei)} ETH`
        );
        console.log(`Balance sufficient: ${userBalance >= priceWei}`);

        if (userBalance < priceWei) {
          throw new Error(
            `Insufficient ETH balance. You have ${web3Service.formatEther(
              userBalance
            )} ETH but need ${web3Service.formatEther(priceWei)} ETH`
          );
        }

        // Try to estimate gas with better error handling
        let gasEstimate: bigint;
        try {
          gasEstimate = await contract.purchaseTicket.estimateGas(
            eventId,
            ticketType,
            seat,
            {
              value: priceWei,
            }
          );
          console.log(`Gas estimate: ${gasEstimate.toString()}`);
        } catch (gasError: any) {
          console.error("Gas estimation failed:", gasError);

          // Try to get more specific error information
          let specificError = "Transaction would fail";

          // Try to call the function statically to get a better error message
          try {
            await contract.purchaseTicket.staticCall(
              eventId,
              ticketType,
              seat,
              {
                value: priceWei,
              }
            );
          } catch (staticError: any) {
            console.error("Static call error:", staticError);
            console.error("Static call error message:", staticError.message);

            if (staticError.message.includes("Event does not exist")) {
              specificError = "Event does not exist";
            } else if (staticError.message.includes("Event is not active")) {
              specificError = "Event is not currently active";
            } else if (
              staticError.message.includes("Ticket type does not exist")
            ) {
              specificError = "Invalid ticket type selected";
            } else if (staticError.message.includes("No tickets available")) {
              specificError = "No tickets available for this type";
            } else if (staticError.message.includes("Insufficient payment")) {
              specificError = `Insufficient payment. Required: ${web3Service.formatEther(
                priceWei
              )} ETH`;
            } else if (staticError.message.includes("Seat already taken")) {
              specificError = "This seat is already taken";
            } else {
              specificError = staticError.message || "Transaction would fail";
            }
          }

          throw new Error(specificError);
        }

        const tx = await contract.purchaseTicket(eventId, ticketType, seat, {
          value: priceWei,
          gasLimit: (gasEstimate * BigInt(150)) / BigInt(100), // Add 50% buffer to gas estimate
        });

        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        toast({
          title: "Ticket Purchased",
          description: "Your ticket has been successfully purchased!",
        });

        return tx;
      } catch (error: any) {
        console.error("Purchase error details:", error);

        let errorMessage = "Failed to purchase ticket";
        if (error.code === 4001) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.code === -32603) {
          errorMessage =
            "Transaction failed - please check your network connection";
        } else if (error.message.includes("missing revert data")) {
          errorMessage =
            "Contract call failed - please check contract address and ensure event exists";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient ETH balance for this purchase";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getEventDetails = useCallback(
    async (eventId: number) => {
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
          description: "", // Will fetch description separately
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
    },
    [toast]
  );

  const getUserTickets = useCallback(
    async (userAddress: string) => {
      try {
        const contract = web3Service.getContract();
        const ticketIds = await contract.getUserTickets(userAddress);

        const tickets = await Promise.all(
          ticketIds.map(async (ticketId: bigint) => {
            const ticketDetails = await contract.getTicketDetails(
              Number(ticketId)
            );

            // Convert price back to KES
            const ethAmount = web3Service.formatEther(
              ticketDetails.purchasePrice
            );
            const kesPrice = await web3Service.ethToKes(ethAmount);

            // Debug logging
            console.log("Raw ticket details from contract:", {
              ticketId: ticketId,
              ticketType: ticketDetails.ticketType,
              ticketTypeAsNumber: Number(ticketDetails.ticketType),
              eventId: ticketDetails.eventId,
            });

            const ticket: Ticket = {
              ticketId: Number(ticketId),
              eventId: Number(ticketDetails.eventId),
              owner: ticketDetails.ticketOwner,
              ticketType: Number(ticketDetails.ticketType), // Ensure proper conversion
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
    },
    [toast]
  );

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

  // New functions for updated contract
  const verifyTicket = useCallback(
    async (ticketId: number) => {
      try {
        const contract = web3Service.getContract();
        const verificationResult = await contract.verifyTicket(ticketId);

        return {
          isValid: verificationResult.isValid,
          isUsed: verificationResult.isUsed,
          eventName: verificationResult.eventName,
          eventDate: Number(verificationResult.eventDate),
        };
      } catch (error: any) {
        toast({
          title: "Verification Failed",
          description: error.message || "Could not verify ticket",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  const useTicket = useCallback(
    async (ticketId: number) => {
      setIsLoading(true);
      try {
        const contract = web3Service.getContract();
        const tx = await contract.useTicket(ticketId);
        await tx.wait();

        toast({
          title: "Ticket Used",
          description: "Ticket has been marked as used successfully",
        });

        return tx;
      } catch (error: any) {
        toast({
          title: "Failed to Use Ticket",
          description: error.message || "Could not mark ticket as used",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const updateEvent = useCallback(
    async (eventData: {
      eventId: number;
      name: string;
      description: string;
      venue: string;
      eventDate: string;
      prices: [number, number, number];
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
        const eventTimestamp = Math.floor(
          new Date(eventData.eventDate).getTime() / 1000
        );

        const tx = await contract.updateEventDetails(
          eventData.eventId,
          eventData.name,
          eventData.description,
          eventData.venue,
          eventTimestamp,
          ethPrices,
          eventData.supply
        );

        await tx.wait();

        toast({
          title: "Event Updated",
          description: "Event has been successfully updated on the blockchain!",
        });

        return tx;
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update event",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const deleteEvent = useCallback(
    async (eventId: number) => {
      setIsLoading(true);
      try {
        const contract = web3Service.getContract();
        const tx = await contract.deleteEvent(eventId);
        await tx.wait();

        toast({
          title: "Event Deleted",
          description:
            "Event has been successfully deleted (marked as inactive)",
        });

        return tx;
      } catch (error: any) {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete event",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getTicketDetails = useCallback(
    async (ticketId: number) => {
      try {
        const contract = web3Service.getContract();
        const ticketDetails = await contract.getTicketDetails(ticketId);

        // Convert price back to KES
        const ethAmount = web3Service.formatEther(ticketDetails.purchasePrice);
        const kesPrice = await web3Service.ethToKes(ethAmount);

        return {
          eventId: Number(ticketDetails.eventId),
          ticketOwner: ticketDetails.ticketOwner,
          ticketType: ticketDetails.ticketType,
          purchasePrice: kesPrice,
          isUsed: ticketDetails.isUsed,
          seat: ticketDetails.seat,
        };
      } catch (error: any) {
        toast({
          title: "Failed to Load Ticket",
          description: error.message || "Could not load ticket details",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  const checkIfAdmin = useCallback(async (address: string) => {
    try {
      const contract = web3Service.getContract();
      const isAdmin = await contract.admins(address);
      return isAdmin;
    } catch (error: any) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }, []);

  const getContractOwner = useCallback(async () => {
    try {
      const contract = web3Service.getContract();
      const owner = await contract.owner();
      return owner;
    } catch (error: any) {
      console.error("Failed to get contract owner:", error);
      return null;
    }
  }, []);

  // Admin management functions
  const addAdmin = useCallback(
    async (adminAddress: string) => {
      if (!adminAddress || !ethers.isAddress(adminAddress)) {
        throw new Error("Please enter a valid Ethereum address");
      }

      setIsLoading(true);
      try {
        const contract = web3Service.getContract();
        const tx = await contract.addAdmin(adminAddress);

        console.log("Add admin transaction sent:", tx.hash);
        await tx.wait();

        toast({
          title: "Admin Added",
          description: `Successfully added ${adminAddress} as an admin`,
        });

        return tx;
      } catch (error: any) {
        console.error("Add admin error:", error);
        let errorMessage = "Failed to add admin";

        if (error.code === 4001) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("Only owner")) {
          errorMessage = "Only the contract owner can add admins";
        } else if (error.message.includes("Invalid address")) {
          errorMessage = "Invalid Ethereum address provided";
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const removeAdmin = useCallback(
    async (adminAddress: string) => {
      if (!adminAddress || !ethers.isAddress(adminAddress)) {
        throw new Error("Please enter a valid Ethereum address");
      }

      setIsLoading(true);
      try {
        const contract = web3Service.getContract();
        const tx = await contract.removeAdmin(adminAddress);

        console.log("Remove admin transaction sent:", tx.hash);
        await tx.wait();

        toast({
          title: "Admin Removed",
          description: `Successfully removed ${adminAddress} from admin role`,
        });

        return tx;
      } catch (error: any) {
        console.error("Remove admin error:", error);
        let errorMessage = "Failed to remove admin";

        if (error.code === 4001) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.message.includes("Only owner")) {
          errorMessage = "Only the contract owner can remove admins";
        } else if (error.message.includes("Cannot remove owner")) {
          errorMessage = "Cannot remove the contract owner from admin role";
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    isLoading,
    createEvent,
    purchaseTicket,
    getEventDetails,
    getUserTickets,
    getEventCounter,
    verifyTicket,
    useTicket,
    updateEvent,
    deleteEvent,
    getTicketDetails,
    checkIfAdmin,
    getContractOwner,
    addAdmin,
    removeAdmin,
  };
}
