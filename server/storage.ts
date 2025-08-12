// Since we're using blockchain as the data layer, we don't need traditional storage
// This file exists to maintain compatibility with the framework structure

export interface IStorage {
  // Placeholder interface - blockchain serves as our storage layer
  getBlockchainConnection(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  constructor() {}

  async getBlockchainConnection(): Promise<boolean> {
    // This would check blockchain connection status
    return true;
  }
}

export const storage = new MemStorage();
