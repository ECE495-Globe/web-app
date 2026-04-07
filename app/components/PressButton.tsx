import React from "react";

type PressButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function PressButton({ children, onClick, className = "" }: PressButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-white shadow-md
      transition-all duration-100
      active:translate-y-1 active:shadow-sm
      ${className}`}
    >
      {children}
    </button>
  );
}