import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
  return (
    <motion.div 
      className={cn(
        "bg-[rgba(15,15,15,0.6)] backdrop-blur-xl border border-[var(--color-ghost-border)] rounded-2xl shadow-2xl p-6",
        hoverEffect && "transition-all duration-300 hover:border-[var(--color-ghost-border-glow)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
