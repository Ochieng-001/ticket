import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  Ticket,
  MapPin,
  Calendar,
  Shield,
  User,
  CreditCard,
  Hash,
  Scan,
  Zap,
} from "lucide-react";
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
  const [verificationResult, setVerificationResult] =
    useState<TicketVerificationResult | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUsingTicket, setIsUsingTicket] = useState(false);
  const [error, setError] = useState("");

  const { verifyTicket, useTicket, getTicketDetails, isLoading } =
    useContract();
  const { isConnected, address } = useWallet();

  const getTicketTypeName = (type: number) => {
    switch (type) {
      case 0:
        return "Regular";
      case 1:
        return "VIP";
      case 2:
        return "VVIP";
      default:
        return "Unknown";
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
        getTicketDetails(ticketIdNum),
      ]);

      setVerificationResult(verification);
      setTicketDetails(details);
    } catch (error: any) {
      // Show simple invalid ticket alert instead of detailed errors
      alert("Invalid ticket");
      setError("");
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
      // Show simple invalid ticket alert instead of detailed errors
      alert("Invalid ticket");
      setError("");
    } finally {
      setIsUsingTicket(false);
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
              Ticket Verification
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Connect your wallet to access the verification system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Alert className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <Shield className="w-5 h-5 text-indigo-600" />
              <AlertDescription className="text-indigo-800 font-medium">
                MetaMask wallet connection required to verify blockchain-secured
                tickets.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-indigo-500/20 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-purple-500/20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-pink-500/20 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Shield className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Blockchain Verification System
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Ticket Verification
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Instantly verify ticket authenticity and manage entry with
              blockchain security
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Fraud Prevention</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm">Instant Verification</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                <span className="text-sm">Smart Contracts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Verification Form */}
        <Card className="mb-12 border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Scan className="w-8 h-8 mr-3 text-indigo-600" />
              Verify Ticket
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Enter a ticket ID to instantly verify its authenticity and check
              usage status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter Ticket ID (e.g. 000001, 000042...)"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleVerifyTicket()
                      }
                      className="h-14 text-lg bg-white border-2 border-gray-200 focus:border-indigo-400 rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleVerifyTicket}
                    disabled={isVerifying || isLoading}
                    className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isVerifying ? (
                      <>
                        <Zap className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center mt-6 space-x-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Powered by Ethereum smart contracts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Results */}
        {verificationResult && ticketDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Verification Status */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  {verificationResult.isValid ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mr-4">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <div
                    className={`p-4 rounded-xl border-2 ${
                      verificationResult.isValid
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                        : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Authenticity
                        </p>
                        <p
                          className={`text-xl font-bold ${
                            verificationResult.isValid
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          {verificationResult.isValid
                            ? "Authentic Ticket"
                            : "Invalid Ticket"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          verificationResult.isValid ? "default" : "destructive"
                        }
                        className="rounded-full px-4 py-2"
                      >
                        {verificationResult.isValid ? "✓ Valid" : "✗ Invalid"}
                      </Badge>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border-2 ${
                      verificationResult.isUsed
                        ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Usage Status
                        </p>
                        <p
                          className={`text-xl font-bold ${
                            verificationResult.isUsed
                              ? "text-gray-800"
                              : "text-blue-800"
                          }`}
                        >
                          {verificationResult.isUsed
                            ? "Already Used"
                            : "Ready for Entry"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          verificationResult.isUsed ? "secondary" : "default"
                        }
                        className="rounded-full px-4 py-2"
                      >
                        {verificationResult.isUsed ? "Used" : "Unused"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                    Event Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Event Name:</span>
                      <span className="font-semibold text-gray-900 text-right truncate max-w-48">
                        {verificationResult.eventName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {format(
                          new Date(verificationResult.eventDate * 1000),
                          "PPP"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {verificationResult.isValid && !verificationResult.isUsed && (
                  <div className="pt-4">
                    <Button
                      onClick={handleUseTicket}
                      disabled={isUsingTicket}
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isUsingTicket ? (
                        <>
                          <Zap className="w-5 h-5 mr-2 animate-spin" />
                          Marking as Used...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Mark as Used
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  Ticket Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ticket ID */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Hash className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          Ticket ID
                        </p>
                        <p className="text-2xl font-bold font-mono text-indigo-900">
                          #{ticketId.padStart(6, "0")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Information Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600 font-medium">
                          Ticket Type
                        </span>
                      </div>
                      <Badge
                        className={`rounded-full px-4 py-2 ${
                          ticketDetails.ticketType === 0
                            ? "bg-blue-100 text-blue-800"
                            : ticketDetails.ticketType === 1
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {getTicketTypeName(ticketDetails.ticketType)}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-pink-600" />
                        <span className="text-gray-600 font-medium">
                          Seat Assignment
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {ticketDetails.seat}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600 font-medium">
                          Purchase Price
                        </span>
                      </div>
                      <span className="font-bold text-green-700">
                        KES {ticketDetails.purchasePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span className="text-gray-600 font-medium">
                          Owner Address
                        </span>
                      </div>
                      <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-full">
                        {`${ticketDetails.ticketOwner.slice(
                          0,
                          6
                        )}...${ticketDetails.ticketOwner.slice(-4)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blockchain Verification */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">
                        Blockchain Verified
                      </p>
                      <p className="text-sm text-green-600">
                        This ticket is secured on the Ethereum blockchain
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
