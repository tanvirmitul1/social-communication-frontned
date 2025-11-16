/**
 * UI slice - manages UI state
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  activeConversationId: string | null;
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  isMobileMenuOpen: boolean;
  activeCall: string | null;
}

const initialState: UIState = {
  activeConversationId: null,
  sidebarOpen: true,
  theme: "system",
  isMobileMenuOpen: false,
  activeCall: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setActiveCall: (state, action: PayloadAction<string | null>) => {
      state.activeCall = action.payload;
    },
  },
});

export const {
  setActiveConversation,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleMobileMenu,
  setActiveCall,
} = uiSlice.actions;
export default uiSlice.reducer;
