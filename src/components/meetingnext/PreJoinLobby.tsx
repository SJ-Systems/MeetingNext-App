import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  ShieldCheck,
  Lock,
  User,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ScheduledMeeting } from '../../types/meetingnext';
import { createMicrophoneMeter } from '../../utils/audioTones';

interface PreJoinLobbyProps {
  meeting: ScheduledMeeting;
  onJoinAsAttendee: (displayName: string, initialMicMuted: boolean, initialVideoOff: boolean) => void;
  onJoinAsHost: () => void;
}

export const PreJoinLobby: React.FC<PreJoinLobbyProps> = ({
  meeting,
  onJoinAsAttendee,
  onJoinAsHost,
}) => {
  const [displayName, setDisplayName] = useState(meeting.customerName || '');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<{
    videoInputs: MediaDeviceInfo[];
    audioInputs: MediaDeviceInfo[];
  }>({ videoInputs: [], audioInputs: [] });
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);

  // Initialize camera & mic for preview
  useEffect(() => {
    let active = true;

    async function startPreview() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Live mic level
        const meter = createMicrophoneMeter(mediaStream, (lvl) => {
          if (active) setAudioLevel(lvl);
        });
        meterCleanupRef.current = meter.stop;

        // Enumerate
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (active) {
          setAvailableDevices({
            videoInputs: devices.filter((d) => d.kind === 'videoinput'),
            audioInputs: devices.filter((d) => d.kind === 'audioinput'),
          });
        }
      } catch (err) {
        console.warn('Lobby preview note:', err);
      }
    }

    startPreview();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (meterCleanupRef.current) {
        meterCleanupRef.current();
      }
    };
  }, [selectedVideoId, selectedAudioId]);

  // Bind video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  const toggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
  };

  const toggleVideo = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = displayName.trim() || meeting.customerName || 'Guest Attendee';
    // Stop local preview tracks so MeetingRoomModal can acquire the session stream cleanly
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (meterCleanupRef.current) {
      meterCleanupRef.current();
    }
    onJoinAsAttendee(finalName, isMicMuted, isVideoOff);
  };

  const handleHostClick = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (meterCleanupRef.current) {
      meterCleanupRef.current();
    }
    onJoinAsHost();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">MeetingNext</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
              Amazon Chime SDK · ap-south-1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-bit TLS / SRTP Encrypted</span>
        </div>
      </header>

      {/* Main Container: Google Meet / Zoom Style Side-by-Side Lobby */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-12">
        {/* Left Side: Video Preview & Device Controls */}
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="w-full aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
            {isVideoOff ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 mb-2 shadow-inner">
                  {displayName.trim() ? displayName.slice(0, 2).toUpperCase() : <User className="w-8 h-8 text-slate-500" />}
                </div>
                <span className="text-xs text-slate-400">Camera is off</span>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Bottom floating preview toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-all shadow-md ${
                  isMicMuted
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all shadow-md ${
                  isVideoOff
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-rose-400" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl transition-all shadow-md ${
                  showSettings ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Audio and video settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Top status tag */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMicMuted ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{isMicMuted ? 'Mic Muted' : 'Mic Ready'}</span>
              {!isMicMuted && (
                <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden ml-1">
                  <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${audioLevel}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Device Settings Popdown */}
          {showSettings && (
            <div className="w-full mt-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Camera</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Default Integrated Camera</option>
                  {availableDevices.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera (${d.deviceId.slice(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Microphone</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Default Microphone Array</option>
                  {availableDevices.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone (${d.deviceId.slice(0, 6)})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Meeting Information & Join Form */}
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Ready to Join Meeting</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
              {meeting.reason}
            </h1>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
              <span>Hosted by</span>
              <strong className="text-white">Sarthak Jain, CFA</strong>
              <span className="text-[11px] font-mono bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                Host
              </span>
            </p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Scheduled Date & Time:</span>
              <span className="text-slate-200 font-medium">{meeting.date} at {meeting.time}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Meeting Room ID:</span>
              <span className="text-emerald-400 font-mono font-medium">{meeting.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Your Role:</span>
              <span className="text-cyan-300 font-semibold">Attendee / Guest</span>
            </div>
          </div>

          {/* Name input and Join Button */}
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                What's your name?
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Other participants in the room will see this name.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white rounded-2xl text-sm font-semibold transition-all shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join Meeting as Attendee</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secondary Link for the Host */}
          <div className="pt-2 border-t border-slate-900 text-center">
            <p className="text-xs text-slate-400">
              Are you the host of this session?{' '}
              <button
                type="button"
                onClick={handleHostClick}
                className="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2 ml-1"
              >
                Sign in as Sarthak Jain, CFA (Host)
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
