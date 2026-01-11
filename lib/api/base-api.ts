import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';
import { storage } from '@/lib/utils/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// Define types for refresh response
interface RefreshResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken?: string;
  };
}

// Base query with authentication headers
const baseQuery = fetchBaseQuery({
  baseUrl: env.api.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    let token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    
    // Clean up the token if it has extra quotes
    if (token && typeof token === 'string') {
      // Remove surrounding quotes if present
      if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
        token = token.substring(1, token.length - 1);
      }
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Custom base query with refresh token logic
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401 error, try to refresh the token
  if (result.error && result.error.status === 401) {
    const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (refreshToken) {
      // Try to refresh the access token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );
      
      const refreshData = refreshResult.data as RefreshResponse | undefined;
      if (refreshData && refreshData.success && refreshData.data) {
        // Token refresh successful, update storage and retry original request
        const { accessToken, refreshToken: newRefreshToken } = refreshData.data;
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        if (newRefreshToken) {
          storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        }
        
        // Retry the original request with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Token refresh failed, logout the user
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        
        // You might want to redirect to login page here
        // For now, we'll just return the original error
        console.error('Token refresh failed, logging out user');
      }
    } else {
      // No refresh token available, logout the user
      storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      storage.remove(STORAGE_KEYS.USER);
      
      console.error('No refresh token available, logging out user');
    }
  }
  
  return result;
};

// Define the base API slice
export const baseApiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'User', 
    'Message',
    'Conversation', 
    'Group',
    'Call',
    'Post',
    'Comment',
    'FriendRequest',
    'Friend'
  ],
  endpoints: () => ({}), // Empty endpoints - will be injected via injectEndpoints
});