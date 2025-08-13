import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { CheckCircle, XCircle, Search, Clock, Ticket, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TicketVerificationResult {
  isValid: boolean;
  isUsed: boolean;
  eventName: string;
  eventDate: number;
}

interface TicketDetails {
  eventId: number;
  ticketOwner: string;
  ticketType: number;
  purchasePrice: number;
  isUsed: boolean;
  seat: string;
}

export default function TicketVerification() {
  const [ticketId, setTicketId] = useState("");
  const [verificationResult, setVerificationResult] = useState<TicketVerificationResult | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUsingTicket, setIsUsingTicket] = useState(false);
  const [error, setError] = useState("");

  const { verifyTicket, useTicket, getTicketDetails, isLoading } = useContract();
  const { isConnected, address } = useWallet();

  const getTicketTypeName = (type: number) => {
    switch (type) {
      case 0: return "Regular";
      case 1: return "VIP";
      case 2: return "VVIP";
      default: return "Unknown";
    }
  };

  const handleVerifyTicket = async () => {
    if (!ticketId || !ticketId.trim()) {
      setError("Please enter a ticket ID");
      return;
    }

    setIsVerifying(true);
    setError("");
    setVerificationResult(null);
    setTicketDetails(null);

    try {
      const ticketIdNum = parseInt(ticketId.trim());
      
      // Verify ticket and get details
      const [verification, details] = await Promise.all([
        verifyTicket(ticketIdNum),
        getTicketDetails(ticketIdNum)
      ]);

      setVerificationResult(verification);
      setTicketDetails(details);
    } catch (error: any) {
      setError(error.message || "Failed to verify ticket");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseTicket = async () => {
    if (!ticketId || !verificationResult) return;

    setIsUsingTicket(true);
    try {
      await useTicket(parseInt(ticketId));
      
      // Refresh verification result
      const updatedVerification = await verifyTicket(parseInt(ticketId));
      const updatedDetails = await getTicketDetails(parseInt(ticketId));
      
      setVerificationResult(updatedVerification);
      setTicketDetails(updatedDetails);
    } catch (error: any) {
      setError(error.message || "Failed to use ticket");
    } finally {
      setIsUsingTicket(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ticket Verification</CardTitle>
            <CardDescription>Connect your wallet to verify tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Please connect your MetaMask wallet to access the ticket verification system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Verification</h1>
          <p className="text-gray-600 mt-2">Verify and manage ticket usage</p>
        </div>

        {/* Verification Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Verify Ticket
            </CardTitle>
            <CardDescription>
              Enter a ticket ID to verify its authenticity and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter Ticket ID (e.g. 1, 2, 3...)"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyTicket()}
                className="flex-1"
              />
              <Button 
                onClick={handleVerifyTicket}
                disabled={isVerifying || isLoading}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Results */}
        {verificationResult && ticketDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {verificationResult.isValid ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2 text-red-600" />
                  )}
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket Valid:</span>
                  <Badge variant={verificationResult.isValid ? "default" : "destructive"}>
                    {verificationResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket Status:</span>
                  <Badge variant={verificationResult.isUsed ? "secondary" : "default"}>
                    {verificationResult.isUsed ? "Used" : "Unused"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium">{verificationResult.eventName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Date:</span>
                  <span className="font-medium">
                    {format(new Date(verificationResult.eventDate * 1000), "PPP")}
                  </span>
                </div>

                {verificationResult.isValid && !verificationResult.isUsed && (
                  <Button
                    onClick={handleUseTicket}
                    disabled={isUsingTicket}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    {isUsingTicket ? "Marking as Used..." : "Mark as Used"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="w-5 h-5 mr-2" />
                  Ticket Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket ID:</span>
                  <span className="font-mono font-medium">#{ticketId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">
                    {getTicketTypeName(ticketDetails.ticketType)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seat:</span>
                  <span className="font-medium">{ticketDetails.seat}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">KES {ticketDetails.purchasePrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-mono text-xs">
                    {`${ticketDetails.ticketOwner.slice(0, 6)}...${ticketDetails.ticketOwner.slice(-4)}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use Ticket Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-3">
                <Search className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Verify Ticket</h4>
                  <p className="text-gray-600">Enter a ticket ID to check its authenticity and current status.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Check Status</h4>
                  <p className="text-gray-600">See if the ticket is valid and whether it has been used before.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Mark as Used</h4>
                  <p className="text-gray-600">For valid unused tickets, mark them as used during event entry.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}