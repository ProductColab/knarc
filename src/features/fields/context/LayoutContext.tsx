"use client";
import { createContext, useContext, ReactNode, useState } from 'react'
import { Direction } from '../hooks/useAutoLayout';

interface LayoutContextType {
  direction: Direction;
  spacing: [number, number];
  setDirection: (direction: Direction) => void;
  setSpacing: (spacing: [number, number]) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<Direction>('TB');
  const [spacing, setSpacing] = useState<[number, number]>([200, 150]);

  return (
    <LayoutContext.Provider 
      value={{ 
        direction, 
        spacing, 
        setDirection, 
        setSpacing 
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
} 