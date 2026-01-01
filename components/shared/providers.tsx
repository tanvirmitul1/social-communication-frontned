"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/lib/store";
import { ThemeProvider } from "./theme-provider";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";

// Ensure tokens are in localStorage when state is rehydrated
const onBeforeLift = () => {
  // This runs after rehydration is complete
  const state = store.getState();
  const { accessToken, refreshToken, user } = state.auth;

  if (accessToken) {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
  if (user) {
    storage.set(STORAGE_KEYS.USER, user);
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor} onBeforeLift={onBeforeLift}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
