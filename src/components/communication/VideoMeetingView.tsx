import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  Radio,
  FileText,
  Lock,
  Volume2,
  Sparkles,
  PhoneOff,
  LayoutGrid,
  Maximize2,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Smile,
  ShieldAlert,
  Send,
  X,
  Paperclip,
  Check
} from 'lucide-react';
import { MeetingItem, CustomerRecord, RelationshipManager } from '../../types/crm';
import { createMicrophoneMeter } from '../../utils/audioTones';
import { LiveSpeechEngine, redactFinancialPII } from '../../utils/speechRecognition';
import { api } from '../../services/api';

interface VideoMeetingViewProps {
  meeting: MeetingItem;
  customer?: CustomerRecord | null;
  currentRM: RelationshipManager;
  onLeaveMeeting: () => void;
  onEndMeeting: (meetingId: string, durationSeconds: number) => void;
  onViewAiAnalysis: (meetingId: string) => void;
}

export const VideoMeetingView: React.FC<VideoMeetingViewProps> = ({
  meeting,
  customer,
  currentRM,
  onLeaveMeeting,
  onEndMeeting,
  onViewAiAnalysis,
}) => {
  // Pre-call Preview State vs In-Meeting State
  const [inPreCallPreview, setInPreCallPreview] = useState(true);

  // Local Media Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);

  // Device Enumeration
  const [availableCams, setAvailableCams] = useState<MediaDeviceInfo[]>([]);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Layout & Active Speaker
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight' | 'presentation'>('grid');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('customer');

  // Drawers
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'participants' | 'crm' | 'transcripts' | null>(null);

  // Captions
  const [showCaptions, setShowCaptions] = useState(true);
  const [liveCaptions, setLiveCaptions] = useState<{ speaker: string; text: string; id: string }[]>([
    {
      id: 'cap_1',
      speaker: 'David Sterling',
      text: 'Good morning Sarah, I am ready to review the commercial refinance terms.',
    },
  ]);

  // In-Meeting Chat
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; role: string; text: string; time: string; isAttachment?: boolean }[]
  >([
    {
      id: 'msg_1',
      sender: currentRM.name,
      role: 'Relationship Manager',
      text: 'Welcome David! Elena Rostova from compliance has joined as passive auditor.',
      time: '10:01 AM',
    },
    {
      id: 'msg_2',
      sender: 'David Sterling',
      role: 'Client',
      text: 'Great, ready to confirm the 5.15% 7-year rate lock.',
      time: '10:02 AM',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Recording State & Consent Modal (Section 9)
  const [isRecording, setIsRecording] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Meeting Duration Timer
  const [meetingSeconds, setMeetingSeconds] = useState(0);

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);
  const speechEngineRef = useRef<LiveSpeechEngine | null>(null);

  // 1. Device Enumeration & Initialization
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setAvailableCams(cams);
        setAvailableMics(mics);
        if (cams[0]) setSelectedCamId(cams[0].deviceId);
        if (mics[0]) setSelectedMicId(mics[0].deviceId);
      } catch (err) {
        console.warn('Device enumeration note:', err);
      }
    }

    getDevices();
  }, []);

  // 2. Local Media Stream Setup
  useEffect(() => {
    let active = true;

    async function initStream() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true,
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);

        if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Level analyzer
        const meter = createMicrophoneMeter(stream, (level) => {
          if (active) {
            setLocalAudioLevel(level);
            if (level > 25) setActiveSpeakerId('local');
          }
        });
        meterCleanupRef.current = meter.stop;
      } catch (err) {
        console.warn('Microphone/Camera access note:', err);
      }
    }

    initStream();

    return () => {
      active = false;
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (meterCleanupRef.current) meterCleanupRef.current();
    };
  }, [selectedCamId, selectedMicId]);

  // Update video element when joining or toggling video
  useEffect(() => {
    if (!inPreCallPreview && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [inPreCallPreview, localStream, isVideoOff]);

  // Speech Recognition Live Captions
  useEffect(() => {
    if (!inPreCallPreview) {
      speechEngineRef.current = new LiveSpeechEngine();
      speechEngineRef.current.start((text, isFinal) => {
        if (isFinal && text.trim().length > 0) {
          const { sanitized, hasPII } = redactFinancialPII(text);
          setLiveCaptions((prev) => [
            ...prev.slice(-3),
            {
              id: `cap_${Date.now()}`,
              speaker: currentRM.name.split(',')[0],
              text: sanitized,
            },
          ]);
        }
      });
    }

    return () => {
      if (speechEngineRef.current) speechEngineRef.current.stop();
    };
  }, [inPreCallPreview]);

  // Meeting & Recording Timers
  useEffect(() => {
    let timer: number;
    if (!inPreCallPreview) {
      timer = window.setInterval(() => {
        setMeetingSeconds((prev) => prev + 1);
        if (isRecording) {
          setRecordingSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inPreCallPreview, isRecording]);

  // Handlers
  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    }
    setIsMicMuted(!isMicMuted);
  };

  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      setLayoutMode('grid');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setScreenStream(stream);
        setIsScreenSharing(true);
        setLayoutMode('presentation');

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          setLayoutMode('grid');
        };
      } catch (err) {
        console.warn('Screen share canceled:', err);
      }
    }
  };

  const handleStartRecordingWithConsent = () => {
    if (!consentAcknowledged) {
      setShowConsentModal(true);
    } else {
      setIsRecording(!isRecording);
      if (!isRecording) {
        api.startRecording(meeting.id);
      } else {
        api.stopRecording(meeting.id);
      }
    }
  };

  const handleConfirmConsent = () => {
    setConsentAcknowledged(true);
    setShowConsentModal(false);
    setIsRecording(true);
    api.startRecording(meeting.id);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { sanitized } = redactFinancialPII(chatInput);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: currentRM.name.split(',')[0],
        role: 'RM Desk',
        text: sanitized,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // View 1: Pre-Call Preview Screen (Device testing, Camera, Mic test)
  // ---------------------------------------------------------------------------
  if (inPreCallPreview) {
    return (
      <div className="flex-1 bg-slate-950 text-slate-100 flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-800 px-2.5 py-1 rounded">
              Amazon Chime SDK Meetings
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight mt-2">{meeting.title}</h1>
            <p className="text-xs text-slate-400">
              Customer: <strong className="text-slate-200">{meeting.customerName}</strong> · Ref:{' '}
              <strong className="text-slate-200 font-mono">{meeting.internalReference}</strong>
            </p>
          </div>

          {/* Video Preview Box */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {isVideoOff ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white mb-2">
                  {currentRM.avatar}
                </div>
                <span className="text-xs text-slate-300 font-medium">Camera is turned off</span>
              </div>
            ) : (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* In-Preview Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <button
                onClick={handleToggleMic}
                className={`p-2.5 rounded-full transition-colors ${
                  isMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:text-white'
                }`}
                title={isMicMuted ? 'Unmute' : 'Mute'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={handleToggleVideo}
                className={`p-2.5 rounded-full transition-colors ${
                  isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:text-white'
                }`}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                className="p-2.5 rounded-full bg-slate-800 text-slate-200 hover:text-white transition-colors"
                title="Device Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Mic Level indicator */}
            {!isMicMuted && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400">
                <Mic className="w-3 h-3" />
                <span>Audio OK</span>
              </div>
            )}
          </div>

          {/* Device Selectors (if toggled) */}
          {showDeviceSettings && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="font-semibold text-white block">Hardware Device Selection</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Camera Device</label>
                  <select
                    value={selectedCamId}
                    onChange={(e) => setSelectedCamId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white focus:outline-none"
                  >
                    {availableCams.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Microphone Device</label>
                  <select
                    value={selectedMicId}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white focus:outline-none"
                  >
                    {availableMics.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Join Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={onLeaveMeeting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                setInPreCallPreview(false);
                api.joinMeeting(meeting.id, currentRM.id);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-colors flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Join Meeting Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View 2: Active Video Conference Room (Zoom / Google Meet Experience)
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col h-[calc(100vh-65px)] overflow-hidden relative">
      {/* Top Meeting Header Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{meeting.title}</span>
            <span className="text-slate-400 font-mono">({meeting.internalReference})</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chime SFU 256-bit DTLS-SRTP</span>
          </div>

          <div className="text-slate-400 font-mono">Duration: {formatTimer(meetingSeconds)}</div>

          {isRecording && (
            <div className="flex items-center gap-1.5 text-rose-400 font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>REC {formatTimer(recordingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('spotlight')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'spotlight' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
              title="Speaker Spotlight"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport: Video Stage & Side Drawer */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto relative">
          {/* Live Captions Floating Overlay (Section 9 requirement) */}
          {showCaptions && liveCaptions.length > 0 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-full px-4 pointer-events-none">
              <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-lg p-3 text-center space-y-1">
                {liveCaptions.slice(-2).map((cap) => (
                  <p key={cap.id} className="text-xs text-white">
                    <strong className="text-blue-400 font-semibold">{cap.speaker}: </strong>
                    <span>{cap.text}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Presentation Mode with Screen Share */}
          {layoutMode === 'presentation' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-black border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                {isScreenSharing && screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <MonitorUp className="w-12 h-12 text-blue-400 mx-auto" />
                    <h3 className="font-semibold text-white">Screen Sharing & Presentation Stage</h3>
                    <button
                      onClick={handleToggleScreenShare}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                    >
                      Share Your Screen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standard Grid / Spotlight Layout */}
          {layoutMode !== 'presentation' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr min-h-0">
              {/* Local Participant Tile (RM) */}
              <div
                className={`relative bg-slate-900 border rounded-xl overflow-hidden flex items-center justify-center transition-all ${
                  activeSpeakerId === 'local' && localAudioLevel > 20
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-800'
                }`}
              >
                {isVideoOff ? (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-md">
                      {currentRM.avatar}
                    </div>
                    <span className="font-semibold text-white text-sm">{currentRM.name}</span>
                    <span className="text-xs text-slate-400">{currentRM.title}</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[11px] text-slate-200">
                  {currentRM.name} (You)
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-black/60 px-2 py-1 rounded flex items-center gap-1.5 text-xs">
                    {isMicMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${localAudioLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Video Tile (David Sterling) */}
              <div
                className={`relative bg-slate-900 border rounded-xl overflow-hidden flex items-center justify-center transition-all ${
                  activeSpeakerId === 'customer'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {meeting.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <span className="absolute -inset-1.5 rounded-full border border-emerald-400/60 animate-ping pointer-events-none" />
                  </div>
                  <span className="font-semibold text-white text-sm">{meeting.customerName}</span>
                  <span className="text-xs text-emerald-400 font-mono">
                    Authenticated Client · 1080p Opus 48kHz
                  </span>

                  {/* Audio wave pulse */}
                  <div className="flex items-center gap-1 mt-3">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-6 bg-emerald-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-8 bg-emerald-400 rounded-full animate-pulse delay-150" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-100" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[11px] text-slate-200">
                  {meeting.customerName}
                </div>

                <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs text-emerald-400 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speaking...</span>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 7 REQUIREMENT: Bottom Meeting Toolbar                      */}
          {/* ------------------------------------------------------------------ */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
            {/* Left Controls: Mic, Camera, Screen Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMic}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isMicMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isMicMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                onClick={handleToggleVideo}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isVideoOff
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-blue-400" />}
                <span className="hidden sm:inline">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
              </button>

              <button
                onClick={handleToggleScreenShare}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <MonitorUp className="w-4 h-4" />
                <span className="hidden md:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
              </button>
            </div>

            {/* Center Controls: Captions, Recording, AI */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  showCaptions
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <span>CC Captions</span>
              </button>

              <button
                onClick={handleStartRecordingWithConsent}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{isRecording ? 'Stop REC' : 'Record'}</span>
              </button>
            </div>

            {/* Right Controls: Drawers, End Meeting */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'crm' ? null : 'crm')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeDrawer === 'crm' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">CRM Context</span>
              </button>

              <button
                onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeDrawer === 'chat' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Chat</span>
              </button>

              <button
                onClick={() => {
                  onEndMeeting(meeting.id, meetingSeconds);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Side Drawers (CRM 360, In-Meeting Chat) */}
        {activeDrawer && (
          <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden transition-all">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activeDrawer === 'crm' && 'CRMNEXT Customer 360'}
                {activeDrawer === 'chat' && 'In-Meeting Chat'}
              </span>
              <button
                onClick={() => setActiveDrawer(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Drawer 1: Customer 360 Context */}
            {activeDrawer === 'crm' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{meeting.customerName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      Verified Client
                    </span>
                  </div>
                  <div className="text-slate-400">Phone: {meeting.customerPhone}</div>
                  <div className="text-slate-400">Email: {meeting.customerEmail}</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-mono">
                    <span className="text-slate-400">Ref Ticket:</span>
                    <span className="text-blue-400">#TCK-2024-88</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">Meeting Agenda</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
                    {meeting.agenda}
                  </p>
                </div>
              </div>
            )}

            {/* Drawer 2: In-Meeting Chat */}
            {activeDrawer === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {chatMessages.map((m) => (
                    <div key={m.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{m.sender}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                      </div>
                      <p className="text-slate-300">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send in-call message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recording Consent Modal (Section 9 Requirement) */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Meeting Recording Consent</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with banking regulatory frameworks (FINRA Rule 4511 & PCI-DSS), recording
              this session will capture audio, video, and screen content to encrypted AWS S3 storage.
              All attendees have received notification.
            </p>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-emerald-400">Automated Data Protection Active</div>
              <p>Amazon Transcribe will automatically redact credit card numbers, SSNs, and routing codes.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConsent}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
              >
                Confirm & Start Recording
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
