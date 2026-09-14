import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/90 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-pulse">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <span>当前处于离线模式，正在使用 PWA 本地离线缓存</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600/90 border border-emerald-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-fadeIn">
        <Wifi className="w-4 h-4 text-white shrink-0" />
        <span>网络已恢复连接</span>
      </div>
    );
  }

  return null;
};
