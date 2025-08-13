import QRCode from 'qrcode';

// Test function to verify QRCode library works
export async function testQRGeneration(): Promise<string> {
  try {
    const testData = "Hello World Test";
    const result = await QRCode.toDataURL(testData);
    console.log('QR test successful:', result.substring(0, 50) + '...');
    return result;
  } catch (error) {
    console.error('QR test failed:', error);
    throw error;
  }
}
import { type Ticket } from '@shared/schema';

export interface TicketQRData {
  ticketId: string;
  eventId: string;
  ticketType: number;
  owner: string;
  isUsed: boolean;
  timestamp: number;
}

export async function generateTicketQR(
  ticket: Ticket, 
  eventName: string,
  eventDate: Date
): Promise<string> {
  try {
    console.log('Generating QR code for ticket:', ticket);
    
    // Safely convert all BigInt values to strings
    const qrData: TicketQRData = {
      ticketId: typeof ticket.ticketId === 'bigint' ? ticket.ticketId.toString() : String(ticket.ticketId),
      eventId: typeof ticket.eventId === 'bigint' ? ticket.eventId.toString() : String(ticket.eventId),
      ticketType: ticket.ticketType,
      owner: ticket.owner,
      isUsed: ticket.isUsed,
      timestamp: Date.now()
    };

    // Create a verification URL or data string with BigInt-safe serialization
    const verificationData = {
      ...qrData,
      eventName,
      eventDate: eventDate.getTime(),
      verifyUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?ticketId=${qrData.ticketId}`,
      // Add additional verification info
      purchasePrice: typeof ticket.purchasePrice === 'bigint' ? ticket.purchasePrice.toString() : String(ticket.purchasePrice),
      seat: ticket.seat || null
    };

    // Use a custom JSON.stringify replacer to handle any remaining BigInt values
    const qrString = JSON.stringify(verificationData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
    
    console.log('QR String to encode:', qrString);
    
    // Generate QR code with optimized settings
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('QR code generated successfully');
    return qrCodeDataURL;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    
    // Fallback: try with minimal safe data
    try {
      const ticketIdStr = typeof ticket.ticketId === 'bigint' ? ticket.ticketId.toString() : String(ticket.ticketId);
      const eventIdStr = typeof ticket.eventId === 'bigint' ? ticket.eventId.toString() : String(ticket.eventId);
      
      const simpleData = JSON.stringify({
        ticketId: ticketIdStr,
        eventId: eventIdStr,
        owner: ticket.owner,
        eventName: eventName,
        verifyUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?ticketId=${ticketIdStr}`
      });
      
      console.log('Trying fallback with simple data:', simpleData);
      const fallbackQR = await QRCode.toDataURL(simpleData);
      return fallbackQR;
    } catch (fallbackError) {
      console.error('Fallback QR generation also failed:', fallbackError);
      throw new Error(`QR generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export function parseTicketQR(qrData: string): TicketQRData | null {
  try {
    const parsed = JSON.parse(qrData);
    return {
      ticketId: parsed.ticketId,
      eventId: parsed.eventId,
      ticketType: parsed.ticketType,
      owner: parsed.owner,
      isUsed: parsed.isUsed,
      timestamp: parsed.timestamp
    };
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
}