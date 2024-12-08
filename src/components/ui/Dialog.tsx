import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from './button';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{title}</h2>
              <p className="text-gray-700 mb-6">{message}</p>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={onClose}>
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button onClick={onConfirm}>
                    {confirmText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
