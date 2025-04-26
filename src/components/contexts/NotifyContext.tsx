"use client"

import React, { createContext, useContext, useState, ReactNode } from "react";

interface NotifyContextProps {
  notifyResponse: number;
  setNotifyResponse: (count: number) => void;
}

const NotifyContext = createContext<NotifyContextProps | undefined>(undefined);

export const NotifyProvider = ({ children }: { children: ReactNode }) => {
  const [notifyResponse, setNotifyResponse] = useState(0);

  return (
    <NotifyContext.Provider value={{ notifyResponse, setNotifyResponse }}>
      {children}
    </NotifyContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotifyContext);
  if (!context) {
    throw new Error("useNotify must be used within a NotifyProvider");
  }
  return context;
};
