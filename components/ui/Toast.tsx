'use client';

import toast, { Toaster as HotToaster, ToastOptions } from 'react-hot-toast';
import { CheckCircleIcon, WarningIcon, CloseIcon } from './Icons';

// Custom toast styles matching the app's design
const baseStyles: ToastOptions = {
  duration: 4000,
  style: {
    background: '#1e293b', // slate-800
    color: '#f1f5f9', // slate-100
    border: '1px solid #334155', // slate-700
    borderRadius: '0.75rem',
    padding: '12px 16px',
    fontSize: '14px',
    maxWidth: '400px',
  },
};

// Toast API wrapper for consistent usage
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...baseStyles,
      ...options,
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...baseStyles,
      duration: 5000,
      ...options,
      icon: <CloseIcon className="w-5 h-5 text-red-400" />,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...baseStyles,
      ...options,
      icon: <WarningIcon className="w-5 h-5 text-amber-400" />,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...baseStyles,
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...baseStyles,
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // Promise helper for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, {
      ...baseStyles,
      ...options,
    });
  },
};

// Toaster component to be placed in layout
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        ...baseStyles,
      }}
    />
  );
}
