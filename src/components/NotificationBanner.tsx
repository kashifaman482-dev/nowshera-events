import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationBannerProps {
  notifications: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      id="notification-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none"
    >
      {notifications.map((n) => {
        const isError = n.type === 'error';
        const isSuccess = n.type === 'success';

        return (
          <div
            key={n.id}
            id={`toast-${n.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 ${
              isError
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : isSuccess
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {!isError && !isSuccess && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed break-words">
              {n.message}
            </div>
            <button
              id={`toast-dismiss-${n.id}`}
              onClick={() => onDismiss(n.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
