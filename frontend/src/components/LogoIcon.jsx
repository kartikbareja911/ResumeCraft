import React from 'react';

export default function LogoIcon({ className = "w-6 h-6", strokeWidth = 2.5 }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Page Outline */}
      <path 
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
        className="stroke-slate-800 dark:stroke-slate-200" 
      />
      {/* Folded Corner */}
      <path 
        d="M14 2v6h6" 
        className="stroke-slate-800 dark:stroke-slate-200" 
      />
      {/* Centered Teal Checkmark */}
      <path 
        d="M9 13.5l2 2 4-4" 
        className="stroke-teal-600 dark:stroke-teal-400" 
        strokeWidth={strokeWidth * 1.25}
      />
    </svg>
  );
}
