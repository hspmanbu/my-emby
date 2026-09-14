import React, { useState, useMemo } from 'react';
import { Play, Star, Calendar, Clock, Filter, ArrowUpDown, Search, Film, Tv } from 'lucide-react';
import { MediaItem, EmbyServerConfig } from '../types';
import { EmbyApiClient } from '../services/embyApi';

interface MediaExplorerProps {
  type: 'Movie' | 'Series';
  items: MediaItem[];
  server: EmbyServerConfig;
  isDemoMode: boolean;
  onSelectItem: (item: MediaItem) => void;
  onQuickPlay: (item: MediaItem, resume: boolean) => void;
  searchTerm?: string;
}

export const MediaExplorer: React.FC<MediaExplorerProps> = ({
  type,
  items,
  server,
  isDemoMode,
  onSelectItem,
  onQuickPlay,
  searchTerm = '',
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'year' | 'name'>('date');
  const [localSearch, setLocalSearch] = useState<string>('');

  const embyClient = React.useMemo(() => new EmbyApiClient(server), [server]);

  // Extract all distinct genres
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.Genres?.forEach((g) => set.add(g));
    });
    return Array.from(set);
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const term = (searchTerm || localSearch).toLowerCase().trim();
    return items
      .filter((item) => {
        if (selectedGenre !== 'all') {
          if (!item.Genres || !item.Genres.includes(selectedGenre)) return false;
        }
        if (term) {
          const matchName = item.Name.toLowerCase().includes(term);
          const matchOrig = item.OriginalTitle?.toLowerCase().includes(term);
          const matchOverview = item.Overview?.toLowerCase().includes(term);
          if (!matchName && !matchOrig && !matchOverview) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.CommunityRating || 0) - (a.CommunityRating || 0);
        }
        if (sortBy === 'year') {
          return (b.ProductionYear || 0) - (a.ProductionYear || 0);
        }
        if (sortBy === 'name') {
          return a.Name.localeCompare(b.Name);
        }
        // default: date added or ID
        return b.Id.localeCompare(a.Id);
      });
  }, [items, selectedGenre, sortBy, searchTerm, localSearch]);

  const getItemPoster = (item: MediaItem) => {
    if (isDemoMode) return item.PrimaryImageTag || '';
    return embyClient.getImageUrl(item.Id, 'Primary', 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {type === 'Movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {type === 'Movie' ? '电影库 (Movies)' : '电视剧集 (TV Series)'}
            </h1>
            <p className="text-xs text-neutral-400">
              共 {filteredItems.length} 部{type === 'Movie' ? '影片' : '剧集'}
            </p>
          </div>
        </div>

        {/* Sort & Search Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="库内筛选..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 w-36 sm:w-48 font-sans"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 ml-1 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-neutral-300 text-xs focus:outline-none cursor-pointer pr-2"
            >
              <option value="date" className="bg-[#14171d]">按添加时间</option>
              <option value="rating" className="bg-[#14171d]">按评分优先</option>
              <option value="year" className="bg-[#14171d]">按上映年份</option>
              <option value="name" className="bg-[#14171d]">按片名名称</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Pills */}
      {allGenres.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedGenre === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            全部类型
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 text-sm space-y-2">
          <p>未找到符合条件的{type === 'Movie' ? '电影' : '剧集'}</p>
          <p className="text-xs text-neutral-500">可以尝试清除搜索词或类型筛选</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => (
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

                {/* Rating Badge */}
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
                      if (type === 'Movie') {
                        onQuickPlay(item, false);
                      } else {
                        onSelectItem(item);
                      }
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
                  <span>{item.ProductionYear || (type === 'Movie' ? '电影' : '剧集')}</span>
                  {item.Genres && item.Genres[0] && (
                    <span className="text-[10px] text-emerald-400/90 truncate max-w-[80px]">
                      {item.Genres[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
