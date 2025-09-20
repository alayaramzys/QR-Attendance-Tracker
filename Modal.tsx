import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div
          className={classNames(
            'relative bg-white rounded-xl shadow-2xl w-full animate-slide-up max-h-[90vh] overflow-y-auto',
            sizeClasses[size]
          )}
        >
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 pr-8">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};