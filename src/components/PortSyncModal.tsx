import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Server, Radio, ArrowRight, ExternalLink, X, ShieldAlert, Cpu } from 'lucide-react';
import { DynamicPortResponse, EmbyServerConfig } from '../types';
import { fetchDynamicPort, applyResolvedPort } from '../services/portSync';

interface PortSyncModalProps {
  server: EmbyServerConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateServer: (updated: EmbyServerConfig) => void;
}

export const PortSyncModal: React.FC<PortSyncModalProps> = ({
  server,
  isOpen,
  onClose,
  onUpdateServer,
}) => {
  const [portUrl, setPortUrl] = useState(server.portSyncUrl || 'http://lac.hesip.top:8080/port');
  const [serviceName, setServiceName] = useState(server.portSyncService || 'emby-nginx');
  const [autoSync, setAutoSync] = useState(server.autoSyncPort ?? true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DynamicPortResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchPort = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await fetchDynamicPort(portUrl, serviceName);
      setResult(data);
      if (data.success && data.port) {
        setSuccessMsg(`成功获取端口: ${data.port}（服务: ${data.service}）`);
      } else {
        setErrorMsg(data.error || '未能在该地址中找到对应服务名称');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '端口解析请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    let updated = {
      ...server,
      portSyncUrl: portUrl.trim(),
      portSyncService: serviceName.trim(),
      autoSyncPort: autoSync,
    };

    if (result && result.success && result.port) {
      const { updatedServer } = applyResolvedPort(updated, result);
      updated = updatedServer;
    }

    onUpdateServer(updated);
    onClose();
  };

  const handleSelectServiceFromList = (entryName: string, entryPort: number) => {
    setServiceName(entryName);
    setSuccessMsg(`已选择服务: ${entryName}，对应端口: ${entryPort}`);
  };

  return (
    <div id="port-sync-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div id="port-sync-modal-card" className="relative w-full max-w-2xl bg-[#14171d] border border-white/10 rounded-2xl p-6 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">动态端口自动更新设置</h2>
              <p className="text-xs text-neutral-400">无公网IP穿透神器：自动获取并替换Emby远程端口</p>
            </div>
          </div>
          <button
            id="close-port-sync-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Target URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              端口发布页面 URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={portUrl}
                onChange={(e) => setPortUrl(e.target.value)}
                placeholder="例如: http://lac.hesip.top:8080/port"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              * 支持 HTML 表格或 JSON 结构，由服务端代理安全抓取，完全解决 HTTPS 混合内容与 CORS 跨域问题。
            </p>
          </div>

          {/* Service Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                目标服务名称（匹配项）
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="例如: emby-nginx"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                当前配置端口 / 状态
              </label>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-emerald-300">{server.port || '未配置'}</span>
                {server.lastSyncedAt && (
                  <span className="text-[11px] text-neutral-400 ml-auto">
                    上次: {new Date(server.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Auto-sync Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <div className="text-sm font-medium text-neutral-200">每次访问应用自动更新</div>
              <div className="text-xs text-neutral-400">启动应用或刷新界面时自动检查最新穿透端口</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Action: Test & Fetch */}
          <div className="flex items-center gap-3 pt-1">
            <button
              id="btn-fetch-port-now"
              type="button"
              onClick={handleFetchPort}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '正在抓取端口中...' : '立刻抓取最新端口'}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Success Result Box */}
          {result && result.success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  已匹配服务: {result.service}
                </span>
                <span className="text-emerald-300 font-mono text-sm font-bold">
                  端口: {result.port}
                </span>
              </div>
              <div className="text-neutral-300 grid grid-cols-2 gap-2 font-mono">
                <div>解析主机: {result.host || result.ip || '未提供'}</div>
                <div>更新时间: {result.updatedAt || '刚刚'}</div>
              </div>
              {result.resolvedUrl && (
                <div className="text-neutral-400 text-[11px] truncate">
                  穿透访问链接: {result.resolvedUrl}
                </div>
              )}
            </div>
          )}

          {/* Remote Services List */}
          {result && result.allEntries && result.allEntries.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                在该端口地址检测到的所有穿透服务（可点击直接切换）：
              </div>
              <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 bg-black/20 text-xs font-mono">
                {result.allEntries.map((item, idx) => {
                  const isCurrent = item.name.toLowerCase() === serviceName.toLowerCase();
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectServiceFromList(item.name, item.port)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'hover:bg-white/5 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-semibold">{item.name}</span>
                        {item.ip && <span className="text-neutral-500 text-[11px]">({item.ip})</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                          :{item.port}
                        </span>
                        {isCurrent ? (
                          <span className="text-[10px] text-emerald-400 font-sans">当前选中</span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-sans hover:text-white">选择</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
          >
            取消
          </button>
          <button
            id="btn-save-port-sync"
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-2"
          >
            保存并应用配置
          </button>
        </div>
      </div>
    </div>
  );
};
