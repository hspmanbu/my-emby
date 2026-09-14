import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  Volume1,
  VolumeX,
  Sun,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  RotateCcw,
  FastForward,
  Rewind,
  Settings,
  SkipForward,
  Tv,
  Subtitles,
  AudioLines,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { MediaItem, PlaybackGestureState, EmbyServerConfig } from '../types';
import { EmbyApiClient } from '../services/embyApi';

interface YambyPlayerProps {
  item: MediaItem;
  server: EmbyServerConfig;
  streamUrl: string;
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export const YambyPlayer: React.FC<YambyPlayerProps> = ({
  item,
  server,
  streamUrl,
  onClose,
  onNextEpisode,
  hasNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [previousRate, setPreviousRate] = useState(1.0);

  // Settings & Audio/Subtitle
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(1.0); // 0.2 to 1.5
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'cover' | 'fill' | '21:9'>('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Tracks
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);

  // Gestures state
  const [gestureState, setGestureState] = useState<PlaybackGestureState>({
    type: 'none',
    value: 0,
    startX: 0,
    startY: 0,
    active: false,
  });
  const [doubleTapRipple, setDoubleTapRipple] = useState<'left' | 'right' | null>(null);
  const [isLongPressing2x, setIsLongPressing2x] = useState(false);

  // Refs for tracking touches & timers
  const controlsTimeoutRef = useRef<number | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const gestureStartValuesRef = useRef({ brightness: 1.0, volume: 0.8, time: 0 });
  const isDraggingRef = useRef(false);

  const embyClient = useRef(new EmbyApiClient(server)).current;

  // Format time (HH:MM:SS or MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset controls hide timer
  const triggerControls = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSpeedMenu(false);
      setShowTrackMenu(false);
    }, 4000);
  }, [isLocked]);

  // Initial resume position from item UserData if exists
  useEffect(() => {
    const resumeTicks = item.UserData?.PlaybackPositionTicks;
    if (resumeTicks && resumeTicks > 0 && videoRef.current) {
      const resumeSecs = resumeTicks / 10000000;
      videoRef.current.currentTime = resumeSecs;
      setCurrentTime(resumeSecs);
    }

    embyClient.reportPlaybackStart(item.Id);

    // Periodic progress report to Emby server
    const interval = window.setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        embyClient.reportPlaybackProgress(item.Id, videoRef.current.currentTime, false);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (videoRef.current) {
        embyClient.reportPlaybackStopped(item.Id, videoRef.current.currentTime);
      }
    };
  }, [item.Id]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0) {
      const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(end);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.volume = volume;
    // Auto-play
    videoRef.current.play().catch(() => setIsPlaying(false));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    triggerControls();
  };

  const handleSeekScrubber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const quickSkip = (delta: number) => {
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ==========================================
  // YAMBY SIGNATURE GESTURE CONTROLS ENGINE
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    isDraggingRef.current = false;
    gestureStartValuesRef.current = {
      brightness,
      volume,
      time: videoRef.current ? videoRef.current.currentTime : 0,
    };

    setGestureState({
      type: 'none',
      value: 0,
      startX: x,
      startY: y,
      active: true,
    });

    // Setup Long-press detector for 2.0x playback speed
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (!isDraggingRef.current && videoRef.current && !videoRef.current.paused) {
        setIsLongPressing2x(true);
        setPreviousRate(videoRef.current.playbackRate);
        videoRef.current.playbackRate = 2.0;
        setPlaybackRate(2.0);
        setGestureState((prev) => ({
          ...prev,
          type: 'fastForward',
          value: 2.0,
          displayVal: '2.0X 极速快进',
        }));
      }
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!gestureState.active || isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - gestureState.startX;
    const deltaY = y - gestureState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Cancel long press if user moves pointer
    if (absX > 10 || absY > 10) {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      isDraggingRef.current = true;
    }

    if (!isDraggingRef.current) return;

    const width = rect.width;
    const height = rect.height;

    // Detect gesture direction if not locked into one
    let activeType = gestureState.type;

    if (activeType === 'none') {
      if (absX > absY && absX > 15) {
        activeType = 'seek';
      } else if (absY > absX && absY > 15) {
        // Left 45% = Brightness, Right 45% = Volume
        if (gestureState.startX < width * 0.45) {
          activeType = 'brightness';
        } else if (gestureState.startX > width * 0.55) {
          activeType = 'volume';
        }
      }
    }

    if (activeType === 'brightness') {
      // Swiping UP increases brightness, DOWN decreases
      const deltaPercent = -deltaY / (height * 0.6);
      const newBright = Math.max(0.2, Math.min(1.5, gestureStartValuesRef.current.brightness + deltaPercent));
      setBrightness(newBright);
      setGestureState((prev) => ({
        ...prev,
        type: 'brightness',
        value: Math.round(((newBright - 0.2) / 1.3) * 100),
        displayVal: `${Math.round(((newBright - 0.2) / 1.3) * 100)}%`,
      }));
    } else if (activeType === 'volume') {
      // Swiping UP increases volume, DOWN decreases
      const deltaPercent = -deltaY / (height * 0.6);
      const newVol = Math.max(0, Math.min(1.0, gestureStartValuesRef.current.volume + deltaPercent));
      setVolume(newVol);
      if (videoRef.current) {
        videoRef.current.volume = newVol;
        videoRef.current.muted = newVol === 0;
        setIsMuted(newVol === 0);
      }
      setGestureState((prev) => ({
        ...prev,
        type: 'volume',
        value: Math.round(newVol * 100),
        displayVal: `${Math.round(newVol * 100)}%`,
      }));
    } else if (activeType === 'seek' && duration > 0) {
      // Horizontal swipe = Seek
      const seekRatio = deltaX / width;
      // Seek range scaled up to ~90s across the width
      const seekDeltaSecs = Math.round(seekRatio * 90);
      const targetTime = Math.max(0, Math.min(duration, gestureStartValuesRef.current.time + seekDeltaSecs));
      setGestureState((prev) => ({
        ...prev,
        type: 'seek',
        value: targetTime,
        displayVal: `${seekDeltaSecs >= 0 ? '+' : ''}${seekDeltaSecs}s (${formatTime(targetTime)} / ${formatTime(duration)})`,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Revert 2x long-press speed if active
    if (isLongPressing2x) {
      setIsLongPressing2x(false);
      if (videoRef.current) {
        videoRef.current.playbackRate = previousRate;
        setPlaybackRate(previousRate);
      }
    }

    // If was seeking via horizontal gesture, apply seek
    if (gestureState.type === 'seek' && videoRef.current) {
      videoRef.current.currentTime = gestureState.value;
      setCurrentTime(gestureState.value);
    }

    // Handle Tap vs Double-Tap if not dragged
    if (!isDraggingRef.current && gestureState.type !== 'fastForward') {
      const now = Date.now();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (now - lastTapTimeRef.current < 300) {
        // Double tap!
        if (x < width * 0.35) {
          // Double tap left: Rewind 10s
          quickSkip(-10);
          setDoubleTapRipple('left');
          setTimeout(() => setDoubleTapRipple(null), 700);
        } else if (x > width * 0.65) {
          // Double tap right: Forward 10s
          quickSkip(10);
          setDoubleTapRipple('right');
          setTimeout(() => setDoubleTapRipple(null), 700);
        } else {
          // Double tap center: Play/pause
          togglePlay();
        }
        lastTapTimeRef.current = 0;
      } else {
        // Single tap: toggle HUD
        lastTapTimeRef.current = now;
        triggerControls();
      }
    }

    // Reset gesture state
    setGestureState({
      type: 'none',
      value: 0,
      startX: 0,
      startY: 0,
      active: false,
    });
    isDraggingRef.current = false;
  };

  // Video aspect ratio styling
  const getVideoStyle = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'object-cover w-full h-full';
      case 'fill':
        return 'object-fill w-full h-full';
      case '21:9':
        return 'object-contain w-full h-full scale-y-90';
      case 'fit':
      default:
        return 'object-contain w-full h-full';
    }
  };

  // Available audio and subtitle tracks from item
  const audioTracks = item.MediaStreams?.filter((s) => s.Type === 'Audio') || [];
  const subtitleTracks = item.MediaStreams?.filter((s) => s.Type === 'Subtitle') || [];

  return (
    <div
      ref={containerRef}
      id="yamby-player-fullscreen-container"
      className="fixed inset-0 z-50 bg-black text-white select-none overflow-hidden touch-none"
      onMouseMove={triggerControls}
    >
      {/* Video element with brightness overlay */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          id="yamby-html5-video"
          src={streamUrl}
          className={`${getVideoStyle()} transition-transform duration-200`}
          style={{ filter: `brightness(${brightness})` }}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNextEpisode && onNextEpisode) {
              onNextEpisode();
            }
          }}
        />

        {/* Gesture Detection Overlay */}
        <div
          id="yamby-player-gesture-overlay"
          className="absolute inset-0 cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Double Tap Ripples */}
        {doubleTapRipple === 'left' && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 p-6 rounded-full bg-white/15 backdrop-blur-md flex flex-col items-center animate-ping pointer-events-none">
            <Rewind className="w-10 h-10 text-white" />
            <span className="text-xs font-bold mt-1">-10秒</span>
          </div>
        )}
        {doubleTapRipple === 'right' && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 p-6 rounded-full bg-white/15 backdrop-blur-md flex flex-col items-center animate-ping pointer-events-none">
            <FastForward className="w-10 h-10 text-white" />
            <span className="text-xs font-bold mt-1">+10秒</span>
          </div>
        )}

        {/* Gesture HUD: Brightness (Left side) */}
        {gestureState.type === 'brightness' && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 flex flex-col items-center gap-3 w-16 pointer-events-none shadow-2xl">
            <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
            <div className="w-2.5 h-32 bg-white/20 rounded-full relative overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-amber-400 rounded-full transition-all duration-75"
                style={{ height: `${gestureState.value}%` }}
              />
            </div>
            <span className="text-xs font-bold font-mono text-amber-200">
              {gestureState.displayVal}
            </span>
          </div>
        )}

        {/* Gesture HUD: Volume (Right side) */}
        {gestureState.type === 'volume' && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 flex flex-col items-center gap-3 w-16 pointer-events-none shadow-2xl">
            {gestureState.value === 0 ? (
              <VolumeX className="w-6 h-6 text-red-400" />
            ) : gestureState.value < 50 ? (
              <Volume1 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Volume2 className="w-6 h-6 text-emerald-400" />
            )}
            <div className="w-2.5 h-32 bg-white/20 rounded-full relative overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${gestureState.value}%` }}
              />
            </div>
            <span className="text-xs font-bold font-mono text-emerald-200">
              {gestureState.displayVal}
            </span>
          </div>
        )}

        {/* Gesture HUD: Seek (Center) */}
        {gestureState.type === 'seek' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-4 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 flex flex-col items-center gap-2 pointer-events-none shadow-2xl min-w-[220px]">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <FastForward className="w-5 h-5" />
              <span>松开立即跳转</span>
            </div>
            <div className="text-lg font-bold font-mono tracking-wider text-white">
              {formatTime(gestureState.value)} / {formatTime(duration)}
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(gestureState.value / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Long Press 2.0x Fast Forward Banner */}
        {isLongPressing2x && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-emerald-600/90 text-white font-semibold text-xs flex items-center gap-2 backdrop-blur-md shadow-lg shadow-emerald-950/50 pointer-events-none animate-pulse">
            <FastForward className="w-4 h-4" />
            <span>长按 2.0X 极速播放中</span>
          </div>
        )}

        {/* Screen Lock Toggle Button (Always visible on left edge) */}
        <button
          id="btn-player-screen-lock"
          onClick={() => {
            setIsLocked(!isLocked);
            setShowControls(false);
          }}
          className={`absolute left-5 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full backdrop-blur-md border transition-all ${
            isLocked
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:scale-110 shadow-lg'
              : 'bg-black/40 text-neutral-400 border-white/10 hover:text-white hover:bg-black/60'
          }`}
          title={isLocked ? '点击解锁屏幕' : '锁定屏幕手势'}
        >
          {isLocked ? <Lock className="w-5 h-5 text-amber-400" /> : <Unlock className="w-5 h-5" />}
        </button>

        {/* Floating Controls HUD */}
        {!isLocked && (
          <div
            className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent -mx-4 -mt-4 p-4 sm:-mx-6 sm:-mt-6 sm:p-6">
              <div className="flex items-center gap-3">
                <button
                  id="btn-player-back"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-bold truncate max-w-[200px] sm:max-w-md text-white">
                    {item.Name}
                  </h1>
                  {item.SeriesName && (
                    <p className="text-xs text-neutral-400">
                      {item.SeriesName} {item.SeasonName} 第 {item.IndexNumber} 集
                    </p>
                  )}
                </div>
              </div>

              {/* Top Right Info & Ratio */}
              <div className="flex items-center gap-2">
                {/* Aspect ratio switch */}
                <button
                  id="btn-player-aspect-ratio"
                  onClick={() => {
                    const modes: Array<'fit' | 'cover' | 'fill' | '21:9'> = ['fit', 'cover', 'fill', '21:9'];
                    const nextIdx = (modes.indexOf(aspectRatio) + 1) % modes.length;
                    setAspectRatio(modes[nextIdx]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-neutral-200 transition-colors uppercase"
                >
                  比例: {aspectRatio}
                </button>

                {/* Gesture hint */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>左滑调亮 / 右滑音量 / 双击跳跃 / 长按2倍速</span>
                </div>
              </div>
            </div>

            {/* Center Play/Pause button if paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
                </button>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="pointer-events-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 sm:p-6 space-y-3">
              {/* Timeline Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-300 w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 group">
                  {/* Buffer bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-white/20 rounded-full pointer-events-none"
                    style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
                  />
                  {/* Progress input */}
                  <input
                    id="player-timeline-slider"
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.5"
                    value={currentTime}
                    onChange={handleSeekScrubber}
                    className="w-full h-1.5 bg-white/10 accent-emerald-500 rounded-full appearance-none cursor-pointer relative z-10 focus:outline-none"
                  />
                </div>
                <span className="text-xs font-mono text-neutral-400 w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls buttons row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    id="btn-player-play-toggle"
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>

                  <button
                    id="btn-player-rewind-10"
                    onClick={() => quickSkip(-10)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="快退 10 秒"
                  >
                    <Rewind className="w-5 h-5" />
                  </button>

                  <button
                    id="btn-player-forward-10"
                    onClick={() => quickSkip(10)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="快进 10 秒"
                  >
                    <FastForward className="w-5 h-5" />
                  </button>

                  {hasNextEpisode && onNextEpisode && (
                    <button
                      id="btn-player-next-episode"
                      onClick={onNextEpisode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>下一集</span>
                    </button>
                  )}

                  {/* Volume Control */}
                  <div className="hidden sm:flex items-center gap-2 ml-2">
                    <button
                      onClick={() => {
                        const newMuted = !isMuted;
                        setIsMuted(newMuted);
                        if (videoRef.current) videoRef.current.muted = newMuted;
                      }}
                      className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setIsMuted(val === 0);
                        if (videoRef.current) {
                          videoRef.current.volume = val;
                          videoRef.current.muted = val === 0;
                        }
                      }}
                      className="w-16 h-1 bg-white/20 accent-emerald-500 rounded-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Right controls: Speed, Audio/Subtitles, Fullscreen */}
                <div className="flex items-center gap-2 relative">
                  {/* Playback speed selector */}
                  <div className="relative">
                    <button
                      id="btn-player-speed-menu"
                      onClick={() => {
                        setShowSpeedMenu(!showSpeedMenu);
                        setShowTrackMenu(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-neutral-200 transition-colors flex items-center gap-1"
                    >
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{playbackRate}x</span>
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-[#14171d] border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[90px] z-50">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => {
                              setPlaybackRate(rate);
                              if (videoRef.current) videoRef.current.playbackRate = rate;
                              setShowSpeedMenu(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                              playbackRate === rate
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-neutral-300 hover:bg-white/10'
                            }`}
                          >
                            {rate.toFixed(2)}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio and Subtitles menu */}
                  {(audioTracks.length > 0 || subtitleTracks.length > 0) && (
                    <div className="relative">
                      <button
                        id="btn-player-tracks-menu"
                        onClick={() => {
                          setShowTrackMenu(!showTrackMenu);
                          setShowSpeedMenu(false);
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
                        title="音轨与字幕"
                      >
                        <Subtitles className="w-4 h-4" />
                      </button>

                      {showTrackMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-[#14171d] border border-white/10 rounded-xl p-3 shadow-2xl space-y-3 min-w-[200px] z-50">
                          {audioTracks.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
                                <AudioLines className="w-3 h-3 text-emerald-400" />
                                音轨选择
                              </div>
                              <div className="space-y-1">
                                {audioTracks.map((trk, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedAudioTrack(trk.Index)}
                                    className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                                      selectedAudioTrack === trk.Index
                                        ? 'bg-emerald-600 text-white font-medium'
                                        : 'text-neutral-300 hover:bg-white/10'
                                    }`}
                                  >
                                    {trk.DisplayTitle || trk.Language || `音轨 #${i + 1}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {subtitleTracks.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
                                <Subtitles className="w-3 h-3 text-emerald-400" />
                                字幕选择
                              </div>
                              <div className="space-y-1">
                                <button
                                  onClick={() => setSelectedSubtitleTrack(-1)}
                                  className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                                    selectedSubtitleTrack === -1
                                      ? 'bg-emerald-600 text-white font-medium'
                                      : 'text-neutral-300 hover:bg-white/10'
                                  }`}
                                >
                                  关闭字幕
                                </button>
                                {subtitleTracks.map((sub, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedSubtitleTrack(sub.Index)}
                                    className={`w-full text-left px-2 py-1 rounded text-xs truncate ${
                                      selectedSubtitleTrack === sub.Index
                                        ? 'bg-emerald-600 text-white font-medium'
                                        : 'text-neutral-300 hover:bg-white/10'
                                    }`}
                                  >
                                    {sub.DisplayTitle || sub.Language || `字幕 #${i + 1}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    id="btn-player-fullscreen-toggle"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
