import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';
import { storage } from '@/lib/utils/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// Base query with authentication headers
export const baseQuery = fetchBaseQuery({
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

// Define the base API slice
export const baseApiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Auth',
    'User', 
    'Message',
    'Conversation', 
    'Group',
    'Call'
  ],
  endpoints: () => ({}), // Empty endpoints - will be injected via injectEndpoints
});