import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletConnection } from "@/components/WalletConnection";
import { Button } from "@/components/ui/button";
import { Ticket, Shield } from "lucide-react";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";
import MyTickets from "@/pages/MyTickets";
import TicketVerification from "@/pages/TicketVerification";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Ticket className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">BlockTicket</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"}
                  className={location === "/" ? "bg-primary text-white" : ""}
                >
                  Events
                </Button>
              </Link>
              <Link href="/tickets">
                <Button 
                  variant={location === "/tickets" ? "default" : "ghost"}
                  className={location === "/tickets" ? "bg-primary text-white" : ""}
                >
                  My Tickets
                </Button>
              </Link>
              <Link href="/verify">
                <Button 
                  variant={location === "/verify" ? "default" : "ghost"}
                  className={location === "/verify" ? "bg-primary text-white" : ""}
                >
                  Verify
                </Button>
              </Link>
              <Link href="/admin">
                <Button 
                  variant={location === "/admin" ? "default" : "ghost"}
                  className={location === "/admin" ? "bg-primary text-white" : ""}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
            
            {/* Wallet Connection */}
            <WalletConnection />
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/tickets" component={MyTickets} />
        <Route path="/verify" component={TicketVerification} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
