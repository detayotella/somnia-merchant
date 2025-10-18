import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300";
  
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-secondary text-background shadow-glow hover:shadow-glowStrong hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "border border-borderLight bg-surfaceLight text-textPrimary hover:border-primary/40 hover:bg-surface",
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
