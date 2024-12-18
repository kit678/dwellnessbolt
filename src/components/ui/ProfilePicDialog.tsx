import React from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface ProfilePicDialogProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ProfilePicDialog: React.FC<ProfilePicDialogProps> = ({
  isOpen,
  imageUrl,
  onClose,
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
            <div className="relative">
              <button
                onClick={onClose}
                className="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Profile Large"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <p className="text-center text-gray-600">No profile picture available</p>
              )}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
