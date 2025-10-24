# Design Guidelines: Ephemeral Chat Application

## Design Approach

**Selected Approach:** Reference-Based (Messaging/Chat Applications)  
**Primary Inspiration:** Discord, Telegram Web, WhatsApp Web  
**Justification:** Chat applications require familiar, intuitive patterns that users understand instantly. Drawing from established messaging platforms ensures optimal usability while maintaining visual polish.

## Core Design Elements

### Typography System
- **Primary Font:** Inter or Geist (Google Fonts CDN)
- **Heading Scale:** text-2xl (room codes), text-xl (section headers), text-lg (chat usernames)
- **Body Text:** text-base for messages, text-sm for timestamps and metadata
- **Code Display:** font-mono text-3xl font-bold tracking-wider for room codes
- **Font Weights:** font-semibold for emphasis, font-medium for labels, font-normal for body

### Layout & Spacing System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, py-8)

**Application Structure:**
- Full-height viewport layout (h-screen)
- Three distinct view states: Landing, Waiting Room, Active Chat
- Consistent container: max-w-6xl mx-auto with px-6 padding
- Section spacing: py-12 for vertical rhythm

### Component Library

#### Landing View
**Hero Section:**
- Centered layout with max-w-2xl container
- Large heading (text-4xl to text-5xl) explaining the concept
- Subheading (text-xl) with key value proposition: "No logins. No history. Just chat."
- Two primary action buttons in vertical stack (gap-4)
- Each button: py-4 px-8 text-lg rounded-xl w-full max-w-sm
- Feature highlights below in 3-column grid (grid-cols-3 gap-6)
- Icons from Heroicons CDN
- Each feature: icon (h-8 w-8), heading (text-lg font-semibold), description (text-sm)

#### Room Creation View
**Code Display Panel:**
- Centered card layout (max-w-md)
- Prominent code display: p-8 rounded-2xl border-2
- Sequential code in monospace font (text-4xl md:text-5xl tracking-widest)
- Copy button with icon positioned adjacent to code
- Instruction text below (text-base): "Share this code with your chat partner"
- Status indicator: "Waiting for partner to join..." with animated pulse dot
- Cancel/Back button (text-sm) at bottom

#### Room Join View
**Code Entry Form:**
- Centered card (max-w-md)
- Large input field for code entry:
  - py-6 px-6 text-center
  - text-3xl font-mono tracking-widest uppercase
  - rounded-xl border-2
  - Max length indicator (e.g., "4-digit code")
- Join button below input (w-full py-4 rounded-xl text-lg)
- Error state for invalid codes (text-sm below input)
- Back to home link (text-sm) at bottom

#### Active Chat Interface
**Layout Structure:**
- Fixed header (h-16): Room code display, connection status, leave button
- Chat messages area: flex-1 overflow-y-auto with p-6
- Fixed footer (h-20): Message input and send controls

**Header:**
- flex justify-between items-center px-6
- Room code display: font-mono text-lg
- Status badge: "Connected" with dot indicator
- Leave button: icon only, h-10 w-10 rounded-lg

**Messages Container:**
- Scrollable area with custom scrollbar styling
- Messages aligned: self messages to right, partner messages to left
- Message spacing: space-y-4
- Auto-scroll to latest message

**Message Bubbles:**
- Max width: max-w-md (70% of container)
- Padding: px-4 py-3
- Border radius: rounded-2xl (asymmetric corners for chat bubble effect)
- Self messages: rounded-br-sm
- Partner messages: rounded-bl-sm
- Timestamp: text-xs below bubble with gap-1
- Image messages: rounded-xl max-h-96 object-cover

**Message Input Area:**
- flex gap-3 items-end px-6 py-4
- Text input: flex-1 px-4 py-3 rounded-xl resize-none max-h-32
- Image upload button: h-10 w-10 rounded-lg (paperclip icon)
- Send button: h-10 w-10 rounded-lg (paper plane icon)
- File size indicator when image selected: text-xs

**Image Preview Modal:**
- Full overlay with backdrop blur
- Centered image display: max-h-[80vh] max-w-[80vw]
- Close button: absolute top-4 right-4 h-10 w-10
- Download option below image

#### Empty States
**No Messages Yet:**
- Centered content in chat area
- Large icon (h-16 w-16)
- Heading: "Start the conversation"
- Subtext: "Messages are not stored and will disappear when you leave"

### Interaction Patterns

**Button States:**
- All buttons implement consistent hover/active states
- Disabled state for form validation
- Loading states with spinner icons

**Real-time Indicators:**
- Typing indicator: "Partner is typing..." with animated dots (text-sm)
- Connection status: persistent header badge
- Message delivery: checkmark icon next to sent messages

**Form Validation:**
- Real-time code validation as user types
- Clear error messaging below inputs
- Disabled submit states until valid

**Responsive Behavior:**
- Mobile: Single column, full-width components
- Tablet/Desktop: Centered containers with max-width constraints
- Chat bubbles scale proportionally (65% width on mobile, 70% on desktop)

### Accessibility Implementation
- Semantic HTML throughout (header, main, section, article for messages)
- ARIA labels for icon-only buttons
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Keyboard navigation: Enter to send, Escape to close modals
- Screen reader announcements for new messages
- High contrast text hierarchy

### Icons
**Library:** Heroicons (via CDN)  
**Usage:**
- Navigation: Home, X (close), ArrowLeft (back)
- Actions: Copy, PaperAirplane (send), PaperClip (attach), Download
- Status: Check (delivered), CheckDouble (read), Circle (typing)
- Features: LockClosed (privacy), Clock (ephemeral), Bolt (fast)

### Animation Guidelines
**Minimal, purposeful animations only:**
- Message bubble entrance: slide up with fade (200ms ease-out)
- Typing indicator: dot pulse animation
- Code copy confirmation: brief scale feedback
- Hover states: subtle transforms (scale-105) with 150ms transition
- No background animations or decorative motion

### Images
**Hero Section Image:** Large, modern illustration or photo representing secure, ephemeral communication - positioned as split layout with text on left, image on right (50/50 split on desktop, stacked on mobile). Image should convey privacy, simplicity, and real-time connection.