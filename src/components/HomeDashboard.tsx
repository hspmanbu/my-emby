import React from 'react';
import { Play, RotateCcw, Star, Clock, Sparkles, ChevronRight, Radio, RefreshCw, CheckCircle2, Smartphone, Download } from 'lucide-react';
import { MediaItem, EmbyServerConfig } from '../types';
import { EmbyApiClient } from '../services/embyApi';

interface HomeDashboardProps {
  server: EmbyServerConfig;
  continueWatching: MediaItem[];
  latestMovies: MediaItem[];
  latestSeries: MediaItem[];
  onSelectItem: (item: MediaItem) => void;
  onQuickPlay: (item: MediaItem, resume: boolean) => void;
  isDemoMode: boolean;
  onOpenPortSync: () => void;
  onQuickRefreshPort: () => void;
  isRefreshingPort: boolean;
  onOpenApkModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  server,
  continueWatching,
  latestMovies,
  latestSeries,
  onSelectItem,
  onQuickPlay,
  isDemoMode,
  onOpenPortSync,
  onQuickRefreshPort,
  isRefreshingPort,
  onOpenApkModal,
}) => {
  const embyClient = React.useMemo(() => new EmbyApiClient(server), [server]);

  // Featured Hero Item (first movie or first continue watching item)
  const featuredItem = continueWatching[0] || latestMovies[0] || latestSeries[0];

  const getItemPoster = (item: MediaItem) => {
    if (isDemoMode) {
      return item.PrimaryImageTag || '';
    }
    return embyClient.getImageUrl(item.Id, 'Primary', 400);
  };

  const getItemBackdrop = (item: MediaItem) => {
    if (isDemoMode) {
      return (item.BackdropImageTags && item.BackdropImageTags[0]) || item.PrimaryImageTag || '';
    }
    return (item.BackdropImageTags && item.BackdropImageTags.length > 0)
      ? embyClient.getImageUrl(item.Id, 'Backdrop', 1200)
      : embyClient.getImageUrl(item.Id, 'Primary', 800);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Dynamic Port Notice Banner (Highlights the user's custom port updater feature) */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto pt-4">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-black/40 border border-emerald-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-300">
                  动态穿透端口已激活
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  :{server.port}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                每次访问自动拉取 <span className="font-mono text-emerald-400/90">{server.portSyncUrl || 'http://lac.hesip.top:8080/port'}</span> 中 <span className="font-mono text-white">{server.portSyncService || 'emby-nginx'}</span> 的端口号，免去手动修改烦恼。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={onQuickRefreshPort}
              disabled={isRefreshingPort}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPort ? 'animate-spin text-emerald-400' : ''}`} />
              <span>刷新端口</span>
            </button>
            <button
              onClick={onOpenApkModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-xs transition-colors border border-white/5"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>APK打包</span>
            </button>
            <button
              onClick={onOpenPortSync}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition-colors"
            >
              设置
            </button>
          </div>
        </div>
      </div>

      {/* Hero Spotlight */}
      {featuredItem && (
        <div className="px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden min-h-[360px] sm:min-h-[460px] flex items-end p-6 sm:p-10 border border-white/10 shadow-2xl bg-neutral-900 group">
            {/* Background Image */}
            <img
              src={getItemBackdrop(featuredItem)}
              alt={featuredItem.Name}
              className="absolute inset-0 w-full h-full object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-700 filter brightness-75"
            />
            {/* Dark Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f12] via-[#0d0f12]/40 to-transparent" />

            {/* Hero Details */}
            <div className="relative z-10 max-w-2xl space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-500/40 uppercase">
                  {featuredItem.Type === 'Series' ? '剧集推荐' : '精选大片'}
                </span>
                {featuredItem.CommunityRating && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {featuredItem.CommunityRating.toFixed(1)}
                  </span>
                )}
                {featuredItem.ProductionYear && (
                  <span className="text-xs text-neutral-300 font-mono">
                    {featuredItem.ProductionYear}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                {featuredItem.Name}
              </h1>

              {featuredItem.Overview && (
                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl drop-shadow">
                  {featuredItem.Overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-hero-play"
                  onClick={() => onQuickPlay(featuredItem, (featuredItem.UserData?.PlaybackPositionTicks || 0) > 0)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {(featuredItem.UserData?.PlaybackPositionTicks || 0) > 0 ? '继续播放' : '立即播放'}
                  </span>
                </button>

                <button
                  id="btn-hero-detail"
                  onClick={() => onSelectItem(featuredItem)}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md transition-colors border border-white/10"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: "继续观看" Continue Watching (Resume) */}
      {continueWatching.length > 0 && (
        <section className="px-4 sm:px-6 max-w-7xl mx-auto space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>继续观看</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {continueWatching.map((item) => {
              const runTicks = item.RunTimeTicks || 1;
              const posTicks = item.UserData?.PlaybackPositionTicks || 0;
              const percent = Math.min(100, Math.round((posTicks / runTicks) * 100));
              const remainingMins = Math.max(1, Math.round((runTicks - posTicks) / 600000000));

              return (
                <div
                  key={item.Id}
                  onClick={() => onSelectItem(item)}
                  className="group relative rounded-2xl overflow-hidden bg-[#14171d] border border-white/5 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-1"
                >
                  {/* Poster Aspect Ratio */}
                  <div className="aspect-[2/3] w-full relative overflow-hidden bg-neutral-900">
                    <img
                      src={getItemPoster(item)}
                      alt={item.Name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Quick play overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickPlay(item, true);
                        }}
                        className="p-3 rounded-full bg-emerald-600 text-white shadow-xl hover:scale-110 transition-transform"
                      >
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="p-2.5 space-y-1">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {item.Name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>剩余 {remainingMins} 分钟</span>
                      <span className="font-mono text-emerald-400">{percent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: "最新电影" Latest Movies */}
      {latestMovies.length > 0 && (
        <section className="px-4 sm:px-6 max-w-7xl mx-auto space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white">
              最新电影
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {latestMovies.map((item) => (
              <div
                key={item.Id}
                onClick={() => onSelectItem(item)}
                className="group relative rounded-2xl overflow-hidden bg-[#14171d] border border-white/5 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-1"
              >
                <div className="aspect-[2/3] w-full relative overflow-hidden bg-neutral-900">
                  <img
                    src={getItemPoster(item)}
                    alt={item.Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating Tag */}
                  {item.CommunityRating && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 font-bold text-[10px] flex items-center gap-0.5 border border-white/10">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {item.CommunityRating.toFixed(1)}
                    </div>
                  )}

                  {/* Play on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickPlay(item, false);
                      }}
                      className="p-3 rounded-full bg-emerald-600 text-white shadow-xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {item.Name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{item.ProductionYear || '电影'}</span>
                    <span className="text-[10px] px-1 rounded bg-white/10 text-neutral-300">
                      {item.MediaStreams?.find((s) => s.Type === 'Video')?.Codec || '高清'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: "热播剧集" Latest Series */}
      {latestSeries.length > 0 && (
        <section className="px-4 sm:px-6 max-w-7xl mx-auto space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white">
              热播剧集
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {latestSeries.map((item) => (
              <div
                key={item.Id}
                onClick={() => onSelectItem(item)}
                className="group relative rounded-2xl overflow-hidden bg-[#14171d] border border-white/5 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer shadow-md hover:-translate-y-1"
              >
                <div className="aspect-[2/3] w-full relative overflow-hidden bg-neutral-900">
                  <img
                    src={getItemPoster(item)}
                    alt={item.Name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Series Badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600/80 backdrop-blur-md text-white font-semibold text-[10px]">
                    剧集
                  </div>

                  {/* Play on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item);
                      }}
                      className="p-3 rounded-full bg-emerald-600 text-white shadow-xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {item.Name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{item.ProductionYear || '连载'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {item.CommunityRating ? `★ ${item.CommunityRating.toFixed(1)}` : '更新中'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
