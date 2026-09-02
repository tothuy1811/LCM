"use client";

import { createContext, useContext, useEffect, useRef } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { type StoreApi, useStore } from "zustand";

import { auth } from "@/lib/firebase/client";

import { AuthState, AuthUser, createAuthStore } from "./auth-store";

const AuthStoreContext = createContext<StoreApi<AuthState> | null>(null);

export const AuthStoreProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: AuthUser;
}) => {
  const storeRef = useRef<StoreApi<AuthState> | null>(null);

  storeRef.current ??= createAuthStore({ user: initialUser });

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    return onAuthStateChanged(auth, firebaseUser => {
      store
        .getState()
        .setUser(
          firebaseUser
            ? { uid: firebaseUser.uid, email: firebaseUser.email }
            : null
        );
    });
  }, []);

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
};

export const useAuthStore = <T,>(selector: (state: AuthState) => T): T => {
  const store = useContext(AuthStoreContext);
  if (!store) throw new Error("Missing AuthStoreProvider");
  return useStore(store, selector);
};
