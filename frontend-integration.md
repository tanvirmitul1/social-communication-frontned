# Frontend Integration Guide

Complete reference for integrating with the Social Communication API.

## Quick Links

| Resource | URL |
|---|---|
| Interactive Swagger Docs | `http://localhost:3000/api/docs` |
| OpenAPI JSON spec | `http://localhost:3000/api/docs/json` (or `/api-docs.json`) |
| Base API URL | `http://localhost:3000/api/v1` |
| WebSocket URL | `http://localhost:3000` |
| Health check | `http://localhost:3000/health` |

> **Swagger** covers every REST endpoint with full request/response schemas. This document fills in what Swagger can't — WebSocket events, auth flows, and multi-step workflows.

---

## 1. Authentication

### Standard login flow

```
POST /api/v1/auth/register        → create account
POST /api/v1/auth/login           → get tokens (or 2FA challenge)
POST /api/v1/auth/refresh         → exchange refresh token for new access token
POST /api/v1/auth/logout          → revoke current device
POST /api/v1/auth/logout-all      → revoke all devices
GET  /api/v1/auth/me              → get current user profile
```

### Sending the access token

Include the access token in every protected request:

```
Authorization: Bearer <accessToken>
```

### Token storage recommendation

- **Access token** — memory only (never localStorage; short-lived at 15 min)
- **Refresh token** — `httpOnly` cookie or secure storage

### Refresh flow

When a request returns `401`, call `POST /api/v1/auth/refresh` with `{ refreshToken }`.
On success, update your stored tokens and retry the original request.

### 2FA flow (if user has 2FA enabled)

```
1. POST /api/v1/auth/login
   → Response: { requiresTwoFactor: true, twoFactorToken: "..." }

2. POST /api/v1/auth/2fa/verify
   Body: { twoFactorToken, token: "123456" }   ← token from authenticator app
   → Response: { user, accessToken, refreshToken }
```

### 2FA setup flow (for enabling 2FA on an account)

```
1. POST /api/v1/auth/2fa/setup
   → Response: { secret, qrCodeDataUrl, manualEntryKey }
   ← Show qrCodeDataUrl as <img> for user to scan

2. POST /api/v1/auth/2fa/enable
   Body: { token: "123456" }   ← first code from authenticator app
   → Response: 200 OK — 2FA is now active

3. To disable later:
   POST /api/v1/auth/2fa/disable
   Body: { password, token: "123456" }
```

---

## 2. WebSocket Connection (Socket.IO)

