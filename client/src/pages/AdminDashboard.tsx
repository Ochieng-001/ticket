import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createEventSchema,
  type CreateEventInput,
  type Event,
} from "@shared/schema";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import {
  Calendar,
  Ticket,
  Coins,
  Users,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  Crown,
  Star,
  Sparkles,
  MapPin,
  Clock,
  Shield,
  Activity,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ContractDebugInfo } from "@/components/ContractDebugInfo";

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    createEvent,
    getEventDetails,
    getEventCounter,
    updateEvent,
    deleteEvent,
    isLoading,
  } = useContract();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      description: "",
      venue: "",
      eventDate: "",
      regularPrice: 1000,
      vipPrice: 2500,
      vvipPrice: 5000,
      regularSupply: 100,
      vipSupply: 50,
      vvipSupply: 20,
    },
  });

  const editForm = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      description: "",
      venue: "",
      eventDate: "",
      regularPrice: 1000,
      vipPrice: 2500,
      vvipPrice: 5000,
      regularSupply: 100,
      vipSupply: 50,
      vvipSupply: 20,
    },
  });

  useEffect(() => {
    if (isConnected && address) {
      checkIfOwner();
    } else {
      setIsCheckingOwner(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected && isOwner) {
      loadDashboardData();
    }
  }, [isConnected, isOwner]);

  const checkIfOwner = async () => {
    try {
      setIsCheckingOwner(true);
      // Create a provider to check contract owner
      if (window.ethereum && address) {
        const ethers = await import("ethers");
        const { CONTRACT_ABI, CONTRACT_ADDRESS } = await import(
          "@/lib/contractABI"
        );

        if (!CONTRACT_ADDRESS) {
          setIsOwner(false);
          setIsCheckingOwner(false);
          return;
        }

        const provider = new ethers.ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );
        const contractOwner = await contract.owner();

        setIsOwner(address.toLowerCase() === contractOwner.toLowerCase());
      }
    } catch (error) {
      console.error("Failed to check owner:", error);
      setIsOwner(false);
    } finally {
      setIsCheckingOwner(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const eventCount = await getEventCounter();
      const eventPromises = [];

      for (let i = 1; i <= eventCount; i++) {
        eventPromises.push(getEventDetails(i));
      }

      const eventResults = await Promise.all(eventPromises);
      const allEvents = eventResults.map((result) => result.event);

      setEvents(allEvents);

      // Calculate stats
      const totalTicketsSold = allEvents.reduce(
        (sum, event) =>
          sum + event.sold.reduce((eventSum, sold) => eventSum + sold, 0),
        0
      );

      const totalRevenue = allEvents.reduce(
        (sum, event) =>
          sum +
          event.sold.reduce(
            (eventSum, sold, index) => eventSum + sold * event.prices[index],
            0
          ),
        0
      );

      setStats({
        totalEvents: eventCount,
        totalTicketsSold,
        totalRevenue: totalRevenue * 0.0000075, // Convert KES to ETH for display
        activeEvents: allEvents.filter((e) => e.isActive).length,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const onSubmit = async (data: CreateEventInput) => {
    try {
      await createEvent({
        name: data.name,
        description: data.description,
        venue: data.venue,
        eventDate: data.eventDate,
        prices: [data.regularPrice, data.vipPrice, data.vvipPrice],
        supply: [data.regularSupply, data.vipSupply, data.vvipSupply],
      });

      form.reset();
      loadDashboardData();
      setShowCreateDialog(false);
      toast({
        title: "Event Created",
        description:
          "Your event has been successfully created on the blockchain.",
      });
    } catch (error) {
      console.error("Failed to create event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    editForm.reset({
      name: event.name,
      description: event.description || "",
      venue: event.venue,
      eventDate: new Date(event.eventDate * 1000).toISOString().split("T")[0],
      regularPrice: event.prices[0],
      vipPrice: event.prices[1],
      vvipPrice: event.prices[2],
      regularSupply: event.supply[0],
      vipSupply: event.supply[1],
      vvipSupply: event.supply[2],
    });
    setShowEditDialog(true);
  };

  const handleUpdateEvent = async (data: CreateEventInput) => {
    if (!editingEvent) return;

    try {
      await updateEvent({
        eventId: editingEvent.eventId,
        name: data.name,
        description: data.description,
        venue: data.venue,
        eventDate: data.eventDate,
        prices: [data.regularPrice, data.vipPrice, data.vvipPrice],
        supply: [data.regularSupply, data.vipSupply, data.vvipSupply],
      });

      setShowEditDialog(false);
      setEditingEvent(null);
      // Refresh the events list
      loadDashboardData();
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId);
      // Refresh the events list
      loadDashboardData();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-lg border-0 shadow-2xl bg-white">
          <CardHeader className="text-center pb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <p className="text-lg text-indigo-800 font-medium text-center">
                Connect your wallet to access the admin dashboard and manage
                events.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCheckingOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-lg border-0 shadow-2xl bg-white">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Checking Access...
            </h2>
            <p className="text-gray-600">
              Verifying your admin permissions on the blockchain
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <Card className="w-full max-w-lg border-0 shadow-2xl bg-white">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Access Denied
            </h2>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-100 mb-4">
              <p className="text-red-800 font-medium mb-2">
                Only the contract owner can access the admin dashboard
              </p>
              <p className="text-sm text-red-600">
                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20">
            <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-indigo-500/20 animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-purple-500/20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-pink-500/20 animate-pulse delay-500"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  Administrator Access
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Create and manage blockchain-secured events with comprehensive
                analytics
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live Events</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                  <span className="text-sm">Smart Contracts</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                  <span className="text-sm">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-20 relative z-10">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Total Events
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalEvents}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Ticket className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Tickets Sold
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalTicketsSold.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <BarChart3 className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    Sales
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Coins className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Revenue (ETH)
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalRevenue.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Earned
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Active Events
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.activeEvents}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Activity className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    Live
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Event Form */}
          <Card className="mb-12 border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                Create New Event
              </CardTitle>
              <p className="text-lg text-gray-600">
                Launch a new blockchain-secured event with comprehensive ticket
                management
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter event name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue</FormLabel>
                          <FormControl>
                            <Input placeholder="Event venue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Event description"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ticket Configuration */}
                    <div className="md:col-span-2">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-6">
                        <h4 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                          <Ticket className="w-6 h-6 mr-2 text-indigo-600" />
                          Ticket Configuration
                        </h4>
                        <p className="text-gray-600 mb-6">
                          Configure pricing and availability for different
                          ticket types
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Regular Tickets */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <h5 className="text-xl font-bold text-gray-900">
                              Regular Tickets
                            </h5>
                          </div>
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="regularPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="regularSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* VIP Tickets */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                            <h5 className="text-xl font-bold text-gray-900">
                              VIP Tickets
                            </h5>
                          </div>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="vipPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vipSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* VVIP Tickets */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h5 className="text-xl font-bold text-gray-900">
                              VVIP Tickets
                            </h5>
                          </div>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="vvipPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vvipSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {isLoading ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-pulse" />
                          Creating Event...
                        </>
                      ) : (
                        "Create Event"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Events Management */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                Manage Events
              </CardTitle>
              <p className="text-lg text-gray-600">
                Monitor and update your blockchain events with real-time
                analytics
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {events.map((event) => (
                  <div
                    key={event.eventId}
                    className="bg-gradient-to-r from-white to-gray-50 border-0 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-3 animate-pulse"></div>
                          <h4 className="text-2xl font-bold text-gray-900">
                            {event.name}
                          </h4>
                        </div>

                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          <p className="font-medium">{event.venue}</p>
                        </div>

                        <div className="flex items-center text-gray-500 mb-4">
                          <Clock className="w-4 h-4 mr-2" />
                          <p>
                            {new Date(
                              event.eventDate * 1000
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              event.eventDate * 1000
                            ).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center mb-2">
                              <Star className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-semibold text-gray-800">
                                Regular
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {event.sold[0]}
                              <span className="text-sm text-gray-600">
                                /{event.supply[0]}
                              </span>
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center mb-2">
                              <Crown className="w-4 h-4 text-purple-600 mr-2" />
                              <span className="text-sm font-semibold text-gray-800">
                                VIP
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {event.sold[1]}
                              <span className="text-sm text-gray-600">
                                /{event.supply[1]}
                              </span>
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-center mb-2">
                              <Sparkles className="w-4 h-4 text-orange-600 mr-2" />
                              <span className="text-sm font-semibold text-gray-800">
                                VVIP
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {event.sold[2]}
                              <span className="text-sm text-gray-600">
                                /{event.supply[2]}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-4">
                        <Badge
                          className={
                            event.isActive
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-3 py-1"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 px-3 py-1"
                          }
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              event.isActive
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-400"
                            }`}
                          ></div>
                          {event.isActive ? "Active" : "Inactive"}
                        </Badge>

                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 px-4 py-2 rounded-xl"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 hover:from-red-100 hover:to-pink-100 hover:border-red-300 px-4 py-2 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Event
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{event.name}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteEvent(event.eventId)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {events.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Events Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first blockchain-secured event to get started
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-6 py-3 border border-indigo-100">
                        <p className="text-sm text-indigo-800">
                          Use the form above to create your first event
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Event Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update your event details. Note: Some restrictions may apply
                  based on tickets already sold.
                </DialogDescription>
              </DialogHeader>

              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit(handleUpdateEvent)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter event name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue</FormLabel>
                          <FormControl>
                            <Input placeholder="Event venue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={editForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Event description"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ticket Configuration */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Ticket Configuration
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Note: Price and supply changes may be restricted if
                        tickets have already been sold.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Regular Tickets */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">
                            Regular Tickets
                          </h5>
                          <div className="space-y-3">
                            <FormField
                              control={editForm.control}
                              name="regularPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="regularSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* VIP Tickets */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">
                            VIP Tickets
                          </h5>
                          <div className="space-y-3">
                            <FormField
                              control={editForm.control}
                              name="vipPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="vipSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* VVIP Tickets */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">
                            VVIP Tickets
                          </h5>
                          <div className="space-y-3">
                            <FormField
                              control={editForm.control}
                              name="vvipPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price (KES)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="vvipSupply"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Supply</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      <Edit className="w-4 h-4 mr-2" />
                      {isLoading ? "Updating..." : "Update Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
