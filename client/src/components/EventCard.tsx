import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { type Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  availableTickets: number;
  onClick: () => void;
}

export function EventCard({ event, availableTickets, onClick }: EventCardProps) {
  const eventDate = new Date(event.eventDate * 1000);
  const minPrice = Math.min(...event.prices);
  const maxPrice = Math.max(...event.prices);

  const getStatusBadge = () => {
    if (!event.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (availableTickets === 0) return <Badge variant="destructive">Sold Out</Badge>;
    if (availableTickets < 20) return <Badge className="bg-accent text-white">Almost Full</Badge>;
    return <Badge className="bg-secondary/10 text-secondary">Available</Badge>;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="h-48 bg-gradient-to-r from-primary to-blue-600"></div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{event.name}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{eventDate.toLocaleDateString()} • {eventDate.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{event.venue}</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Starting from</p>
              <p className="text-lg font-bold text-gray-900">KES {minPrice.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-lg font-bold text-secondary">{availableTickets} tickets</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
