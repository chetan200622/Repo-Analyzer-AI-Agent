'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  magnetic?: boolean;
}

export function SpotlightCard({ children, className = '', magnetic = false, ...props }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Global mouse tracking for the spotlight effect
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      // Calculate position relative to the card
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magnetic || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({ x: x * 0.05, y: y * 0.05 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`spotlight-card border border-white/10 shadow-spatial ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: magnetic ? position.x : 0,
        y: magnetic ? position.y : 0,
        scale: isHovered && magnetic ? 1.01 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1
      }}
      {...props}
    >
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
