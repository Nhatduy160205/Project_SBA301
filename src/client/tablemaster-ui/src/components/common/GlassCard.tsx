import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  id,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`luxury-card rounded-2xl p-6 transition-all duration-300 ${
        hoverEffect ? 'luxury-card-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
