import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since all data is stored on blockchain, we only need minimal API endpoints
  // for things like currency conversion rates
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Blockchain ticketing API is running' });
  });

  // ETH to KES conversion rate endpoint (could fetch from external API)
  app.get('/api/exchange-rate', (req, res) => {
    // In production, this would fetch real exchange rates
    res.json({ 
      ethToKes: 133333, // 1 ETH = 133,333 KES (example)
      kesToEth: 0.0000075 // 1 KES = 0.0000075 ETH
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