### Connect with authentication

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken },
  // Alternative: pass in headers
  // extraHeaders: { Authorization: `Bearer ${accessToken}` }
  transports: ['websocket'],
});

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('connect_error', (err) => console.error('Auth failed:', err.message));
```

On connection the server:
- Validates the JWT — rejects if invalid/missing
- Updates user online status
- Auto-joins the user to their personal room `user:<userId>`

### Room management

| Room | When to join | How |
|---|---|---|
| `user:<userId>` | Auto on connect | Server-side |
| `group:<groupId>` | When opening a group chat | See below |

To join a group chat room (required to receive group messages in real-time):

```javascript
// You must call this before sending/receiving group messages
socket.emit('join:group', { groupId });   // if implemented
// OR — just open the group's message stream via REST, the backend joins on demand
```

> Currently the server joins users to group rooms when they call `join:group` (if wired) or when they connect if they are members. Check if `ChatSocketHandler.joinGroupRoom()` is exposed — if not, group messages are received via the personal `user:<userId>` room for the recipient.

---

## 3. WebSocket Events Reference

### Events you EMIT (client → server)

#### Messaging

| Event | Payload | Description |
|---|---|---|
| `message:send` | `{ content, type, groupId?, receiverId?, parentId?, metadata? }` | Send a message |
| `message:edit` | `{ messageId, content }` | Edit a message you sent |
| `message:delete` | `{ messageId }` | Delete a message you sent |

`type` values: `TEXT`, `IMAGE`, `VIDEO`, `FILE`, `AUDIO`

`metadata` — for media messages attach Cloudinary data:
```json
{
  "url": "https://res.cloudinary.com/...",
  "thumbnail": "https://res.cloudinary.com/...",
  "fileName": "photo.jpg",
  "mimeType": "image/webp",
  "size": 204800,
  "width": 1920,
  "height": 1080
}
```

#### Typing indicators

| Event | Payload | Description |
|---|---|---|
| `typing:start` | `{ groupId? } or { receiverId? }` | User started typing |
| `typing:stop` | `{ groupId? } or { receiverId? }` | User stopped typing |

Emit `typing:stop` after ~2 seconds of inactivity. Auto-expires on server in 10s anyway.

#### Calls

| Event | Payload | Description |
|---|---|---|
| `call:initiate` | `{ type, participantIds: string[], groupId? }` | Start a call |
| `call:answer` | `{ callId }` | Accept an incoming call |
| `call:reject` | `{ callId }` | Decline an incoming call |
| `call:end` | `{ callId }` | End the call (all participants) |
| `call:participant:leave` | `{ callId }` | Leave but keep call going for others |

`type` values: `AUDIO`, `VIDEO`

---

### Events you LISTEN to (server → client)

#### Messaging

| Event | Payload | When fired |
|---|---|---|
| `message:received` | `Message` object | Someone sent a message to your group or DM |
| `message:sent` | `Message` object | Your DM was delivered (confirmation) |
| `message:edit` | `Message` object | A message in your conversation was edited |
| `message:delete` | `{ messageId }` | A message was deleted |

#### Typing

| Event | Payload | When fired |
|---|---|---|
| `typing:start` | `{ userId, groupId? }` | Someone started typing |
| `typing:stop` | `{ userId, groupId? }` | Someone stopped typing |

#### Calls

| Event | Payload | When fired |
|---|---|---|
| `call:ringing` | `{ call, initiatorId }` | Incoming call — show incoming call UI |
| `call:initiate` | `{ call, roomUrl, token }` | Your call was created — join the Jitsi room |
| `call:answer` | `{ call, roomUrl, token }` | Your call was accepted — join the Jitsi room |
| `call:reject` | `{ callId, userId }` | Your call was rejected by `userId` |
| `call:end` | `{ callId }` | Call ended — close Jitsi UI |
| `call:participant:join` | `{ callId, userId }` | Another participant joined |
| `call:participant:leave` | `{ callId, userId }` | A participant left |

#### Presence

| Event | Payload | When fired |
|---|---|---|
| `user:online` | `{ userId }` | A user came online |
| `user:offline` | `{ userId }` | A user disconnected |

#### Notifications

| Event | Payload | When fired |
|---|---|---|
| `notification:new` | `Notification` object | Real-time push for any new notification |

#### Errors

| Event | Payload | When fired |
|---|---|---|
| `error` | `{ message: string }` | Server-side error during event handling |

Always attach a listener: `socket.on('error', handler)`.

---

## 4. Video/Audio Call Flow (Jitsi)

```
1. Caller emits:   call:initiate  { type: "VIDEO", participantIds: ["uuid-2"] }
   Caller receives: call:initiate  { call, roomUrl, token }
                   → Open Jitsi at roomUrl with token

2. Callee receives: call:ringing   { call, initiatorId }
                   → Show incoming call UI

3. Callee emits:   call:answer    { callId }
   Callee receives: call:answer    { call, roomUrl, token }
                   → Open Jitsi at roomUrl with token

4. Either party emits: call:end   { callId }
   All participants receive: call:end { callId }
   → Close Jitsi, return to previous screen
```

### Jitsi integration

Use the `roomUrl` + `token` from the socket event to embed Jitsi:

```html
<!-- In web -->
<iframe src="<roomUrl>?jwt=<token>" allow="camera; microphone" />
```

Or use the [Jitsi Meet SDK](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe) for more control.

---

## 5. Media Upload Flow (Two-Step)

**Never pass file data directly in post/message bodies.** Upload first, then reference the URL.

### Step 1 — Upload the file

```
POST /api/v1/upload/image   (JPEG, PNG, GIF, WebP — max 10 MB)
POST /api/v1/upload/video   (MP4, WebM, MOV, AVI — max 50 MB)
POST /api/v1/upload/file    (PDF, DOC, ZIP, etc. — max 25 MB)
POST /api/v1/upload/avatar  (image — auto-cropped 500×500, face-gravity)

