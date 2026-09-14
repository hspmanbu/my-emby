import React, { useState } from 'react';
import {
  Server,
  Radio,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sun,
  Volume2,
  FastForward,
  Lock,
  RotateCcw,
  Layers,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Download,
} from 'lucide-react';
import { EmbyServerConfig, DynamicPortResponse } from '../types';
import { fetchDynamicPort, applyResolvedPort } from '../services/portSync';
import { EmbyApiClient } from '../services/embyApi';

interface SettingsViewProps {
  server: EmbyServerConfig;
  onUpdateServer: (server: EmbyServerConfig) => void;
  isDemoMode: boolean;
  onSwitchToDemo: () => void;
  onOpenServerSetup: () => void;
  onOpenApkModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  server,
  onUpdateServer,
  isDemoMode,
  onSwitchToDemo,
  onOpenServerSetup,
  onOpenApkModal,
}) => {
  const [portUrl, setPortUrl] = useState(server.portSyncUrl || 'http://lac.hesip.top:8080/port');
  const [serviceName, setServiceName] = useState(server.portSyncService || 'emby-nginx');
  const [autoSync, setAutoSync] = useState(server.autoSyncPort ?? true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DynamicPortResponse | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFetchPort = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await fetchDynamicPort(portUrl, serviceName);
      setResult(data);
      if (data.success && data.port) {
        const { updatedServer } = applyResolvedPort(
          { ...server, portSyncUrl: portUrl.trim(), portSyncService: serviceName.trim(), autoSyncPort: autoSync },
          data
        );
        onUpdateServer(updatedServer);
        setStatusMsg({
          type: 'success',
          text: `成功获取最新端口: ${data.port}（服务: ${data.service}），已自动同步到服务器配置！`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: data.error || '未能成功获取目标端口',
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || '抓取端口失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24 text-white">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">应用设置与网络配置</h1>
        <p className="text-xs text-neutral-400 mt-1">
          管理 Emby 远程连接、动态端口自动更新规则与播放器手势偏好
        </p>
      </div>

      {/* Feature 1: Dynamic Port Auto-updater (The user's key feature) */}
      <div className="p-6 rounded-3xl bg-[#14171d] border border-white/10 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">动态端口自动更新服务</h2>
              <p className="text-xs text-neutral-400">
                专为无公网 IP 内网穿透设计，定时或每次访问自动同步穿透映射端口
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
            当前生效: :{server.port}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              端口发布页面地址 (Port API URL)
            </label>
            <input
              type="text"
              value={portUrl}
              onChange={(e) => setPortUrl(e.target.value)}
              placeholder="http://lac.hesip.top:8080/port"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-emerald-500/60"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              * 示例：http://lac.hesip.top:8080/port（通过内置全栈服务端代理抓取，免除浏览器跨域及混合内容拦截）
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                匹配穿透服务名 (Service Name)
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="emby-nginx"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                上次同步记录
              </label>
              <div className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 flex items-center justify-between">
                <span>记录端口: {server.lastSyncedPort || server.port}</span>
                <span className="text-[11px] text-neutral-500">
                  {server.lastSyncedAt ? new Date(server.lastSyncedAt).toLocaleString() : '尚未同步'}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <div className="text-xs sm:text-sm font-medium text-neutral-200">每次访问应用时自动更新</div>
              <div className="text-[11px] text-neutral-400">启动应用或刷新界面时自动检查最新穿透端口</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.checked);
                  onUpdateServer({ ...server, autoSyncPort: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleFetchPort}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '正在抓取端口并验证...' : '立即测试并抓取最新端口'}
            </button>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div>{statusMsg.text}</div>
            </div>
          )}
        </div>
      </div>

      {/* Feature 2: Yamby Gesture Control Guide & Legend */}
      <div className="p-6 rounded-3xl bg-[#14171d] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Yamby 播放器全手势控制指南</h2>
            <p className="text-xs text-neutral-400">
              深度还原移动端与触控板沉浸式手势，随心掌控播放细节
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">左侧垂直拖动</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                手指或鼠标在播放器左侧 45% 上下滑动，实时无级微调屏幕亮度（带 HUD 指示）。
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">右侧垂直拖动</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                在播放器右侧 45% 上下滑动，平滑增减音量大小（0%~100%）。
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <FastForward className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">横向水平拖动</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                左右滑动任意位置快速快进/快退，中央弹出时间差值预览，松手直接跳播。
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">双击两翼跳跃</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                双击左侧倒退 10 秒，双击右侧前进 10 秒，双击中间暂停/播放。
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
              <FastForward className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">长按 2.0X 极速播放</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                长按屏幕任意位置立即进入 2 倍速快进，手指或鼠标松开自动恢复原速。
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">一键锁屏模式</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                点击左侧浮动锁屏按钮可锁定手势与界面，防止误触，观影更舒心。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3: Android APK & PWA Packaging Center */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-[#14171d] to-[#14171d] border border-emerald-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android APK 打包与安装中心</h2>
              <p className="text-xs text-neutral-400">
                支持原生 WebAPK 手机极速免安装生成，或使用 PWABuilder 1 键打包独立 APK
              </p>
            </div>
          </div>

          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all hover:scale-105 shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>打包 / 安装 APK</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-neutral-300">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>安卓原生 WebAPK（首选推荐）</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              在手机 Chrome 访问本站，点击「安装应用」，系统后台即自动编译生成官方原生 APK 安装在桌面，拥有完整离线缓存与全屏窗口。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>PWABuilder 独立 APK 打包</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              已预装标准 Web App Manifest 与自适应遮罩图标，在打包中心内可 1 键跳转生成独立离线 .apk 文件安装包。
            </p>
          </div>
        </div>
      </div>

      {/* Feature 4: Server Credentials & Mode Switch */}
      <div className="p-6 rounded-3xl bg-[#14171d] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">当前 Emby 服务器</h2>
              <p className="text-xs text-neutral-400 font-mono">
                {server.host}:{server.port} (用户: {server.userName || '未登录'})
              </p>
            </div>
          </div>

          <button
            onClick={onOpenServerSetup}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            编辑凭据与切换
          </button>
        </div>

        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            模式状态: {isDemoMode ? '🎮 体验演示库模式 (免密直播)' : '🌐 真实 Emby 服务器连接'}
          </div>
          <button
            onClick={onSwitchToDemo}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>切换为演示体验库</span>
          </button>
        </div>
      </div>
    </div>
  );
};
