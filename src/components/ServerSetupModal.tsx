import React, { useState, useEffect } from 'react';
import { Server, Key, User, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, X, Sparkles, Network } from 'lucide-react';
import { EmbyServerConfig, EmbyUser } from '../types';
import { EmbyApiClient } from '../services/embyApi';
import { fetchDynamicPort, applyResolvedPort } from '../services/portSync';

interface ServerSetupModalProps {
  currentServer: EmbyServerConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveServer: (server: EmbyServerConfig, andLogin?: boolean) => void;
  onSwitchToDemo: () => void;
}

export const ServerSetupModal: React.FC<ServerSetupModalProps> = ({
  currentServer,
  isOpen,
  onClose,
  onSaveServer,
  onSwitchToDemo,
}) => {
  const [host, setHost] = useState(currentServer.host || 'jia.hesip.cn');
  const [port, setPort] = useState<number>(currentServer.port || 57615);
  const [useSsl, setUseSsl] = useState(currentServer.useSsl || false);
  const [useProxy, setUseProxy] = useState(currentServer.useProxy ?? true);
  const [portSyncUrl, setPortSyncUrl] = useState(currentServer.portSyncUrl || 'http://lac.hesip.top:8080/port');
  const [portSyncService, setPortSyncService] = useState(currentServer.portSyncService || 'emby-nginx');
  const [autoSyncPort, setAutoSyncPort] = useState(currentServer.autoSyncPort ?? true);

  const [username, setUsername] = useState(currentServer.userName || '');
  const [password, setPassword] = useState('');
  const [publicUsers, setPublicUsers] = useState<EmbyUser[]>([]);

  const [testing, setTesting] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPublicUsers();
    }
  }, [isOpen, host, port, useProxy, useSsl]);

  if (!isOpen) return null;

  const tempServerConfig: EmbyServerConfig = {
    ...currentServer,
    host: host.trim(),
    port: Number(port),
    useSsl,
    useProxy,
    portSyncUrl: portSyncUrl.trim(),
    portSyncService: portSyncService.trim(),
    autoSyncPort,
  };

  const loadPublicUsers = async () => {
    try {
      const client = new EmbyApiClient(tempServerConfig);
      const users = await client.getPublicUsers();
      if (users && users.length > 0) {
        setPublicUsers(users);
      }
    } catch {}
  };

  const handleFetchAndUpdatePort = async () => {
    setTesting(true);
    setStatusMsg({ type: 'info', text: '正在访问端口服务地址并获取最新端口...' });
    try {
      const resolved = await fetchDynamicPort(portSyncUrl, portSyncService);
      if (resolved.success && resolved.port) {
        setPort(resolved.port);
        if (resolved.host) setHost(resolved.host);
        
        // Test emby connectivity with new port
        const testClient = new EmbyApiClient({
          ...tempServerConfig,
          port: resolved.port,
          host: resolved.host || host,
        });

        const sysInfo = await testClient.getPublicSystemInfo().catch(() => null);
        if (sysInfo) {
          setStatusMsg({
            type: 'success',
            text: `已更新端口为 ${resolved.port}！成功连接 Emby 服务器: ${sysInfo.ServerName} (v${sysInfo.Version})`,
          });
        } else {
          setStatusMsg({
            type: 'success',
            text: `已更新端口为 ${resolved.port} (${resolved.service})`,
          });
        }
        await loadPublicUsers();
      } else {
        setStatusMsg({
          type: 'error',
          text: resolved.error || '未能解析到端口号',
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || '端口获取失败' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMsg({ type: 'info', text: '正在测试连接服务器...' });
    try {
      const client = new EmbyApiClient(tempServerConfig);
      const sysInfo = await client.getPublicSystemInfo();
      setStatusMsg({
        type: 'success',
        text: `连接成功！Emby 服务器: ${sysInfo.ServerName || '在线'} (版本: ${sysInfo.Version || '未知'})`,
      });
      await loadPublicUsers();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `连接失败: ${err.message}。建议检查端口或尝试点击“自动获取最新端口”。`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMsg({ type: 'error', text: '请输入用户名' });
      return;
    }

    setLoggingIn(true);
    setStatusMsg({ type: 'info', text: '正在登录...' });

    try {
      const client = new EmbyApiClient(tempServerConfig);
      const auth = await client.authenticate(username.trim(), password);

      const updatedServer: EmbyServerConfig = {
        ...tempServerConfig,
        token: auth.token,
        userId: auth.user.Id,
        userName: auth.user.Name,
        userAvatar: auth.user.PrimaryImageTag,
      };

      onSaveServer(updatedServer, true);
      onClose();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || '登录失败，请检查用户名或密码',
      });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSelectUser = (u: EmbyUser) => {
    setUsername(u.Name);
    setPassword('');
    const pwInput = document.getElementById('emby-password-input');
    if (pwInput) pwInput.focus();
  };

  return (
    <div id="server-setup-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div id="server-setup-modal-card" className="relative w-full max-w-xl bg-[#14171d] border border-white/10 rounded-2xl p-6 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Emby 服务器与登录</h2>
              <p className="text-xs text-neutral-400">配置内网穿透端口与用户凭证</p>
            </div>
          </div>
          <button
            id="close-server-setup-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Server Connection details */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                服务器网络配置
              </span>
              <button
                type="button"
                onClick={handleFetchAndUpdatePort}
                disabled={testing}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                根据穿透地址自动更新端口
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">主机名 / IP</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="jia.hesip.cn"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">端口</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="57615"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic port config shortcut */}
            <div className="text-[11px] text-neutral-400 bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-neutral-300">
                <span>端口发布地址:</span>
                <span className="font-mono text-emerald-400/90">{portSyncUrl}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>穿透服务名:</span>
                <span className="font-mono text-emerald-400/90">{portSyncService}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs text-neutral-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                  />
                  <span>安全代理模式 (推荐，防跨域/防混合内容)</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-neutral-200 transition-colors"
              >
                测试连接
              </button>
            </div>
          </div>

          {/* Public Users on this server */}
          {publicUsers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                已探测到服务器公开用户（点击快速选择）：
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {publicUsers.map((u) => {
                  const isSelected = username.toLowerCase() === u.Name.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={u.Id}
                      onClick={() => handleSelectUser(u)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.08] text-neutral-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-xs text-emerald-400">
                        {u.Prefix || u.Name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full">{u.Name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="例如: tv 或 cjp"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                密码（若未设密码可留空）
              </label>
              <div className="relative">
                <input
                  id="emby-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}
            >
              {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
              {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
              {statusMsg.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-blue-400" />}
              <div>{statusMsg.text}</div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSwitchToDemo}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              无需密码直接体验演示库
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
              >
                取消
              </button>
              <button
                id="btn-login-emby"
                type="submit"
                disabled={loggingIn}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '保存并登录'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
