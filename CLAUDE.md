# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (port 3001)
npm run build     # Build for production (static export to /out)
npm run start     # Run production server
npm run lint      # Run ESLint with Next.js + Prettier config
```

No test runner script is configured in package.json, though `@testing-library/react` and Jest are available as dependencies.

---

## Architecture Overview

This is a **Next.js 16 App Router** application (React 19, TypeScript 5) for a real-time social communication platform. It produces a **static export** (`output: "export"` in `next.config.ts`) to the `/out` directory.

### Route Groups

```
app/
  (auth)/     # Public routes: /login, /register
  (main)/     # Protected routes: /feed, /messages
```

The `(main)/layout.tsx` guards routes by checking `isAuthenticated` from Redux and redirects to `/login`. It also initializes Socket.io event listeners.

### State Management

**Redux Toolkit** with **redux-persist** (auth slice is persisted to localStorage):
- `lib/store/slices/auth.slice.ts` — user data, JWT tokens (also mirrored to localStorage for immediate availability on reload)
- `lib/store/slices/messages.slice.ts` — local message state, typing indicators, optimistic updates
- `lib/store/slices/conversations.slice.ts` — chat metadata, unread counts
- `lib/store/slices/ui.slice.ts` — theme, modal states

### Data Fetching

**RTK Query** via feature-specific slices in `lib/api/`:
- `base-api.ts` — base query setup with auto token refresh (`baseQueryWithReauth`): intercepts 401s, calls `/auth/refresh`, retries original request, dispatches logout on failure
- Feature slices: `auth-api.ts`, `message-api.ts`, `user-api.ts`, `group-api.ts`, `call-api.ts`, `feed-api.slice.ts`, `friend-request-api.slice.ts`, `friends-api.slice.ts`
- All slices exported from `lib/api/index.ts`
- An Axios client (`lib/api/client.ts`) is also available for custom HTTP needs

Cache tags in use: `Auth`, `User`, `Message`, `Conversation`, `Group`, `Call`, `Post`, `Comment`, `FriendRequest`, `Friend`

### Real-Time / WebSocket

Socket.io managed via a singleton in `lib/socket/socket-manager.ts`:
- Auto-reconnects (up to 5 attempts), supports WebSocket + polling transports, token-based auth
- `lib/socket/use-socket.tsx` — hook to access socket instance in components
- `lib/socket/use-message-events.tsx` and `use-conversation-events.tsx` — decoupled event listeners that dispatch to Redux

### Key Libraries

| Purpose | Library |
|---|---|
| UI primitives | Shadcn/ui (Radix UI + Tailwind CSS 4) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Theming | next-themes (dark/light mode) |
| Video calls | Jitsi |
| HTTP | Axios |

### Type Definitions

Central types live in `types/index.ts` (User, Message, Group, Call, Conversation) and `types/feed.types.ts`. Environment variables are accessed via `config/env.ts`.

### Token Handling

Tokens are stored in both Redux state and localStorage. `base-api.ts` includes quote-stripping logic for malformed token strings. On 401, refresh is attempted automatically before failing and logging the user out.

---

## Project Rules

These rules must be followed in every change to keep the codebase consistent and scalable.

### Tailwind CSS

- This project uses **Tailwind CSS v4**. Always use the v4 canonical class names:
  - `bg-linear-to-{dir}` not `bg-gradient-to-{dir}`
  - `wrap-break-word` not `break-words`
  - `min-h-12` not `min-h-[48px]` (use scale values over arbitrary brackets wherever a scale value exists)
- Use **opacity modifiers** for tinted backgrounds: `bg-primary/10`, `bg-destructive/8`, `text-success/60` — do not write custom CSS for these.
- All semantic color tokens (`--success`, `--error`, `--warning`, `--info`, `--brand-*`) are registered in `@theme inline` inside `globals.css` and available as Tailwind utilities (`text-success`, `bg-success`, etc.). Do not redeclare them as custom CSS.
- Do not add arbitrary `[value]` classes when a Tailwind scale value exists.

### Styling Patterns

- **Glassmorphism**: use the `.glass` utility class (`backdrop-blur-24 bg-white/80 border border-white/8`) — do not inline the backdrop-filter properties.
- **Active states**: always use `bg-primary/10 text-primary` for the active/selected item in any list or navigation. Pair with a visible indicator (bottom border underline for tabs/navbar, `ChevronRight` icon for sidebar nav items).
- **Hover states**: `hover:bg-muted/50` for list rows; `hover:bg-muted/60` for icon buttons. Never use raw `hover:bg-gray-*` or `hover:bg-slate-*`.
- **Cards**: use `bg-card/80 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md` — not plain `bg-white` or `bg-card`.
- **Shadows**: prefer the design-system variables (`shadow-sm`, `shadow-md`, `shadow-lg`) — do not add arbitrary `drop-shadow-*` values.
- **Transitions**: use `transition-all duration-200` or `transition-colors duration-150` — never `transition-none` or durations above 300 ms for interactive elements.
- **Rounded corners**: follow the established radius scale — `rounded-lg` (cards/inputs), `rounded-xl` (list rows/popups), `rounded-2xl` (bubbles/modals), `rounded-full` (avatars/badges/pills).

### Component Patterns

- **Small helpers inside a file**: extract named sub-components (e.g. `NavButton`, `ActionButton`, `FriendRow`, `EmptyState`) at the bottom of the same file when they are only used there. Do not create separate files for single-use helpers.
- **Cross-feature shared components**: go in `components/shared/`. Feature-specific components stay in their feature folder (`components/feed/`, `components/messages/`, etc.).
- **Empty / error states**: always use the `EmptyState` pattern — centred icon in a `bg-muted` circle, title, optional subtitle, optional action button. Do not inline ad-hoc empty states.
- **Loading skeletons**: use `<Skeleton>` from `components/ui/skeleton`. Render a fixed count (e.g. `Array.from({ length: 5 })`) matching the real item height.
- **Avatars**: always render `<Avatar>` with both `<AvatarImage>` and `<AvatarFallback>`. Fallback uses `bg-linear-to-br from-primary/20 to-primary/10 text-primary font-semibold` and `getInitials()` from `lib/utils/format`.
- **Online indicator dot**: `absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background` on a `relative` Avatar wrapper. No `animate-pulse` — solid dot only.
- **Modals**: use Radix `<Dialog>` from `components/ui/dialog`. Apply the `.glass` class to `DialogContent`.
- **Dropdowns**: use `<DropdownMenu>` from `components/ui/dropdown-menu`. Apply `.glass` to `DropdownMenuContent`.
- **Toast notifications**: always use `toast.success()` / `toast.error()` from `sonner`. Do not use browser `alert()` except for destructive confirm dialogs.

### Forms

- Every form uses **React Hook Form** + **Zod** resolver. Validation schemas live in `lib/validations/`.
- Input fields that need icons use a `relative` wrapper with the icon `absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none` and `pl-10` on the `<Input>`.
- Error messages render as `<p className="text-destructive text-xs mt-1">`.
- The submit button must be `disabled={isLoading}` and show a `<Loader2 className="animate-spin" />` spinner inline when loading.
- Error banners use: `flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive` with an `<AlertCircle>` icon.

### Data & State

- **All server data** goes through **RTK Query**. Do not call `fetch` or `axios` directly in components — use the generated hooks from `lib/api/`.
- **New API endpoints**: add them to the relevant existing slice file (e.g. feed endpoints in `feed-api.slice.ts`). Only create a new slice file for an entirely new resource.
- **Local UI state** (open/closed, active tab, search query) stays in `useState` inside the component. Do not put ephemeral UI state into Redux.
- **Global UI state** (active conversation, theme, modal toggles needed across pages) goes into `lib/store/slices/ui.slice.ts`.
- **Optimistic updates**: use RTK Query's `onQueryStarted` with `updateQueryData` + rollback on error. Do not optimistically mutate Redux state manually.
- **Invalidation**: after a mutation always call `invalidatesTags` with the relevant cache tag. Use the existing tags — do not invent new ones unless adding a new resource type.

### WebSocket Rules

- All socket events are emitted and received through `socketManager` (`lib/socket/socket-manager.ts`). Do not create a second socket instance.
- Listen for events inside a dedicated hook in `lib/socket/` (e.g. `use-message-events.tsx`), not inside page components.
- Always clean up listeners in the `useEffect` return: `socketManager.removeAllListeners("event:name")`.
- Typing indicator: call `socketManager.startTyping()` / `socketManager.stopTyping()` with a 1-second debounce timeout.

### Animations

- Use **Framer Motion** (`motion.div`) for mount/unmount animations and list stagger. Use CSS `transition-*` utilities for hover/focus state changes.
- List stagger delay: `delay: Math.min(index * 0.06, 0.3)` — cap at 300 ms.
- Spring config for popups/modals: `{ type: "spring", damping: 25, stiffness: 300 }`.
- Respect `prefers-reduced-motion` — it is already handled globally in `globals.css` (`animation-duration: 0.01ms`); do not override it.

### Auth Pages Layout

- Both `/login` and `/register` use the **split-screen pattern**: left brand panel (`hidden lg:flex`, `bg-linear-to-br from-primary ... to-purple-800`, decorative orbs, logo, feature bullets) + right form panel (full width on mobile, `max-w-[400px]` centred).
- Any future auth pages (forgot-password, 2FA verify, etc.) must follow this same layout.

### Page Layout

- **Feed page** (`/feed`): three-column — left nav sidebar (`hidden 2xl:flex w-56`), centre feed (`max-w-2xl mx-auto`), right friends sidebar (`hidden lg:flex w-72`).
- **Messages page** (`/messages`): two-column — left conversations sidebar (`hidden md:flex w-80`) + right chat area (`flex-1`). On mobile the sidebar is a full-screen overlay.
- **Main layout height**: content areas use `h-[calc(100vh-64px)]` to account for the 64 px sticky navbar.
- Do not change the column count or breakpoints for these layouts without updating this file.

### Accessibility

- Every interactive element that has no visible text label must have `aria-label`.
- Icon-only buttons must be `size="icon"` from the Button component.
- Images that are decorative use `alt=""`. Images with meaningful content describe the content.
- Maintain the WCAG AAA contrast ratios already set up in `globals.css` — do not use muted-foreground text on muted backgrounds.

### Code Style

- **No default exports for components** — use named exports (`export function Foo`). Pages (`page.tsx`, `layout.tsx`) are the only files that use `export default`.
- **Import order**: React → Next.js → third-party → internal (`@/lib`, `@/components`, `@/types`). Keep the grouping consistent with the rest of the file.
- **`cn()` usage**: always merge classNames with `cn()` from `@/lib/utils`. Never concatenate class strings with template literals.
- **Remove unused imports** before committing. Do not leave `ScrollArea`, `Button`, or other components imported but unused.
- TypeScript: no `any` — use proper types from `types/index.ts` or `types/feed.types.ts`. If a type is missing, add it there rather than inlining `as unknown`.

### Git Commits

- Use **conventional commits**: `feat(scope):`, `fix(scope):`, `style(scope):`, `refactor(scope):`, `chore(scope):`.
- Scope maps to the feature area: `auth`, `feed`, `messages`, `navbar`, `post-card`, `friends`, `globals`, `api`, `socket`.
- Group related changes into a single commit (e.g. all auth page changes together). Do not mix unrelated files in one commit.
- Each commit message body explains *why* the change was made, not just *what* changed.
