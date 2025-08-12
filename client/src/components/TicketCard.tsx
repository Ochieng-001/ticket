import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { type Ticket, TicketType } from "@shared/schema";

interface TicketCardProps {
  ticket: Ticket;
  eventName: string;
  eventDate: Date;
  venue: string;
}

export function TicketCard({ ticket, eventName, eventDate, venue }: TicketCardProps) {
  const getTicketTypeLabel = (type: TicketType) => {
    switch (type) {
      case TicketType.REGULAR: return "Regular";
      case TicketType.VIP: return "VIP";
      case TicketType.VVIP: return "VVIP";
      default: return "Regular";
    }
  };

  const getStatusBadge = () => {
    if (ticket.isUsed) {
      return <Badge variant="destructive">Used</Badge>;
    }
    if (eventDate < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge className="bg-secondary/10 text-secondary">Valid</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{eventName}</h3>
            <p className="text-sm opacity-80">{getTicketTypeLabel(ticket.ticketType)} Ticket</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Ticket #</p>
            <p className="font-mono font-semibold">{ticket.ticketId.toString().padStart(6, '0')}</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Date</span>
            <span className="font-medium">{eventDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Venue</span>
            <span className="font-medium">{venue}</span>
          </div>
          {ticket.seat && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seat</span>
              <span className="font-medium">{ticket.seat}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price Paid</span>
            <span className="font-medium">KES {ticket.purchasePrice.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {getStatusBadge()}
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            <QrCode className="w-4 h-4 mr-1" />
            Show QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
