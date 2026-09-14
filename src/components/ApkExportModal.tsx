import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Terminal,
  HelpCircle,
  X,
  Share2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'pwabuilder' | 'cli'>('quick');

  if (!isOpen) return null;

  // App live URL (shared preview URL or current window URL)
  const currentAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-tkmtqs4ny6wawmj4c3vve4-197262842197.us-west1.run.app';

  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    currentAppUrl
  )}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      alert(
        '请在手机 Chrome / Edge 浏览器中打开此网页，点击浏览器右上角菜单并选择「安装应用」或「添加到主屏幕」，系统将直接为您自动生成并安装 WebAPK！'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#14171d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>打包与安装为 Android APK</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  Android & PWA
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                支持原生 WebAPK 一键安装，或通过 PWABuilder 打包为独立 APK 文件
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-6 pt-4 gap-2 border-b border-white/5 bg-black/20 text-xs font-medium">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>方式一：手机免安装直转 WebAPK (极力推荐)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pwabuilder'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>方式二：一键打包独立 APK 安装包</span>
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>方式三：Android Studio 离线工程</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Tab 1: WebAPK Direct Install */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>什么是 Android WebAPK？</span>
                </div>
                <p>
                  现代 Android 系统的 Chrome / Edge 浏览器具备 Google 官方提供的 WebAPK Minting 服务。
                  当您将配置完备的 PWA 应用添加到手机桌面时，系统会在后台<strong>自动编译打包成一个真正的 Android 原生 APK 文件</strong>（位于 <code className="bg-black/30 px-1 rounded">/data/app/org.chromium.webapk...</code>），具有原生应用图标、全屏播放窗口、手势防冲突与独立后台任务卡片，无需开启“允许未知来源”也能安全极速运行！
                </p>
              </div>

              {/* Status & Action */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-300">当前环境检测</div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                      isInstalled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isInstallable
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isInstalled
                      ? '已作为独立应用运行 (Standalone WebAPK)'
                      : isInstallable
                      ? '可立即一键安装'
                      : '等待手机浏览器唤起'}
                  </span>
                </div>

                {isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>立即安装为 Android 原生应用 (WebAPK)</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>在 Android 手机上安装本应用</span>
                    </button>
                    <p className="text-[11px] text-neutral-400 text-center">
                      * 若当前在电脑或内置预览中，可将网址发送到手机 Chrome 浏览器中打开，点击浏览器菜单中的「添加到主屏幕」或「安装应用」即可！
                    </p>
                  </div>
                )}
              </div>

              {/* Share / Copy Link Box */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span>在手机上访问的应用地址</span>
                  {copied && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 已复制到剪贴板
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentAppUrl}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: PWABuilder 1-click APK Packaging */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-400 text-sm">
                  <Download className="w-4 h-4" />
                  <span>PWABuilder 官方 1 键打包 APK 工具</span>
                </div>
                <p>
                  PWABuilder 是微软与 Google 官方推荐的开源 PWA 打包平台。当前项目已内置符合标准的 Web App Manifest、512x512 高清自适应图标和 Service Worker 缓存。
                </p>
                <p>
                  只需点击下方按钮，PWABuilder 会直接读取本应用的线上清单，并在 10 秒钟内自动生成标准的 <strong>Android APK 安装包 (以及 Google Play 适用的 AAB 格式)</strong>，供您直接下载！
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="text-xs font-medium text-neutral-300">打包步骤说明：</div>
                <ol className="text-xs text-neutral-400 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    点击下方<strong>「在 PWABuilder 中一键打包 APK」</strong>按钮在新标签页打开。
                  </li>
                  <li>
                    页面将自动完成 PWA 认证检测（Manifest & Service Worker 均已达标）。
                  </li>
                  <li>
                    点击页面中的 <strong>「Package for Android」</strong>，选择 <strong>Generate APK</strong>，即可直接保存 <code className="text-emerald-400">.apk</code> 安装包到手机或电脑上！
                  </li>
                </ol>

                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-transform active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>在 PWABuilder 中一键生成并下载 APK</span>
                </a>
              </div>
            </div>
          )}

          {/* Tab 3: GitHub Actions & Capacitor CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-400 text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>GitHub Actions 自动编译与离线打包</span>
                </div>
                <p>
                  已在项目中生成完整的 <strong>.github/workflows/build-apk.yml</strong> 工作流文件，并完成了 <strong>Java 21、Gradle 8.14 与 Android SDK 35</strong> 适配，已彻底修复版本不匹配报错！
                </p>
                <div className="text-[11px] text-neutral-300 space-y-1">
                  <div className="font-semibold text-emerald-400">CI 报错排查与修复点：</div>
                  <div>• <strong>Java 版本升级至 21</strong>：Capacitor 8 / AGP 8.13 严格要求 JDK 21，此前 Java 17 会导致 Gradle 报错。</div>
                  <div>• <strong>补齐 package-lock.json</strong>：避免 setup-node 报 lockfile 缺失错误。</div>
                  <div>• <strong>SDK 统一指定至 API 35 (Android 15)</strong>：完美兼容 GitHub Actions Ubuntu Runner 预装组件。</div>
                  <div>• <strong>集成 setup-gradle 官方加速组件</strong>：自动缓存 Gradle 构件并自动同意 SDK 许可协议。</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-300 space-y-2">
                <div className="text-neutral-500 font-sans font-semibold text-white">方式 A：GitHub 一键触发编译（无需本地装环境）</div>
                <div className="text-neutral-400">将代码推送至 GitHub 仓库后，进入仓库顶部的 <span className="text-emerald-400">Actions</span> 标签页，点击 <span className="text-emerald-400">Build Android APK</span> 并在右侧点击 <span className="text-emerald-400">Run workflow</span>，约 2-3 分钟即可在 Artifacts 中下载编译好的 <span className="text-emerald-300 font-bold">Yamby-Emby-Client-Debug-APK.zip</span>。</div>

                <div className="text-neutral-500 font-sans font-semibold text-white pt-2">方式 B：本地 Android Studio 编译</div>
                <div className="text-emerald-400">npm run build &amp;&amp; npx cap sync android</div>
                <div className="text-emerald-400">npx cap open android</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>已配置完整 PWA 图标、暗黑沉浸式主题与离线缓存</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
