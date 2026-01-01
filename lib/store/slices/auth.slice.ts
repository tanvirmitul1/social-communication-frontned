import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authApiSlice } from "@/lib/api";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import type { User, LoginPayload, RegisterPayload, ApiError, AuthResponse } from "@/types";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: storage.get<User>(STORAGE_KEYS.USER),
  isAuthenticated: !!storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,
  error: null,
  accessToken: storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginPayload, { dispatch, rejectWithValue }) => {
    try {
      // Use the RTK Query API directly
      const result = await dispatch(authApiSlice.endpoints.login.initiate(credentials));
      
      if ('data' in result) {
        const response = result.data as AuthResponse;
        
        // Store tokens and user info
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        storage.set(STORAGE_KEYS.USER, response.user);
        
        return response;
      } else {
        // Handle error case
        const errorPayload = JSON.parse(result.error as string);
        return rejectWithValue(errorPayload.message || "Login failed");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiError;
        return rejectWithValue(apiError.message || "Login failed");
      }
      return rejectWithValue((error as { message: string })?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterPayload, { dispatch, rejectWithValue }) => {
    try {
      // Use the RTK Query API directly
      const result = await dispatch(authApiSlice.endpoints.register.initiate(userData));
      
      if ('data' in result) {
        const response = result.data as AuthResponse;
        
        // Store tokens and user info
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        storage.set(STORAGE_KEYS.USER, response.user);
        
        return response;
      } else {
        // Handle error case
        const errorPayload = JSON.parse(result.error as string);
        return rejectWithValue(errorPayload.message || "Registration failed");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiError;
        return rejectWithValue(apiError.message || "Registration failed");
      }
      return rejectWithValue((error as { message: string })?.message || "Registration failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  
  if (refreshToken) {
    try {
      await dispatch(authApiSlice.endpoints.logout.initiate(refreshToken));
    } catch (error) {
      console.error("Logout API error:", error);
    }
  }
  
  // Clear local storage
  storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  storage.remove(STORAGE_KEYS.USER);
  
  // Invalidate all API queries
  dispatch(authApiSlice.util.invalidateTags(['Auth', 'User', 'Message', 'Conversation', 'Group', 'Call']));
});

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Use the RTK Query API directly
      const result = await dispatch(authApiSlice.endpoints.getCurrentUser.initiate(undefined));
      
      if ('data' in result) {
        const response = result.data as User;
        
        // Update stored user
        storage.set(STORAGE_KEYS.USER, response);
        
        return response;
      } else {
        // Handle error case
        const errorPayload = JSON.parse(result.error as string);
        return rejectWithValue(errorPayload.message || "Failed to get user");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const apiError = error.response.data as ApiError;
        return rejectWithValue(apiError.message || "Failed to get user");
      }
      return rejectWithValue((error as { message: string })?.message || "Failed to get user");
    }
  }
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
    });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        // Only update user info, tokens remain the same
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;