Content-Type: multipart/form-data
Field name: "file"
```

Response:
```json
{
  "success": true,
  "data": {
    "publicId": "posts/xyz123",
    "secureUrl": "https://res.cloudinary.com/...",
    "width": 1920,
    "height": 1080,
    "format": "webp",
    "bytes": 204800,
    "thumbnailUrl": "https://res.cloudinary.com/.../w_320,h_320/...",
    "resourceType": "image"
  }
}
```

### Step 2a — Create a post with media

```json
POST /api/v1/posts
{
  "content": "Check this out!",
  "media": [
    {
      "type": "IMAGE",
      "url": "<secureUrl>",
      "thumbnail": "<thumbnailUrl>",
      "width": 1920,
      "height": 1080,
      "size": 204800
    }
  ]
}
```

### Step 2b — Send a message with media (via Socket.IO)

```javascript
socket.emit('message:send', {
  receiverId: 'user-uuid',
  type: 'IMAGE',
  content: '',   // optional caption
  metadata: {
    url: secureUrl,
    thumbnail: thumbnailUrl,
    mimeType: 'image/webp',
    size: 204800,
    width: 1920,
    height: 1080,
  }
});
```

### Avatar update

```
1. POST /api/v1/upload/avatar → { secureUrl }
2. PATCH /api/v1/users/:id   → { avatar: secureUrl }
```

---

## 6. Notifications

### REST endpoints

```
GET    /api/v1/notifications                    → paginated list (cursor-based)
GET    /api/v1/notifications/unread-count       → { count: number }
PATCH  /api/v1/notifications/:id/read          → mark one as read
PATCH  /api/v1/notifications/read              → mark specific IDs as read
PATCH  /api/v1/notifications/read-all          → mark all as read
DELETE /api/v1/notifications/:id               → delete one
DELETE /api/v1/notifications                   → delete all
```

### Real-time

Listen for `notification:new` on the socket — fires immediately when a notification is created server-side. Update unread count badge and prepend to the list.

### Mobile push (Firebase FCM)

Register device token after login:

```
POST /api/v1/notifications/device-token
Body: { token: "<FCM device token>", platform: "ios" | "android" | "web" }
```

Deregister on logout:

```
DELETE /api/v1/notifications/device-token
Body: { token: "<FCM device token>" }
```

---

## 7. Friend System

```
GET    /api/v1/friends                              → list friends
GET    /api/v1/users/friend-requests                → incoming + outgoing requests
POST   /api/v1/users/friend-requests                → send request { userId }
POST   /api/v1/users/friend-requests/:id/accept    → accept request
POST   /api/v1/users/friend-requests/:id/reject    → reject request
DELETE /api/v1/friends/:friendId                   → remove friend
```

---

## 8. Block System

```
GET    /api/v1/users/blocks                    → list users you blocked (cursor paginated)
POST   /api/v1/users/blocks                    → block a user { userId, reason? }
DELETE /api/v1/users/blocks/:userId            → unblock a user
GET    /api/v1/users/blocks/:userId/status     → { isBlocked: boolean } (bidirectional check)
```

Blocked users cannot message you and won't appear in suggestions. Check `isBlocked` before rendering chat or call UI.

---

## 9. User Settings

```
GET   /api/v1/users/settings    → get settings (auto-created with defaults on first access)
PATCH /api/v1/users/settings    → partial update (only send fields you want to change)
```

Settings fields:
```json
{
  "notifyMessages": true,
  "notifyMentions": true,
  "notifyReactions": true,
  "notifyFriendRequests": true,
  "notifyCalls": true,
  "showOnlineStatus": true,
  "allowFriendRequests": true,
  "theme": "light | dark | system",
  "language": "en"
}
```

---

## 10. Posts & Feed

```
GET    /api/v1/posts/feed                    → cursor-paginated timeline feed
POST   /api/v1/posts                         → create post { content, visibility, media[] }
GET    /api/v1/posts/:id                     → get single post
PATCH  /api/v1/posts/:id                     → edit post
DELETE /api/v1/posts/:id                     → delete post
POST   /api/v1/posts/:id/react               → react { type: "LIKE" | "LOVE" | ... }
DELETE /api/v1/posts/:id/react               → remove reaction
GET    /api/v1/posts/:id/reactions           → list reactions
GET    /api/v1/users/:userId/posts           → user's posts
```

`visibility` values: `PUBLIC`, `FRIENDS`, `PRIVATE`

---

## 11. Messages

### REST (for loading history)

```
GET  /api/v1/messages/chats                    → list all conversations
GET  /api/v1/messages/group/:groupId           → group message history (cursor paginated)
GET  /api/v1/messages/direct/:otherUserId      → DM history (cursor paginated)
GET  /api/v1/messages/group/:groupId/pinned    → pinned messages in group
GET  /api/v1/messages/direct/:otherUserId/pinned → pinned messages in DM
GET  /api/v1/messages/search                   → search messages
POST /api/v1/messages/:id/pin                  → pin a message
DELETE /api/v1/messages/:id/pin                → unpin
POST /api/v1/messages/:id/react                → react to message
DELETE /api/v1/messages/:id/react              → remove reaction
POST /api/v1/messages/:id/forward              → forward to another conversation
POST /api/v1/messages/:id/delivered            → mark as delivered
POST /api/v1/messages/:id/seen                 → mark as seen
```

### Send (use WebSocket for real-time, REST as fallback)

For real-time sending always prefer `socket.emit('message:send', ...)`.
REST `POST /api/v1/messages` can be used as a fallback when the socket is disconnected.

---

## 12. Groups

```
POST   /api/v1/groups                          → create group { name, description?, memberIds[] }
GET    /api/v1/groups                          → list my groups
GET    /api/v1/groups/:id                      → get group details
PATCH  /api/v1/groups/:id                      → update group (admin+)
DELETE /api/v1/groups/:id                      → delete group (owner only)
POST   /api/v1/groups/:id/members              → add member
DELETE /api/v1/groups/:id/members/:userId      → remove member
PATCH  /api/v1/groups/:id/members/:userId/role → change role { role: "ADMIN" | "MEMBER" }
POST   /api/v1/groups/:id/leave                → leave group
GET    /api/v1/groups/:id/members              → list members
```

---

## 13. AI Agent

```
POST /api/v1/ai-agent/chat          → { message } — streaming or one-shot response
GET  /api/v1/ai-agent/history       → conversation history
DELETE /api/v1/ai-agent/history     → clear history
```

The endpoint streams responses using SSE (Server-Sent Events). Use `EventSource` or `fetch` with streaming:

```javascript
const res = await fetch('/api/v1/ai-agent/chat', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' }),
});

