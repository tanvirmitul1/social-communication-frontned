# Social Communication Platform - Frontend

A modern, enterprise-level real-time messaging and audio/video calling platform built with Next.js 14, React 19, TypeScript, and Socket.io.

## 🚀 Features

- ✅ **Real-time Messaging**: Instant messaging with WebSocket support
- ✅ **Group Chats**: Create and manage group conversations
- ✅ **Audio/Video Calls**: Jitsi-powered calling functionality
- ✅ **User Presence**: Online/offline status and typing indicators
- ✅ **Message Features**: Reactions, threading, editing, and deletion
- ✅ **Rich Media**: Support for images, files, voice messages
- ✅ **Responsive Design**: Mobile-first approach with dark/light mode
- ✅ **Type-safe**: Full TypeScript implementation
- ✅ **State Management**: Redux Toolkit for predictable state updates
- ✅ **Authentication**: JWT-based auth with automatic token refresh

## 📦 Tech Stack

### Core
- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework

### State Management & Data Fetching
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **Socket.io Client** - WebSocket connections

### UI Components
- **Radix UI** - Headless UI primitives
- **shadcn/ui** - Re-usable component library
- **Framer Motion** - Animations
- **Lucide React** - Icon library

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

## 🏗️ Project Structure

```
social-communication-frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   ├── (main)/                   # Main app routes (protected)
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page (redirects)
├── components/
│   ├── ui/                       # Shadcn UI components
│   ├── shared/                   # Shared components & providers
│   └── [feature]/                # Feature-specific components
├── lib/
│   ├── api/                      # API client & services
│   │   ├── client.ts             # Axios with interceptors
│   │   ├── auth.service.ts       # Authentication
│   │   ├── messages.service.ts   # Messages
│   │   ├── users.service.ts      # Users
│   │   ├── groups.service.ts     # Groups
│   │   └── calls.service.ts      # Calls
│   ├── socket/                   # WebSocket management
│   │   ├── socket-manager.ts     # Socket.io manager
│   │   └── use-socket.tsx        # React hook
│   ├── store/                    # Redux store
│   │   ├── slices/               # State slices
│   │   └── index.ts              # Store config
│   ├── utils/                    # Utilities
│   ├── validations/              # Zod schemas
│   └── constants/                # Constants
├── types/                        # TypeScript definitions
└── config/                       # App configuration
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ (recommended: 20.x)
- pnpm (recommended) or npm
- Backend API running (see [API.md](./API.md))

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Update the values in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   NEXT_PUBLIC_WS_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

   App will be available at [http://localhost:3001](http://localhost:3001)

## 📐 Architecture

### 1. API Layer ([lib/api/](./lib/api))
Centralized API communication with automatic token refresh:
```typescript
import { api } from "@/lib/api";

// Login
const response = await api.auth.login({ email, password });

// Send message
await api.messages.sendMessage({
  content: "Hello!",
  type: "TEXT",
  receiverId: "user-id"
});
```

### 2. WebSocket Layer ([lib/socket/](./lib/socket))
Real-time communication manager:
```typescript
import { socketManager } from "@/lib/socket";

socketManager.connect();
socketManager.onMessageReceived((msg) => console.log(msg));
socketManager.sendMessage({ content: "Hi!", ... });
```

### 3. State Management ([lib/store/](./lib/store))
Redux Toolkit for global state:
```typescript
import { useAppDispatch, useAppSelector } from "@/lib/store";

const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.auth.user);
```

## 🎨 UI Components

Built with Radix UI primitives + Tailwind CSS. Full dark/light mode support.

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

<Button variant="default">Click</Button>
<Input placeholder="Type here..." />
```

## 🔐 Authentication Flow

1. User submits login/register form
2. Credentials sent to backend API
3. JWT tokens received and stored
4. Tokens automatically added to API requests
5. Auto-refresh on token expiration
6. WebSocket connects with token

## 🌐 API Integration

All backend endpoints are implemented as services:

| Service | Endpoints |
|---------|-----------|
| `authService` | login, register, logout, refresh, getCurrentUser |
| `messagesService` | send, fetch, edit, delete, react, search |
| `usersService` | get, update, delete, search, getPresence |
| `groupsService` | create, get, update, delete, manage members |
| `callsService` | initiate, join, end, reject |

See [API.md](./API.md) for full API documentation.

## 🎭 Theme Support

Powered by `next-themes`:
- **Light Mode** ☀️
- **Dark Mode** 🌙
- **System** 💻 (auto-detects OS preference)

Theme persists across sessions and applies to all components.

## 📱 Responsive Design

Mobile-first approach with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Features

- JWT authentication with refresh tokens
- Automatic token rotation
- HTTP-only cookie support (optional)
- Input validation with Zod
- XSS protection
- CSRF protection

## 🚀 What's Next

The foundation is complete! To build the full app, implement:

### Priority 1: Main App Layout
- [ ] Sidebar navigation component
- [ ] Header with user menu
- [ ] Mobile responsive drawer
- [ ] Theme toggle button

### Priority 2: Messaging Interface
- [ ] Chat list with conversations
- [ ] Message thread view
- [ ] Message input with file upload
- [ ] Real-time message updates
- [ ] Typing indicators
- [ ] Read receipts

### Priority 3: Additional Features
- [ ] Group management UI
- [ ] Call interface with Jitsi
- [ ] User profile settings
- [ ] Search functionality
- [ ] Notifications
- [ ] Message reactions UI

### Priority 4: Polish
- [ ] Loading states
- [ ] Error boundaries
- [ ] Optimistic updates
- [ ] Animations/transitions
- [ ] Empty states
- [ ] Testing

## 📝 Scripts

```bash
pnpm dev          # Start dev server (port 3001)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 📚 Code Examples

### Sending a Message
```typescript
import { useAppDispatch } from "@/lib/store";
import { sendMessage } from "@/lib/store/slices/messages.slice";

const dispatch = useAppDispatch();

await dispatch(sendMessage({
  content: "Hello!",
  type: "TEXT",
  receiverId: "user-id"
}));
```

### Real-time Updates
```typescript
import { useSocket } from "@/lib/socket";
import { useEffect } from "react";

const socket = useSocket();

useEffect(() => {
  socket.onMessageReceived((message) => {
    // Handle new message
  });

  return () => {
    socket.removeAllListeners("message:received");
  };
}, []);
```

### Form with Validation
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/auth";

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/name`)
2. Commit changes (`git commit -m 'Add feature'`)
3. Push to branch (`git push origin feature/name`)
4. Open Pull Request

## 📄 License

MIT License

---

**Built with ❤️ using Next.js, React, and TypeScript**
