import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  Heart,
  Clock,
  Calendar,
  Star,
  Tv,
  Film,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { MediaItem, SeasonInfo, EmbyServerConfig } from '../types';
import { EmbyApiClient } from '../services/embyApi';

interface MediaDetailModalProps {
  item: MediaItem;
  server: EmbyServerConfig;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (itemToPlay: MediaItem, resume: boolean) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  isDemoMode: boolean;
  demoSeasons?: SeasonInfo[];
  demoEpisodes?: MediaItem[];
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  server,
  isOpen,
  onClose,
  onPlay,
  onToggleFavorite,
  isDemoMode,
  demoSeasons = [],
  demoEpisodes = [],
}) => {
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const embyClient = React.useMemo(() => new EmbyApiClient(server), [server]);

  // Load seasons & episodes if item is a Series
  useEffect(() => {
    if (!isOpen || item.Type !== 'Series') return;

    if (isDemoMode) {
      setSeasons(demoSeasons);
      if (demoSeasons.length > 0) {
        setSelectedSeasonId(demoSeasons[0].Id);
        setEpisodes(demoEpisodes);
      }
      return;
    }

    const loadSeriesData = async () => {
      setLoadingEpisodes(true);
      try {
        const sList = await embyClient.getSeasons(item.Id);
        setSeasons(sList);
        if (sList.length > 0) {
          const firstSeason = sList[0];
          setSelectedSeasonId(firstSeason.Id);
          const epList = await embyClient.getEpisodes(item.Id, firstSeason.Id);
          setEpisodes(epList);
        }
      } catch (err) {
        console.error('Failed to load seasons:', err);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    loadSeriesData();
  }, [isOpen, item.Id, item.Type, isDemoMode]);

  // Load episodes when switching seasons
  const handleSelectSeason = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    if (isDemoMode) return;

    setLoadingEpisodes(true);
    try {
      const epList = await embyClient.getEpisodes(item.Id, seasonId);
      setEpisodes(epList);
    } catch (err) {
      console.error('Failed to load episodes for season:', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  if (!isOpen) return null;

  // Format runtime
  const formatDuration = (ticks?: number) => {
    if (!ticks) return null;
    const mins = Math.floor(ticks / 600000000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}小时${remMins > 0 ? ` ${remMins}分钟` : ''}`;
    return `${mins}分钟`;
  };

  const resumeTicks = item.UserData?.PlaybackPositionTicks || 0;
  const resumeSecs = Math.floor(resumeTicks / 10000000);
  const resumeMins = Math.floor(resumeSecs / 60);
  const hasResume = resumeTicks > 0;

  const backdropUrl = isDemoMode
    ? (item.BackdropImageTags && item.BackdropImageTags[0]) || item.PrimaryImageTag
    : (item.BackdropImageTags && item.BackdropImageTags.length > 0)
    ? embyClient.getImageUrl(item.Id, 'Backdrop', 1200)
    : embyClient.getImageUrl(item.Id, 'Primary', 800);

  const posterUrl = isDemoMode
    ? item.PrimaryImageTag
    : embyClient.getImageUrl(item.Id, 'Primary', 400);

  return (
    <div id="media-detail-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div id="media-detail-card" className="relative w-full max-w-4xl bg-[#12151b] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-white my-auto">
        {/* Backdrop Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={backdropUrl}
            alt={item.Name}
            className="w-full h-full object-cover object-center scale-105 filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12151b] via-[#12151b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12151b] via-transparent to-transparent" />

          {/* Close button */}
          <button
            id="btn-close-media-detail"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md transition-colors border border-white/10 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container (Negative margin to overlap backdrop) */}
        <div className="relative px-6 sm:px-8 pb-8 -mt-24 sm:-mt-32 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Card */}
            <div className="w-32 sm:w-44 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-neutral-900 aspect-[2/3]">
              <img
                src={posterUrl}
                alt={item.Name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Meta & Title */}
            <div className="flex-1 space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold text-xs border border-emerald-500/30 uppercase">
                  {item.Type === 'Series' ? '电视剧集' : '电影'}
                </span>
                {item.ProductionYear && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.ProductionYear}
                  </span>
                )}
                {item.RunTimeTicks && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(item.RunTimeTicks)}
                  </span>
                )}
                {item.CommunityRating && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {item.CommunityRating.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {item.Name}
              </h1>

              {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                <p className="text-xs sm:text-sm text-neutral-400 font-mono italic">
                  {item.OriginalTitle}
                </p>
              )}

              {/* Taglines or stream badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {item.MediaStreams?.find((s) => s.Type === 'Video')?.DisplayTitle && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[11px] font-mono border border-white/10">
                    {item.MediaStreams.find((s) => s.Type === 'Video')?.DisplayTitle}
                  </span>
                )}
                {item.MediaStreams?.find((s) => s.Type === 'Audio')?.DisplayTitle && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-[11px] font-mono border border-white/10">
                    {item.MediaStreams.find((s) => s.Type === 'Audio')?.DisplayTitle}
                  </span>
                )}
                {item.Genres?.map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] border border-emerald-500/20"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="btn-media-detail-play"
                  onClick={() => onPlay(item, false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>立即播放</span>
                </button>

                {hasResume && (
                  <button
                    id="btn-media-detail-resume"
                    onClick={() => onPlay(item, true)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2 transition-colors border border-white/10"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>从 {resumeMins} 分钟续播</span>
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(item)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      item.UserData?.IsFavorite
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="加入收藏"
                  >
                    <Heart className={`w-4 h-4 ${item.UserData?.IsFavorite ? 'fill-rose-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Overview Synopsis */}
          {item.Overview && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h2 className="text-sm font-semibold text-neutral-200">剧情简介</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl">
                {item.Overview}
              </p>
            </div>
          )}

          {/* If Series: Seasons & Episodes Explorer */}
          {item.Type === 'Series' && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-emerald-400" />
                  剧集选集播放
                </h2>
                {/* Seasons pills */}
                {seasons.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {seasons.map((s) => (
                      <button
                        key={s.Id}
                        onClick={() => handleSelectSeason(s.Id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedSeasonId === s.Id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {s.Name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episodes List */}
              {loadingEpisodes ? (
                <div className="text-xs text-neutral-400 py-6 text-center">正在加载剧集列表...</div>
              ) : episodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {episodes.map((ep) => (
                    <div
                      key={ep.Id}
                      onClick={() => onPlay(ep, false)}
                      className="group p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer flex gap-3 items-center"
                    >
                      <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                        <img
                          src={
                            ep.PrimaryImageTag ||
                            (isDemoMode
                              ? item.PrimaryImageTag
                              : embyClient.getImageUrl(ep.Id, 'Primary', 300))
                          }
                          alt={ep.Name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {ep.IndexNumber ? `第 ${ep.IndexNumber} 集: ` : ''}
                          {ep.Name}
                        </div>
                        {ep.Overview && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                            {ep.Overview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-400 py-4">暂无单集信息</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
