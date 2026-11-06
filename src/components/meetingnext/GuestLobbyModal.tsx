import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Users, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScheduledMeeting } from '../../types/meetingnext';
import { createMicrophoneMeter } from '../../utils/audioTones';

interface GuestLobbyModalProps {
  meeting: ScheduledMeeting;
  initialName?: string;
  onJoin: (profile: { id: string; name: string; role: string }) => void;
  onCancel: () => void;
}

export const GuestLobbyModal: React.FC<GuestLobbyModalProps> = ({
  meeting,
  initialName,
  onJoin,
  onCancel,
}) => {
  const [displayName, setDisplayName] = useState(
    initialName || meeting.customerName || ''
  );
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;

    async function initPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Attach audio meter
        const meter = createMicrophoneMeter(stream, (level) => {
          if (active) setAudioLevel(level);
        });
        meterCleanupRef.current = meter.stop;
      } catch (err: any) {
        console.warn('Lobby camera/mic preview notice:', err?.message || err);
        setMediaError('Microphone or Camera access previewing in simulated mode.');
      }
    }

    initPreview();

    return () => {
      active = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (meterCleanupRef.current) {
        meterCleanupRef.current();
      }
    };
  }, []);

  // Sync mute state with stream
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !isMicMuted;
      });
    }
  }, [isMicMuted, mediaStream]);

  // Sync video state with stream
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => {
        t.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, mediaStream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = displayName.trim() || meeting.customerName || 'Guest Attendee';

    // Stop lobby stream so MeetingRoomModal can claim exclusive hardware access
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (meterCleanupRef.current) {
      meterCleanupRef.current();
    }

    onJoin({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      role: 'Attendee',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>MeetingNext Video Room</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Room: {meeting.id}
                </span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>ap-south-1 (Mumbai) Encrypted WebRTC Session</span>
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Two-Column Google Meet / Zoom Style Lobby */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Camera & Microphone Preview */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="w-full aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center shadow-lg">
              {isVideoOff ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 mb-2 shadow-inner">
                    {(displayName || meeting.customerName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-400">Camera is turned off</span>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* In-Preview Controls */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-3 rounded-full shadow-lg transition-transform active:scale-95 ${
                    isMicMuted
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-3 rounded-full shadow-lg transition-transform active:scale-95 ${
                    isVideoOff
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>

              {/* Audio Volume Bar */}
              {!isMicMuted && (
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded-md flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {mediaError && (
              <p className="text-[11px] text-amber-300 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>{mediaError}</span>
              </p>
            )}
          </div>

          {/* Right: Meeting Info & Join as Attendee Form */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-5">
            <div>
              <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider font-semibold">
                Scheduled Consultation
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{meeting.reason}</h2>
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Meeting Host:</span>
                  <span className="font-semibold text-white">Sarthak Jain, CFA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Host Role:</span>
                  <span className="text-rose-400 font-medium">Senior Relationship Manager</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Your Role:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Attendee / Guest
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={meeting.customerName || 'e.g. David Sterling'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  This name will appear on your video tile in the room.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Join Meeting as Attendee</span>
              </button>
            </form>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
              Everyone using this link joins the <strong>exact same meeting room</strong>.
              Sarthak Jain, CFA manages the host controls.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
