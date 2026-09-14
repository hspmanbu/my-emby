import { DynamicPortResponse, EmbyServerConfig } from '../types';

export const DEFAULT_PORT_SYNC_URL = 'http://lac.hesip.top:8080/port';
export const DEFAULT_PORT_SERVICE_NAME = 'emby-nginx';

/**
 * Fetch dynamic port through our server-side proxy
 * This resolves Mixed Content (HTTPS -> HTTP) and CORS obstacles seamlessly.
 */
export async function fetchDynamicPort(
  portUrl: string = DEFAULT_PORT_SYNC_URL,
  serviceName: string = DEFAULT_PORT_SERVICE_NAME
): Promise<DynamicPortResponse> {
  try {
    const encodedUrl = encodeURIComponent(portUrl.trim());
    const encodedService = encodeURIComponent(serviceName.trim());
    const res = await fetch(`/api/port-sync?url=${encodedUrl}&service=${encodedService}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `HTTP ${res.status}: 无法获取端口服务数据`,
      };
    }

    const data: DynamicPortResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '网络连接失败，请检查端口解析地址是否可访问',
    };
  }
}

/**
 * Helper to update server configuration with new resolved port
 */
export function applyResolvedPort(
  server: EmbyServerConfig,
  resolved: DynamicPortResponse
): { updatedServer: EmbyServerConfig; changed: boolean } {
  if (!resolved.success || !resolved.port) {
    return { updatedServer: server, changed: false };
  }

  const oldPort = server.port;
  const changed = oldPort !== resolved.port;

  const updatedServer: EmbyServerConfig = {
    ...server,
    port: resolved.port,
    lastSyncedPort: resolved.port,
    lastSyncedAt: resolved.updatedAt || new Date().toISOString(),
    // If host was not explicitly customized or matches old resolved host, update host if available
    host: resolved.host || server.host,
  };

  return { updatedServer, changed };
}
