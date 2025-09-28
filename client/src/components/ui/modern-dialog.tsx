import React, { ReactNode } from 'react';

interface ModernDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: ReactNode;
}

export function ModernDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = 'warning',
  icon
}: ModernDialogProps) {
  if (!isOpen) return null;

  const getTypeClasses = () => {
    switch (type) {
      case 'danger':
        return {
          gradient: 'from-red-500/20 via-orange-500/20 to-red-600/20',
          border: 'border-red-200/30',
          confirmBg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          iconColor: 'text-red-500'
        };
      case 'info':
        return {
          gradient: 'from-blue-500/20 via-indigo-500/20 to-blue-600/20',
          border: 'border-blue-200/30',
          confirmBg: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          iconColor: 'text-blue-500'
        };
      default:
        return {
          gradient: 'from-amber-500/20 via-orange-500/20 to-amber-600/20',
          border: 'border-amber-200/30',
          confirmBg: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
          iconColor: 'text-amber-500'
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`
          relative w-full max-w-md mx-auto
          bg-gradient-to-br ${typeClasses.gradient}
          backdrop-blur-xl border ${typeClasses.border}
          rounded-2xl shadow-2xl
          transform transition-all duration-300
          animate-in fade-in-0 zoom-in-95
        `}
      >
        {/* Effet glassmorphism */}
        <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
        
        {/* Contenu */}
        <div className="relative p-6">
          {/* Header avec icône */}
          <div className="flex items-center gap-4 mb-6">
            {icon && (
              <div className={`w-12 h-12 rounded-full ${typeClasses.iconColor} bg-white/20 flex items-center justify-center`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <p className="text-white/90 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="
                flex-1 px-4 py-3 rounded-xl
                bg-white/20 hover:bg-white/30
                text-white font-medium
                border border-white/30
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
              "
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                flex-1 px-4 py-3 rounded-xl
                bg-gradient-to-r ${typeClasses.confirmBg}
                text-white font-medium
                shadow-lg
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                hover:shadow-xl
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}