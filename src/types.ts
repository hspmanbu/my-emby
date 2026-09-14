export interface EmbyServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  useSsl: boolean;
  useProxy: boolean; // Route via /api/emby-proxy to prevent Mixed Content & CORS
  portSyncUrl: string; // e.g. http://lac.hesip.top:8080/port
  portSyncService: string; // e.g. emby-nginx
  autoSyncPort: boolean;
  lastSyncedPort?: number;
  lastSyncedAt?: string;
  token?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export interface DynamicPortEntry {
  time?: string;
  name: string;
  ip?: string;
  port: number;
  url?: string;
}

export interface DynamicPortResponse {
  success: boolean;
  service?: string;
  port?: number;
  ip?: string;
  host?: string;
  resolvedUrl?: string;
  updatedAt?: string;
  allEntries?: DynamicPortEntry[];
  error?: string;
  rawPreview?: string;
}

export interface EmbyUser {
  Id: string;
  Name: string;
  ServerId?: string;
  Prefix?: string;
  HasPassword?: boolean;
  PrimaryImageTag?: string;
}

export interface MediaItem {
  Id: string;
  Name: string;
  OriginalTitle?: string;
  Type: 'Movie' | 'Series' | 'Episode' | 'Folder' | 'CollectionFolder' | 'BoxSet';
  ProductionYear?: number;
  PremiereDate?: string;
  CommunityRating?: number;
  RunTimeTicks?: number; // 1 second = 10,000,000 ticks
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
  PrimaryImageTag?: string;
  BackdropImageTags?: string[];
  UserData?: {
    PlaybackPositionTicks?: number;
    PlayCount?: number;
    Played?: boolean;
    IsFavorite?: boolean;
  };
  SeriesName?: string;
  SeriesId?: string;
  SeasonName?: string;
  SeasonId?: string;
  IndexNumber?: number; // Episode number
  ParentIndexNumber?: number; // Season number
  MediaStreams?: MediaStreamInfo[];
  StreamUrl?: string; // Direct or proxied stream URL
}

export interface MediaStreamInfo {
  Type: 'Video' | 'Audio' | 'Subtitle';
  Codec?: string;
  DisplayTitle?: string;
  Language?: string;
  Index: number;
  IsDefault?: boolean;
  Height?: number;
  Width?: number;
  AspectRatio?: string;
  BitRate?: number;
}

export interface SeasonInfo {
  Id: string;
  Name: string;
  IndexNumber: number;
  SeriesId: string;
  PrimaryImageTag?: string;
}

export interface PlaybackGestureState {
  type: 'none' | 'brightness' | 'volume' | 'seek' | 'fastForward';
  value: number; // 0-100 for brightness/volume, seconds for seek, speed for fastForward
  displayVal?: string;
  startX: number;
  startY: number;
  active: boolean;
}
