/**
 * Centralized API services export
 */

import { authService } from "./auth.service";
import { messagesService } from "./messages.service";
import { usersService } from "./users.service";
import { groupsService } from "./groups.service";
import { callsService } from "./calls.service";

export { apiClient } from "./client";
export { authService } from "./auth.service";
export { messagesService } from "./messages.service";
export { usersService } from "./users.service";
export { groupsService } from "./groups.service";
export { callsService } from "./calls.service";

// Re-export for convenience
export const api = {
  auth: authService,
  messages: messagesService,
  users: usersService,
  groups: groupsService,
  calls: callsService,
} as const;
