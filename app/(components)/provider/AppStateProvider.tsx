"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface UserType {
  id: string;
  email: string;
  name: string;
  role: string;
  fullName: string;
  profileUrl: string;
  phone: string;
}

interface AppStateContextType {
  user: UserType | null;
  isChat: boolean;
  isSupport: boolean;
  isAdmin: boolean;
  isProfile: boolean;
  setIsChat: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSupport: React.Dispatch<React.SetStateAction<boolean>>;
  setIsProfile?: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create context
const AppStateContext = createContext<AppStateContextType | null>(null);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isChat, setIsChat] = useState<boolean>(false);
  const [isSupport, setIsSupport] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isProfile, setIsProfile] = useState<boolean>(false);

  // Fetch user data from token
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/services/getUser");
        const data = await res.json();

        if (res.ok && data.user) {
          const { user: fetchedUser } = data;

          const updatedUser = { ...fetchedUser, fullName: fetchedUser.name, profileUrl: "https://s3.golu.codes/bucket02/296fe121-5dfa-43f4-98b5-db50019738a7.jpg" };

          setUser((pre)=>updatedUser);
          setIsAdmin(fetchedUser.role === "ADMIN");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []); // Runs once on mount

  return (
    <AppStateContext.Provider value={{ user, isChat, setIsChat, isSupport, setIsSupport, isAdmin , isProfile, setIsProfile }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom Hook to use AppStateContext
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
