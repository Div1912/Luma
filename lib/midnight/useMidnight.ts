"use client";
import { useContext } from 'react';
import { MidnightContext } from './MidnightProvider';

export function useMidnight() {
  const context = useContext(MidnightContext);
  if (context === undefined) {
    throw new Error('useMidnight must be used within a MidnightProvider');
  }
  return context;
}
