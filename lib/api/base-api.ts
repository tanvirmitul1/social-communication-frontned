import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';
import { storage } from '@/lib/utils/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import { clearAuth } from '@/lib/store/slices/auth.slice';

interface RefreshResponse {
  success: boolean;
  data?: { accessToken: string; refreshToken?: string };
}

function cleanToken(token: string | null): string | null {
  if (!token) return null;
  if (token.startsWith('"') && token.endsWith('"')) return token.slice(1, -1);
  return token;
}

function forceLogout(api: any) {
  storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  storage.remove(STORAGE_KEYS.USER);
  api.dispatch(clearAuth());
  if (typeof window !== 'undefined') window.location.href = '/login';
}

const baseQuery = fetchBaseQuery({
  baseUrl: env.api.baseUrl,
  prepareHeaders: (headers) => {
    const token = cleanToken(storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN));
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // Do NOT set Content-Type here — let browser set it for FormData
    return headers;
  },
});

const MAX_REFRESH_ATTEMPTS = 2;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);
  if (!result.error || result.error.status !== 401) return result;

  // Try refresh up to MAX_REFRESH_ATTEMPTS times
  for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt++) {
    const refreshToken = cleanToken(storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN));
    if (!refreshToken) { forceLogout(api); return result; }

    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
      api,
      extraOptions
    );

    const data = refreshResult.data as RefreshResponse | undefined;
    if (data?.success && data.data?.accessToken) {
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken);
      if (data.data.refreshToken) storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);

      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
      if (!result.error || result.error.status !== 401) return result;
      // Still 401 — loop and try refresh again
    } else {
      // Refresh itself failed
      break;
    }
  }

  // All attempts exhausted
  forceLogout(api);
  return result;
};

export const baseApiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Message', 'Conversation', 'Group', 'Call', 'Post', 'Comment', 'FriendRequest', 'Friend'],
  endpoints: () => ({}),
});