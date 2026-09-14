import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { MediaExplorer } from './components/MediaExplorer';
import { MediaDetailModal } from './components/MediaDetailModal';
import { YambyPlayer } from './components/YambyPlayer';
import { PortSyncModal } from './components/PortSyncModal';
import { ServerSetupModal } from './components/ServerSetupModal';
import { SettingsView } from './components/SettingsView';
import { ApkExportModal } from './components/ApkExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EmbyServerConfig, MediaItem } from './types';
import { fetchDynamicPort, applyResolvedPort, DEFAULT_PORT_SYNC_URL, DEFAULT_PORT_SERVICE_NAME } from './services/portSync';
import { EmbyApiClient } from './services/embyApi';
import { DEMO_MEDIA_ITEMS, DEMO_SEASONS, DEMO_EPISODES } from './services/demoData';
import { Radio, RefreshCw, Sparkles, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

const STORAGE_KEY = 'yamby_emby_server_config';
const DEMO_MODE_STORAGE_KEY = 'yamby_is_demo_mode';

const INITIAL_SERVER_CONFIG: EmbyServerConfig = {
  id: 'default-emby-server',
  name: '我的 Emby 服务器',
  host: 'jia.hesip.cn',
  port: 57615,
  useSsl: false,
  useProxy: true,
  portSyncUrl: DEFAULT_PORT_SYNC_URL,
  portSyncService: DEFAULT_PORT_SERVICE_NAME,
  autoSyncPort: true,
  lastSyncedPort: 57615,
  lastSyncedAt: new Date().toISOString(),
};

export default function App() {
  // Server state with local persistence
  const [server, setServer] = useState<EmbyServerConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...INITIAL_SERVER_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_SERVER_CONFIG;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    // If user has token, default to real server; otherwise default to demo mode for instantaneous evaluation
    return saved !== null ? saved === 'true' : true;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'series' | 'settings'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshingPort, setIsRefreshingPort] = useState(false);
  const [portToast, setPortToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isPortSyncModalOpen, setIsPortSyncModalOpen] = useState(false);
  const [isServerSetupModalOpen, setIsServerSetupModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);

  // Data lists
  const [realResumeItems, setRealResumeItems] = useState<MediaItem[]>([]);
  const [realMovies, setRealMovies] = useState<MediaItem[]>([]);
  const [realSeries, setRealSeries] = useState<MediaItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Save server to localStorage whenever it updates
  const handleUpdateServer = useCallback((updated: EmbyServerConfig) => {
    setServer(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  // Save demo mode state
  const handleSetDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(val));
    if (val) {
      setPortToast({
        type: 'info',
        message: '已切换为体验演示库，所有视频与手势控制均可直接播放体验！',
      });
    } else {
      setPortToast({
        type: 'info',
        message: '已切换为真实 Emby 服务器连接模式',
      });
    }
  };

  // Perform dynamic port sync
  const performPortSync = useCallback(async (showNotification = false) => {
    if (!server.portSyncUrl) return;
    setIsRefreshingPort(true);
    try {
      const resolved = await fetchDynamicPort(server.portSyncUrl, server.portSyncService);
      if (resolved.success && resolved.port) {
        const { updatedServer, changed } = applyResolvedPort(server, resolved);
        handleUpdateServer(updatedServer);
        if (showNotification || changed) {
          setPortToast({
            type: 'success',
            message: `动态端口已自动更新为 :${resolved.port} (${resolved.service})`,
          });
        }
      } else if (showNotification) {
        setPortToast({
          type: 'error',
          message: resolved.error || '端口自动更新失败',
        });
      }
    } catch (err: any) {
      if (showNotification) {
        setPortToast({
          type: 'error',
          message: err.message || '端口自动更新网络异常',
        });
      }
    } finally {
      setIsRefreshingPort(false);
    }
  }, [server, handleUpdateServer]);

  // Dynamic port auto-update on every app launch / visit
  useEffect(() => {
    if (server.autoSyncPort) {
      performPortSync(false);
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!portToast) return;
    const timer = setTimeout(() => setPortToast(null), 5000);
    return () => clearTimeout(timer);
  }, [portToast]);

  // Load real server data if connected and not in demo mode
  const loadRealServerData = useCallback(async () => {
    if (isDemoMode || !server.userId || !server.token) return;
    setLoadingData(true);
    try {
      const client = new EmbyApiClient(server);
      const [resumes, moviesRes, seriesRes] = await Promise.all([
        client.getResumeItems(12).catch(() => []),
        client.getItems({ includeItemTypes: 'Movie', limit: 24, sortBy: 'DateCreated', sortOrder: 'Descending' }).catch(() => ({ items: [] })),
        client.getItems({ includeItemTypes: 'Series', limit: 24, sortBy: 'DateCreated', sortOrder: 'Descending' }).catch(() => ({ items: [] })),
      ]);

      setRealResumeItems(resumes);
      setRealMovies(moviesRes.items);
      setRealSeries(seriesRes.items);
    } catch (err) {
      console.error('Failed to load server data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isDemoMode, server]);

  useEffect(() => {
    loadRealServerData();
  }, [loadRealServerData]);

  // Combined data based on mode
  const continueWatching = useMemo(() => {
    if (isDemoMode) {
      return DEMO_MEDIA_ITEMS.filter((i) => (i.UserData?.PlaybackPositionTicks || 0) > 0);
    }
    return realResumeItems.length > 0
      ? realResumeItems
      : DEMO_MEDIA_ITEMS.filter((i) => (i.UserData?.PlaybackPositionTicks || 0) > 0);
  }, [isDemoMode, realResumeItems]);

  const allMovies = useMemo(() => {
    if (isDemoMode) {
      return DEMO_MEDIA_ITEMS.filter((i) => i.Type === 'Movie');
    }
    return realMovies.length > 0 ? realMovies : DEMO_MEDIA_ITEMS.filter((i) => i.Type === 'Movie');
  }, [isDemoMode, realMovies]);

  const allSeries = useMemo(() => {
    if (isDemoMode) {
      return DEMO_MEDIA_ITEMS.filter((i) => i.Type === 'Series');
    }
    return realSeries.length > 0 ? realSeries : DEMO_MEDIA_ITEMS.filter((i) => i.Type === 'Series');
  }, [isDemoMode, realSeries]);

  // Play handler
  const handlePlayMedia = (itemToPlay: MediaItem, resume: boolean = false) => {
    let finalItem = { ...itemToPlay };
    if (!resume) {
      finalItem = {
        ...finalItem,
        UserData: {
          ...finalItem.UserData,
          PlaybackPositionTicks: 0,
        },
      };
    }
    setPlayingItem(finalItem);
    setSelectedItem(null);
  };

  // Get stream URL for playingItem
  const currentStreamUrl = useMemo(() => {
    if (!playingItem) return '';
    if (isDemoMode || playingItem.StreamUrl) {
      return (
        playingItem.StreamUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      );
    }
    const client = new EmbyApiClient(server);
    return client.getStreamUrl(playingItem.Id);
  }, [playingItem, isDemoMode, server]);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification for Dynamic Port Sync */}
      {portToast && (
        <div
          id="port-sync-toast-alert"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs sm:text-sm flex items-center gap-2.5 transition-all duration-300 animate-bounce ${
            portToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : portToast.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : 'bg-neutral-900/95 border-white/20 text-white'
          }`}
        >
          {portToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : portToast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Radio className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          )}
          <span>{portToast.message}</span>
          <button
            onClick={() => setPortToast(null)}
            className="ml-2 text-neutral-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        server={server}
        isDemoMode={isDemoMode}
        onOpenPortSync={() => setIsPortSyncModalOpen(true)}
        onOpenServerSetup={() => setIsServerSetupModalOpen(true)}
        onQuickRefreshPort={() => performPortSync(true)}
        isRefreshingPort={isRefreshingPort}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeDashboard
            server={server}
            continueWatching={continueWatching}
            latestMovies={allMovies}
            latestSeries={allSeries}
            onSelectItem={(item) => setSelectedItem(item)}
            onQuickPlay={(item, resume) => handlePlayMedia(item, resume)}
            isDemoMode={isDemoMode}
            onOpenPortSync={() => setIsPortSyncModalOpen(true)}
            onQuickRefreshPort={() => performPortSync(true)}
            isRefreshingPort={isRefreshingPort}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}

        {activeTab === 'movies' && (
          <MediaExplorer
            type="Movie"
            items={allMovies}
            server={server}
            isDemoMode={isDemoMode}
            onSelectItem={(item) => setSelectedItem(item)}
            onQuickPlay={(item, resume) => handlePlayMedia(item, resume)}
            searchTerm={searchTerm}
          />
        )}

        {activeTab === 'series' && (
          <MediaExplorer
            type="Series"
            items={allSeries}
            server={server}
            isDemoMode={isDemoMode}
            onSelectItem={(item) => setSelectedItem(item)}
            onQuickPlay={(item, resume) => handlePlayMedia(item, resume)}
            searchTerm={searchTerm}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            server={server}
            onUpdateServer={handleUpdateServer}
            isDemoMode={isDemoMode}
            onSwitchToDemo={() => handleSetDemoMode(!isDemoMode)}
            onOpenServerSetup={() => setIsServerSetupModalOpen(true)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}
      </main>

      {/* Media Detail Modal */}
      {selectedItem && (
        <MediaDetailModal
          item={selectedItem}
          server={server}
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          onPlay={(itemToPlay, resume) => handlePlayMedia(itemToPlay, resume)}
          isDemoMode={isDemoMode}
          demoSeasons={DEMO_SEASONS}
          demoEpisodes={DEMO_EPISODES}
        />
      )}

      {/* Fullscreen Gesture-enabled Yamby Player */}
      {playingItem && currentStreamUrl && (
        <YambyPlayer
          item={playingItem}
          server={server}
          streamUrl={currentStreamUrl}
          onClose={() => setPlayingItem(null)}
          hasNextEpisode={Boolean(
            playingItem.Type === 'Episode' &&
            DEMO_EPISODES.find(
              (e) => (e.IndexNumber || 0) === (playingItem.IndexNumber || 0) + 1
            )
          )}
          onNextEpisode={() => {
            const next = DEMO_EPISODES.find(
              (e) => (e.IndexNumber || 0) === (playingItem.IndexNumber || 0) + 1
            );
            if (next) setPlayingItem(next);
          }}
        />
      )}

      {/* Dynamic Port Sync Modal */}
      <PortSyncModal
        server={server}
        isOpen={isPortSyncModalOpen}
        onClose={() => setIsPortSyncModalOpen(false)}
        onUpdateServer={handleUpdateServer}
      />

      {/* Server Setup & Login Modal */}
      <ServerSetupModal
        currentServer={server}
        isOpen={isServerSetupModalOpen}
        onClose={() => setIsServerSetupModalOpen(false)}
        onSaveServer={(updated, andLogin) => {
          handleUpdateServer(updated);
          if (andLogin) {
            handleSetDemoMode(false);
            setPortToast({
              type: 'success',
              message: `已成功登录 Emby 服务器: ${updated.userName}`,
            });
          }
        }}
        onSwitchToDemo={() => {
          handleSetDemoMode(true);
          setIsServerSetupModalOpen(false);
        }}
      />

      {/* Android APK & PWA Packaging Modal */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* PWA Offline / Reconnected status badge */}
      <OfflineIndicator />
    </div>
  );
}
