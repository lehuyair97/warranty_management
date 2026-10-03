'use client';

import React from 'react';
import { IconAlertCircle } from '@/assets/icon';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Universal Textarea component matching Input design tokens, error states, and typography.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const textareaId =
      id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full p-3 text-sm bg-white border rounded-xl text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-50 disabled:text-stone-400 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-sand-200'
          } ${className}`}
          {...props}
        />
        {error ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="text-xs text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
