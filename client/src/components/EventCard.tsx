import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star, Ticket } from "lucide-react";
import { type Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  availableTickets: number;
  onClick: () => void;
}

export function EventCard({
  event,
  availableTickets,
  onClick,
}: EventCardProps) {
  const eventDate = new Date(event.eventDate * 1000);
  const minPrice = Math.min(...event.prices);
  const maxPrice = Math.max(...event.prices);
  const totalCapacity = event.supply.reduce((sum, s) => sum + s, 0);
  const soldTickets = event.sold.reduce((sum, s) => sum + s, 0);
  const salePercentage = ((soldTickets / totalCapacity) * 100).toFixed(0);

  const getStatusBadge = () => {
    if (!event.isActive)
      return (
        <Badge variant="destructive" className="rounded-full">
          Inactive
        </Badge>
      );
    if (availableTickets === 0)
      return (
        <Badge variant="destructive" className="rounded-full bg-red-500">
          Sold Out
        </Badge>
      );
    if (availableTickets < 20)
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
          Almost Full
        </Badge>
      );
    return (
      <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-full">
        Available
      </Badge>
    );
  };

  const getPopularityStars = () => {
    const popularity = Math.min(
      5,
      Math.ceil((soldTickets / totalCapacity) * 5)
    );
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < popularity ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Card
      className="group overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-white shadow-lg"
      onClick={onClick}
    >
      {/* Hero Image with Overlay */}
      <div className="relative h-56 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {getStatusBadge()}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">
              {salePercentage}% sold
            </span>
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/30 animate-pulse"></div>
          <div className="absolute bottom-8 left-8 w-12 h-12 rounded-full bg-white/20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 rounded-full bg-white/25 animate-pulse delay-500"></div>
        </div>

        {/* Event Category Badge */}
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-white/90 text-gray-800 hover:bg-white rounded-full">
            <Ticket className="w-3 h-3 mr-1" />
            Live Event
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Event Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center mt-1 space-x-1">
            {getPopularityStars()}
            <span className="text-xs text-gray-500 ml-2">Popular event</span>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-3 text-indigo-500" />
            <div>
              <span className="text-sm font-medium">
                {eventDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-sm">
                {eventDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-3 text-pink-500" />
            <span className="text-sm font-medium truncate">{event.venue}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-3 text-purple-500" />
            <span className="text-sm">
              <span className="font-medium text-gray-800">
                {availableTickets}
              </span>
              <span className="text-gray-500">
                {" "}
                of {totalCapacity} tickets left
              </span>
            </span>
          </div>
        </div>

        {/* Price and Action Section */}
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Starting from
              </p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-900">
                  KES {minPrice.toLocaleString()}
                </p>
                {maxPrice > minPrice && (
                  <p className="text-sm text-gray-500 line-through">
                    KES {maxPrice.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                Buy Now
              </div>
            </div>
          </div>

          {/* Progress bar showing how many tickets sold */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Ticket Sales</span>
              <span>{salePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${salePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
