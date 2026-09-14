import React, { useState } from 'react';
import { Film, Tv, Home, Settings, Radio, RefreshCw, Server, Search, User, PlayCircle, Sparkles, Check, ChevronDown, Smartphone } from 'lucide-react';
import { EmbyServerConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'home' | 'movies' | 'series' | 'settings';
  setActiveTab: (tab: 'home' | 'movies' | 'series' | 'settings') => void;
  server: EmbyServerConfig;
  isDemoMode: boolean;
  onOpenPortSync: () => void;
  onOpenServerSetup: () => void;
  onQuickRefreshPort: () => void;
  isRefreshingPort: boolean;
  onSearch: (term: string) => void;
  searchTerm: string;
  onOpenApkModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  server,
  isDemoMode,
  onOpenPortSync,
  onOpenServerSetup,
  onQuickRefreshPort,
  isRefreshingPort,
  onSearch,
  searchTerm,
  onOpenApkModal,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0f12]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  YAMBY
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Emby
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 -mt-0.5">第三方轻量极速客户端</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>首页</span>
            </button>
            <button
              id="nav-tab-movies"
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'movies'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>电影</span>
            </button>
            <button
              id="nav-tab-series"
              onClick={() => setActiveTab('series')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                activeTab === 'series'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>剧集</span>
            </button>
          </nav>
        </div>

        {/* Center/Right Info & Search & Server pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 justify-end">
          {/* Search bar */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 w-40 sm:w-60">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="搜索影片、剧集..."
                  autoFocus
                  className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    onSearch('');
                  }}
                  className="text-neutral-500 hover:text-neutral-300 text-xs ml-1"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="搜索视频"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dynamic Port Sync & Server Status Pill */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={onOpenServerSetup}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 text-neutral-300 transition-colors"
              title="切换服务器或配置凭证"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] max-w-[100px] sm:max-w-[140px] truncate">
                {isDemoMode ? '演示库模式' : `${server.host}:${server.port}`}
              </span>
            </button>

            {/* Quick Port Sync Button */}
            {!isDemoMode && (
              <button
                id="btn-navbar-quick-port-sync"
                onClick={onQuickRefreshPort}
                disabled={isRefreshingPort}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all font-mono text-[11px]"
                title="立刻抓取最新穿透端口"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingPort ? 'animate-spin text-emerald-300' : ''}`} />
                <span className="hidden sm:inline">端口:{server.port}</span>
              </button>
            )}

            <button
              id="btn-navbar-open-port-sync"
              onClick={onOpenPortSync}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-emerald-400 transition-colors"
              title="动态端口自动更新配置"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PWA / APK Install Button */}
          <PWAInstallButton onOpenApkModal={onOpenApkModal} />

          {/* User / Settings Button */}
          <button
            id="nav-btn-settings"
            onClick={onOpenServerSetup}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-neutral-300 text-xs transition-colors"
          >
            {isDemoMode ? (
              <Sparkles className="w-4 h-4 text-amber-400" />
            ) : server.userName ? (
              <div className="w-5 h-5 rounded-full bg-emerald-600/80 text-white flex items-center justify-center text-[10px] font-bold">
                {server.userName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-4 h-4 text-neutral-400" />
            )}
            <span className="hidden sm:inline font-medium">
              {isDemoMode ? '演示访客' : server.userName || '未登录'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="flex md:hidden border-t border-white/5 bg-[#0d0f12]/95 px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'home' ? 'text-emerald-400' : 'text-neutral-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>首页</span>
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'movies' ? 'text-emerald-400' : 'text-neutral-400'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>电影</span>
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'series' ? 'text-emerald-400' : 'text-neutral-400'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>剧集</span>
        </button>
        <button
          onClick={onOpenServerSetup}
          className="flex flex-col items-center gap-1 text-[11px] text-neutral-400"
        >
          <Settings className="w-4 h-4" />
          <span>服务器</span>
        </button>
      </div>
    </header>
  );
};
