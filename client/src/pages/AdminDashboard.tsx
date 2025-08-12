import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createEventSchema, type CreateEventInput, type Event } from "@shared/schema";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { Calendar, Ticket, Coins, Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });

  const { createEvent, getEventDetails, getEventCounter, isLoading } = useContract();
  const { isConnected } = useWallet();

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

  useEffect(() => {
    if (isConnected) {
      loadDashboardData();
    }
  }, [isConnected]);

  const loadDashboardData = async () => {
    try {
      const eventCount = await getEventCounter();
      const eventPromises = [];
      
      for (let i = 1; i <= eventCount; i++) {
        eventPromises.push(getEventDetails(i));
      }
      
      const eventResults = await Promise.all(eventPromises);
      const allEvents = eventResults.map(result => result.event);
      
      setEvents(allEvents);
      
      // Calculate stats
      const totalTicketsSold = allEvents.reduce((sum, event) => 
        sum + event.sold.reduce((eventSum, sold) => eventSum + sold, 0), 0
      );
      
      const totalRevenue = allEvents.reduce((sum, event) => 
        sum + event.sold.reduce((eventSum, sold, index) => 
          eventSum + (sold * event.prices[index]), 0
        ), 0
      );
      
      setStats({
        totalEvents: eventCount,
        totalTicketsSold,
        totalRevenue: totalRevenue * 0.0000075, // Convert KES to ETH for display
        activeEvents: allEvents.filter(e => e.isActive).length,
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
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to access the admin dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-2">Create and manage events on the blockchain</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Ticket className="w-5 h-5 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTicketsSold}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Coins className="w-5 h-5 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue (ETH)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Event Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event name" {...field} />
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
                            <Textarea placeholder="Event description" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Ticket Configuration */}
                  <div className="md:col-span-2">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Ticket Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Regular Tickets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-3">Regular Tickets</h5>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="regularPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price (KES)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* VIP Tickets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-3">VIP Tickets</h5>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="vipPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price (KES)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* VVIP Tickets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-3">VVIP Tickets</h5>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name="vvipPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price (KES)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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

                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Events Management */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.eventId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.name}</h4>
                      <p className="text-gray-600 text-sm">{event.venue}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(event.eventDate * 1000).toLocaleDateString()} • {new Date(event.eventDate * 1000).toLocaleTimeString()}
                      </p>
                      
                      <div className="mt-3 flex space-x-4 text-sm">
                        <span className="text-gray-600">
                          Regular: <span className="font-medium">{event.sold[0]}</span>/{event.supply[0]}
                        </span>
                        <span className="text-gray-600">
                          VIP: <span className="font-medium">{event.sold[1]}</span>/{event.supply[1]}
                        </span>
                        <span className="text-gray-600">
                          VVIP: <span className="font-medium">{event.sold[2]}</span>/{event.supply[2]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={event.isActive ? "bg-secondary/10 text-secondary" : "bg-gray-100 text-gray-600"}>
                        {event.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No events created yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
