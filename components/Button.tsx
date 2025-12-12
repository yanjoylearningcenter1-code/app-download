import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#FFB347] text-white shadow-[0_4px_0_#F57C00] hover:bg-[#FFCC80] active:shadow-none active:translate-y-1",
    secondary: "bg-[#AED581] text-[#33691E] shadow-[0_4px_0_#689F38] hover:bg-[#C5E1A5] active:shadow-none active:translate-y-1",
    outline: "border-2 border-[#E0E0E0] text-gray-600 hover:bg-gray-50 active:bg-gray-100",
    ghost: "text-gray-500 hover:bg-gray-100/50"
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed active:scale-100 active:shadow-[0_4px_0_rgba(0,0,0,0.1)]' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};