const reader = res.body.getReader();
// read chunks...
```

---

## 14. Standard Response Shape

All REST endpoints return:

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

Paginated responses (cursor-based):

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "nextCursor": "uuid-of-last-item | null",
    "hasMore": true
  }
}
```

Pass `?cursor=<nextCursor>&limit=20` for the next page.

Error response:

```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "ERROR_CODE",
  "errors": [ ... ]   // only on validation errors (400)
}
```

Common HTTP codes:

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation error — check `errors[]` |
| 401 | Missing or expired token — refresh |
| 403 | Forbidden — not enough permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already exists) |
| 429 | Rate limited — back off and retry |

---

## 15. Rate Limits

| Route group | Limit |
|---|---|
| Global API | 100 req / 15 min per IP |
| Auth (login/register) | Strict (configured in auth routes) |
| Messages | Standard messaging limiter |
| Uploads | 20 uploads / min per IP |
| Notifications (read/write) | 60 req / min per IP |
| Block actions | 30 req / min per IP |

On `429`, the response includes a `Retry-After` header.

---

## 16. Features Not Yet Implemented (Backend Gaps)

These are known gaps — the frontend can plan ahead but the backend API doesn't exist yet:

| Feature | Status | Notes |
|---|---|---|
| Message attachment table | Missing | Messages use unstructured `metadata` JSON instead of a `MessageAttachment` table like posts have `PostMedia`. A proper migration is needed. |
| Group join room via socket | Partial | `joinGroupRoom()` helper exists but may not be exposed as a socket event. Confirm with backend. |
| Read receipts push | Partial | `message:delivered` and `message:seen` exist as REST but not as real-time socket events to the sender. |

---

## 17. Checklist for Frontend

- [ ] Auth: register, login, token refresh, logout
- [ ] 2FA: setup (QR code), enable, disable, verify on login
- [ ] Socket.IO connection with JWT, reconnect logic
- [ ] Direct messaging: load history (REST) + real-time send/receive (Socket)
- [ ] Group chat: load history (REST) + real-time send/receive (Socket)
- [ ] Typing indicators
- [ ] Message reactions (REST + optimistic UI)
- [ ] Message pinning (REST)
- [ ] Message forwarding (REST)
- [ ] File/image/video upload → attach URL to post or message
- [ ] Avatar upload
- [ ] User profile: view, edit, presence indicator
- [ ] Friend requests: send, accept, reject, list
- [ ] Block/unblock: block check before opening chat
- [ ] Groups: create, invite, role management, leave
- [ ] Posts & feed: create with media, react, comment
- [ ] Notifications: badge count, list, real-time push, mark read
- [ ] User settings: theme, language, notification toggles
- [ ] Video/audio calls: initiate, ring UI, answer, reject, in-call (Jitsi), end
- [ ] AI chat with streaming response
- [ ] 429 handling: back off + retry
- [ ] 401 handling: auto-refresh then retry original request
