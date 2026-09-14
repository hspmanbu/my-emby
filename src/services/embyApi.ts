import { EmbyServerConfig, EmbyUser, MediaItem, SeasonInfo } from '../types';

export class EmbyApiClient {
  private server: EmbyServerConfig;

  constructor(server: EmbyServerConfig) {
    this.server = server;
  }

  public updateServer(server: EmbyServerConfig) {
    this.server = server;
  }

  public getServer(): EmbyServerConfig {
    return this.server;
  }

  public getBaseUrl(): string {
    const protocol = this.server.useSsl ? 'https' : 'http';
    return `${protocol}://${this.server.host}:${this.server.port}`;
  }

  /**
   * Builds an API request URL. If useProxy is enabled (default for mixed-content safety),
   * routes via /api/emby-proxy
   */
  private buildRequestUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (this.server.useProxy) {
      const serverBase = this.getBaseUrl();
      return `/api/emby-proxy?server=${encodeURIComponent(serverBase)}&path=${encodeURIComponent(cleanPath)}`;
    }
    return `${this.getBaseUrl()}${cleanPath}`;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Emby-Client': 'Yamby Web',
      'X-Emby-Device-Name': 'Web Browser',
      'X-Emby-Device-Id': 'yamby-web-client-v1',
      'X-Emby-Client-Version': '1.5.0',
    };

    if (this.server.token) {
      headers['X-Emby-Token'] = this.server.token;
    }

    return headers;
  }

  /**
   * Test connection & retrieve public server information
   */
  public async getPublicSystemInfo(): Promise<any> {
    const url = this.buildRequestUrl('/System/Info/Public');
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: 连接服务器失败`);
    return await res.json();
  }

  /**
   * Get list of public users
   */
  public async getPublicUsers(): Promise<EmbyUser[]> {
    try {
      const url = this.buildRequestUrl('/Users/Public');
      const res = await fetch(url, { headers: this.getAuthHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Authenticate user with username and password
   */
  public async authenticate(username: string, password: string = ''): Promise<{ user: EmbyUser; token: string }> {
    const url = this.buildRequestUrl('/Users/AuthenticateByName');
    const body = {
      Username: username,
      Pw: password,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `认证失败 (HTTP ${res.status})，请检查密码`);
    }

    const data = await res.json();
    const token = data.AccessToken;
    const user = data.User;

    return {
      user: {
        Id: user.Id,
        Name: user.Name,
        ServerId: user.ServerId,
        PrimaryImageTag: user.PrimaryImageTag,
      },
      token,
    };
  }

  /**
   * Get Root/User Views (Libraries like Movies, TV Shows, etc.)
   */
  public async getUserViews(): Promise<MediaItem[]> {
    if (!this.server.userId) return [];
    const url = this.buildRequestUrl(`/Users/${this.server.userId}/Views`);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.Items || [];
  }

  /**
   * Get Resume Items (Continue Watching)
   */
  public async getResumeItems(limit: number = 12): Promise<MediaItem[]> {
    if (!this.server.userId) return [];
    const path = `/Users/${this.server.userId}/Items/Resume?Limit=${limit}&Recursive=true&Fields=Overview,PrimaryImageAspectRatio,UserData,MediaStreams`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.Items || [];
  }

  /**
   * Get Latest Items (Movies or Episodes)
   */
  public async getLatestItems(parentId?: string, limit: number = 16): Promise<MediaItem[]> {
    if (!this.server.userId) return [];
    let path = `/Users/${this.server.userId}/Items/Latest?Limit=${limit}&Fields=Overview,PrimaryImageAspectRatio,UserData,MediaStreams`;
    if (parentId) path += `&ParentId=${parentId}`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return [];
    return await res.json();
  }

  /**
   * Query library items with options (search, sort, type, genres)
   */
  public async getItems(options: {
    parentId?: string;
    includeItemTypes?: string; // 'Movie' | 'Series' | 'Episode'
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    genres?: string;
    limit?: number;
    startIndex?: number;
  } = {}): Promise<{ items: MediaItem[]; total: number }> {
    if (!this.server.userId) return { items: [], total: 0 };
    
    const params = new URLSearchParams({
      Recursive: 'true',
      Fields: 'Overview,PrimaryImageAspectRatio,UserData,MediaStreams,Genres,CommunityRating,RunTimeTicks,ProductionYear,Taglines',
      Limit: String(options.limit || 30),
      StartIndex: String(options.startIndex || 0),
    });

    if (options.parentId) params.append('ParentId', options.parentId);
    if (options.includeItemTypes) params.append('IncludeItemTypes', options.includeItemTypes);
    if (options.searchTerm) params.append('SearchTerm', options.searchTerm);
    if (options.sortBy) params.append('SortBy', options.sortBy);
    if (options.sortOrder) params.append('SortOrder', options.sortOrder);
    if (options.genres) params.append('Genres', options.genres);

    const path = `/Users/${this.server.userId}/Items?${params.toString()}`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    return {
      items: data.Items || [],
      total: data.TotalRecordCount || 0,
    };
  }

  /**
   * Get single item details
   */
  public async getItem(itemId: string): Promise<MediaItem | null> {
    if (!this.server.userId) return null;
    const path = `/Users/${this.server.userId}/Items/${itemId}`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Get Seasons for a TV Series
   */
  public async getSeasons(seriesId: string): Promise<SeasonInfo[]> {
    if (!this.server.userId) return [];
    const path = `/Shows/${seriesId}/Seasons?UserId=${this.server.userId}&Fields=ItemCounts,PrimaryImageAspectRatio`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.Items || [];
  }

  /**
   * Get Episodes for a Season or Series
   */
  public async getEpisodes(seriesId: string, seasonId?: string): Promise<MediaItem[]> {
    if (!this.server.userId) return [];
    let path = `/Shows/${seriesId}/Episodes?UserId=${this.server.userId}&Fields=Overview,PrimaryImageAspectRatio,UserData,MediaStreams`;
    if (seasonId) path += `&SeasonId=${seasonId}`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.Items || [];
  }

  /**
   * Get item image URL
   */
  public getImageUrl(itemId: string, type: 'Primary' | 'Backdrop' | 'Thumb' = 'Primary', maxWidth: number = 600): string {
    const rawPath = `/Items/${itemId}/Images/${type}?maxWidth=${maxWidth}&quality=90`;
    return this.buildRequestUrl(rawPath);
  }

  /**
   * Get video streaming URL for an item
   */
  public getStreamUrl(itemId: string, mediaSourceId?: string): string {
    const params = new URLSearchParams({
      Static: 'true',
      mediaSourceId: mediaSourceId || itemId,
      DeviceId: 'yamby-web-client-v1',
    });

    if (this.server.token) {
      params.append('api_key', this.server.token);
    }

    const rawPath = `/Videos/${itemId}/stream.mp4?${params.toString()}`;
    return this.buildRequestUrl(rawPath);
  }

  /**
   * Report playback started to Emby
   */
  public async reportPlaybackStart(itemId: string): Promise<void> {
    try {
      const url = this.buildRequestUrl('/Sessions/Playing');
      await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ItemId: itemId,
          CanSeek: true,
          PlayMethod: 'DirectPlay',
        }),
      });
    } catch {}
  }

  /**
   * Report playback progress to Emby (ticks: 1s = 10,000,000 ticks)
   */
  public async reportPlaybackProgress(itemId: string, positionSeconds: number, isPaused: boolean = false): Promise<void> {
    try {
      const ticks = Math.floor(positionSeconds * 10000000);
      const url = this.buildRequestUrl('/Sessions/Playing/Progress');
      await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ItemId: itemId,
          PositionTicks: ticks,
          IsPaused: isPaused,
          PlayMethod: 'DirectPlay',
        }),
      });
    } catch {}
  }

  /**
   * Report playback stopped to Emby
   */
  public async reportPlaybackStopped(itemId: string, positionSeconds: number): Promise<void> {
    try {
      const ticks = Math.floor(positionSeconds * 10000000);
      const url = this.buildRequestUrl('/Sessions/Playing/Stopped');
      await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ItemId: itemId,
          PositionTicks: ticks,
        }),
      });
    } catch {}
  }

  /**
   * Mark item as watched / unwatched
   */
  public async togglePlayed(itemId: string, markAsPlayed: boolean): Promise<boolean> {
    if (!this.server.userId) return false;
    const method = markAsPlayed ? 'POST' : 'DELETE';
    const path = `/Users/${this.server.userId}/PlayedItems/${itemId}`;
    const url = this.buildRequestUrl(path);
    const res = await fetch(url, {
      method,
      headers: this.getAuthHeaders(),
    });
    return res.ok;
  }
}
