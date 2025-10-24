# Ephemeral Chat Application

## Overview

This is an ephemeral, privacy-focused chat application that enables temporary two-person conversations using room codes. The application emphasizes simplicity and privacy with no user authentication, no message persistence, and instant room disposal when users disconnect. Users can either create a room (receiving a unique code) or join an existing room by entering a code, then exchange text messages and images in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React with TypeScript as the primary UI framework
- Vite as the build tool and development server
- Wouter for lightweight client-side routing (no React Router)
- TanStack Query for data fetching and state management

**UI Component System**
- shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for styling with custom design tokens
- CSS variables for theming support (light/dark modes)

**Design System**
- Typography: Inter/Geist fonts from Google Fonts CDN
- Spacing: Tailwind scale (2, 4, 6, 8 units)
- Color system: HSL-based with CSS custom properties for theme flexibility
- Component variants: Implements reference-based design inspired by Discord/Telegram/WhatsApp

**Application Views**
- Landing Page: Feature showcase with create/join room options
- Room Creation: Displays generated room code with copy functionality and wait state
- Chat Room: Real-time messaging interface with text and image support

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and middleware
- WebSocket server (ws library) for real-time bidirectional communication
- Session-based architecture without persistent authentication

**Real-Time Communication**
- WebSocket connection on `/ws` endpoint
- Message types: `create_room`, `join_room`, `send_message`, `room_created`, `room_joined`, `new_message`, `user_joined`, `user_left`, `error`
- Client-to-server and server-to-client event handling
- Connection state management with client ID mapping

**Data Storage Strategy**
- In-memory storage implementation (`MemStorage` class)
- No database persistence - all data is ephemeral
- Room lifecycle: Created on demand, destroyed when empty
- Message storage: Temporary, per-room message arrays
- Sequential room code generation starting from 1000

**Storage Interface Design**
The application uses an `IStorage` interface to abstract storage operations, making it possible to swap implementations. Current implementation is memory-based, but the interface supports future database integration if needed:
- Room management: create, get, delete rooms
- User tracking: add/remove users from rooms, map users to rooms
- Message handling: add and retrieve messages by room code

### External Dependencies

**Database & ORM**
- Drizzle ORM configured for PostgreSQL (via drizzle-kit)
- Neon Database serverless driver (@neondatabase/serverless)
- Schema defined in `shared/schema.ts`
- Note: Database configuration exists but storage currently uses in-memory implementation

**UI Libraries**
- Radix UI component primitives (20+ component packages for dialogs, dropdowns, tooltips, etc.)
- class-variance-authority for component variant management
- clsx and tailwind-merge for conditional className composition
- Lucide React for icon components

**Form Handling & Validation**
- React Hook Form with @hookform/resolvers
- Zod for schema validation
- drizzle-zod for type-safe schema integration

**Additional Frontend Libraries**
- date-fns for date manipulation
- cmdk for command palette functionality
- embla-carousel-react for carousel components
- Recharts for data visualization components

**Development Tools**
- tsx for TypeScript execution in development
- esbuild for production server bundling
- Replit-specific plugins for development environment integration

**Third-Party Services**
- Google Fonts CDN for typography (Architects Daughter, DM Sans, Fira Code, Geist Mono)
- WebSocket protocol for real-time communication (no external service dependency)

**Image Handling**
- Client-side image encoding to base64
- Maximum image size: 8MB
- Image preview and full-screen view capabilities
- Download functionality for received images