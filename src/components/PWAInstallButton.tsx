import React, { useState } from 'react';
import { Download, Smartphone, Check, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenApkModal?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenApkModal,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA / WebAPK
  if (isInstalled) {
    return (
      <button
        onClick={onOpenApkModal}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors ${className}`}
        title="已安装为应用 (点击查看 APK 详情)"
      >
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">已安装应用</span>
        <span className="sm:hidden">已安装</span>
      </button>
    );
  }

  // Chromium / Android flow
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (!success && onOpenApkModal) {
            onOpenApkModal();
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all active:scale-95 ${className}`}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>安装应用 (APK)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>添加到主屏幕</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#14171d] border border-white/10 p-6 shadow-2xl text-white space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>在 iPhone / iPad 上安装</span>
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                1. 点击 Safari 底部工具栏的<strong>「分享」</strong>按钮（带向上箭头的方框）。<br />
                2. 在弹出菜单中向下滑动，选择<strong>「添加到主屏幕」</strong>。<br />
                3. 点击右上角「添加」，即可像原生 App 一样全屏无地址栏使用！
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default fallback button when browser hasn't fired beforeinstallprompt or desktop browser
  return (
    <button
      onClick={onOpenApkModal}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors ${className}`}
      title="打包或安装为 Android APK"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
      <span>安装为 APK</span>
    </button>
  );
};
