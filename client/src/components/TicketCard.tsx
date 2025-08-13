import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Calendar,
  MapPin,
  CreditCard,
  Hash,
  Crown,
  Star,
  Sparkles,
  Download,
  Image,
} from "lucide-react";
import { type Ticket, TicketType } from "@shared/schema";
import { generateTicketQR, testQRGeneration } from "@/lib/qrcode";
import { formatPrice } from "@/lib/formatPrice";
import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

interface TicketCardProps {
  ticket: Ticket;
  eventName: string;
  eventDate: Date;
  venue: string;
}

export function TicketCard({
  ticket,
  eventName,
  eventDate,
  venue,
}: TicketCardProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      setIsGeneratingQR(true);
      setQrError(null);
      try {
        // First test if QR library works at all
        console.log("Testing QR library...");
        await testQRGeneration();

        console.log("TicketCard: Starting QR generation for:", {
          ticket,
          eventName,
          eventDate,
        });
        const qrCode = await generateTicketQR(ticket, eventName, eventDate);
        setQrCodeDataURL(qrCode);
        console.log("TicketCard: QR code generated successfully");
      } catch (error) {
        console.error("TicketCard: Failed to generate QR code:", error);
        setQrError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsGeneratingQR(false);
      }
    };

    generateQRCode();
  }, [ticket, eventName, eventDate]);

  const downloadTicketAsImage = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        width: ticketRef.current.offsetWidth,
        height: ticketRef.current.offsetHeight,
      });

      const link = document.createElement("a");
      link.download = `ticket-${ticket.ticketId}-${eventName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download ticket:", error);
    } finally {
      setIsDownloading(false);
    }
  };
  const getTicketTypeLabel = (type: TicketType) => {
    switch (type) {
      case TicketType.REGULAR:
        return "Regular";
      case TicketType.VIP:
        return "VIP";
      case TicketType.VVIP:
        return "VVIP";
      default:
        return "Regular";
    }
  };

  const getTicketTypeIcon = (type: TicketType) => {
    switch (type) {
      case TicketType.REGULAR:
        return <Star className="w-4 h-4" />;
      case TicketType.VIP:
        return <Crown className="w-4 h-4" />;
      case TicketType.VVIP:
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getTicketTypeGradient = (type: TicketType) => {
    switch (type) {
      case TicketType.REGULAR:
        return "from-blue-500 to-indigo-600";
      case TicketType.VIP:
        return "from-purple-500 to-pink-600";
      case TicketType.VVIP:
        return "from-yellow-400 via-orange-500 to-red-500";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const getStatusBadge = () => {
    if (ticket.isUsed) {
      return (
        <Badge variant="destructive" className="rounded-full bg-red-500">
          Used
        </Badge>
      );
    }
    if (eventDate < new Date()) {
      return (
        <Badge variant="secondary" className="rounded-full bg-gray-500">
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500 text-white rounded-full">Valid</Badge>
    );
  };

  return (
    <Card
      ref={ticketRef}
      className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white"
    >
      {/* Ticket Header with Gradient */}
      <div
        className={`bg-gradient-to-r ${getTicketTypeGradient(
          ticket.ticketType
        )} text-white p-6 relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-4 w-20 h-20 rounded-full bg-white/20"></div>
          <div className="absolute bottom-2 left-4 w-16 h-16 rounded-full bg-white/15"></div>
          <div className="absolute top-1/2 right-1/3 w-8 h-8 rounded-full bg-white/10"></div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 truncate">
                {eventName}
              </h3>
              <div className="flex items-center space-x-2">
                {getTicketTypeIcon(ticket.ticketType)}
                <span className="text-sm font-semibold opacity-90">
                  {getTicketTypeLabel(ticket.ticketType)} Access
                </span>
              </div>
            </div>

            <div className="text-right ml-4">
              <p className="text-xs opacity-75">Ticket ID</p>
              <p className="font-mono font-bold text-lg">
                #{ticket.ticketId.toString().padStart(6, "0")}
              </p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-between items-end">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Decorative perforations */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-white">
          <div className="flex justify-between items-center h-full px-4">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTicketTypeGradient(
                  ticket.ticketType
                )}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <CardContent className="p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="grid grid-cols-1 gap-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Event Date
              </p>
              <p className="font-semibold text-gray-900">
                {eventDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-600">
                {eventDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <MapPin className="w-5 h-5 text-pink-500" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Venue
              </p>
              <p className="font-semibold text-gray-900 truncate">{venue}</p>
            </div>
          </div>

          {/* Ticket Type */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            {getTicketTypeIcon(ticket.ticketType)}
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Ticket Type
              </p>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-gray-900">
                  {getTicketTypeLabel(ticket.ticketType)}
                </p>
                <Badge
                  className={`rounded-full text-xs ${
                    ticket.ticketType === TicketType.REGULAR
                      ? "bg-blue-100 text-blue-800"
                      : ticket.ticketType === TicketType.VIP
                      ? "bg-purple-100 text-purple-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {getTicketTypeLabel(ticket.ticketType)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Price Paid */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <CreditCard className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Amount Paid
              </p>
              <p className="font-bold text-xl text-gray-900">
                {formatPrice(ticket.purchasePrice)}
              </p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">
                  Ticket QR Code
                </h3>
              </div>

              {isGeneratingQR ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Generating QR Code...</p>
                </div>
              ) : qrCodeDataURL ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                    <img
                      src={qrCodeDataURL}
                      alt="Ticket QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center max-w-sm">
                    Scan this QR code at the event entrance for quick
                    verification
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = qrCodeDataURL;
                      link.download = `ticket-${ticket.ticketId}-qr.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-red-500">
                    Failed to generate QR code
                  </p>
                  {qrError && (
                    <p className="text-xs text-red-400 text-center max-w-sm">
                      {qrError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg disabled:opacity-50"
            size="lg"
            onClick={downloadTicketAsImage}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Preparing...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Download Ticket
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="border-2 hover:bg-gray-50"
            onClick={() => {
              if (qrCodeDataURL) {
                window.open(qrCodeDataURL, "_blank");
              }
            }}
          >
            <QrCode className="w-4 h-4 mr-2" />
            View QR
          </Button>
        </div>

        {/* Blockchain Verification */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">
            🔗 Verified on Blockchain
          </p>
          <p className="text-xs text-blue-500 mt-1">
            This ticket is secured by smart contract technology
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
