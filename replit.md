# BlockTicket - Blockchain Ticketing Platform

## Overview

BlockTicket is a decentralized event ticketing platform built on Ethereum blockchain technology. The application provides a secure, transparent way to create events, purchase tickets, and manage attendance without the need for traditional centralized ticketing authorities. The platform features a React frontend with TypeScript, uses smart contracts for ticket management, and includes wallet integration for Web3 interactions.

The system consists of three main user interfaces: a public event browsing and ticket purchasing interface, an admin dashboard for event creation and management, and a personal tickets view for users to manage their purchased tickets.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Updated contract address configuration to use environment variables properly
- Fixed homepage to display events without requiring wallet connection initially
- Added admin access control - only contract owner can access admin dashboard
- Removed dummy data and improved real blockchain data integration
- Fixed wallet connection flow - users only connect when purchasing tickets
- Improved error handling for contract interactions

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend built with Vite for fast development and building. The architecture follows a component-based pattern with TypeScript for type safety. Key architectural decisions include:

- **Component Structure**: Uses Radix UI components with shadcn/ui styling for consistent, accessible UI components
- **Routing**: Implements wouter for lightweight client-side routing between pages (Home, Admin Dashboard, My Tickets)
- **State Management**: Uses React Query (TanStack Query) for server state management and caching
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
The backend is minimal by design since most data operations occur on the blockchain:

- **Express Server**: Lightweight Express.js server primarily serving the React application
- **API Endpoints**: Limited to utility functions like health checks and currency conversion rates
- **Storage Layer**: No traditional database - blockchain serves as the primary data store
- **Development Setup**: Vite integration for hot module replacement in development

### Blockchain Integration
The core data layer leverages Ethereum smart contracts:

- **Smart Contract**: Solidity contract managing events, tickets, and user permissions
- **Web3 Provider**: Ethers.js for blockchain interactions and wallet connectivity
- **Wallet Integration**: MetaMask integration for user authentication and transaction signing
- **Data Schema**: TypeScript schemas matching smart contract structures for type safety

### Smart Contract Design
The ticket management contract includes:

- **Event Management**: Create events with multiple ticket types (Regular, VIP, VVIP)
- **Ticket Purchasing**: Secure on-chain ticket purchases with automatic inventory management
- **Access Control**: Admin roles for event creation and management
- **Ticket Validation**: On-chain ticket usage tracking to prevent double-spending

### Data Flow Architecture
The application follows a unidirectional data flow:

1. User interactions trigger Web3 transactions through ethers.js
2. Smart contract state changes are reflected in the UI through React Query
3. Local state management handles UI-specific data (modals, forms, loading states)
4. Currency conversion API provides real-time KES to ETH exchange rates

### Development and Build System
The project uses modern development tooling:

- **TypeScript Configuration**: Strict type checking with path aliases for clean imports
- **Build Process**: Vite for frontend bundling, esbuild for server compilation
- **Development Mode**: Hot module replacement with error overlay for rapid development
- **Production Build**: Optimized builds with static asset handling

## External Dependencies

### Blockchain Infrastructure
- **Ethereum Network**: Primary blockchain for smart contract deployment
- **MetaMask**: Required wallet provider for user interactions
- **Ethers.js**: Ethereum library for smart contract interactions and wallet connectivity

### Development and UI Libraries
- **React**: Core frontend framework with hooks and context
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless component primitives for accessibility
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library for type safety

### Database and ORM
- **Drizzle ORM**: SQL toolkit and ORM configured for PostgreSQL
- **PostgreSQL**: Database for auxiliary data (though primary data lives on blockchain)
- **Neon Database**: Serverless PostgreSQL provider for cloud deployment

### Additional Services
- **TanStack Query**: Server state management and caching
- **React Router (wouter)**: Lightweight routing solution
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Utility for managing component variants

The architecture prioritizes security through blockchain immutability, transparency through on-chain data storage, and user experience through modern React patterns and responsive design.