import { baseApiSlice } from './base-api';
import { authEndpoints } from './endpoints/auth.endpoints';

// Extend the base API slice with auth endpoints
export const authApiSlice = baseApiSlice.injectEndpoints({
  endpoints: authEndpoints,
});

// Export the hooks directly
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApiSlice;