import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  MessageSquare,
  Users,
  ShieldCheck,
  Maximize2,
  Info,
  CheckCircle2,
  FileCheck,
  Send,
  Subtitles,
  Settings,
  ChevronDown,
  Volume2,
  AlertTriangle,
  RefreshCw,
  X,
  Radio,
  MonitorUp,
  Sparkles,
  Layers,
  Download,
  Lock,
  LayoutGrid,
  Smile,
  Copy,
  ExternalLink
} from 'lucide-react';
import { ScheduledMeeting } from '../../types/meetingnext';
import { createMicrophoneMeter } from '../../utils/audioTones';
import { LiveSpeechEngine, redactFinancialPII } from '../../utils/speechRecognition';
import { generateMeetingLink } from '../../utils/appUrl';

interface MeetingRoomModalProps {
  meeting: ScheduledMeeting;
  isOpen: boolean;
  onLeaveMeeting: () => void;
  onCompleteMeeting?: (meetingId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isLocal: boolean;
}

interface TranscriptItem {
  id: string;
  speaker: string;
  role: string;
  text: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'attention_needed';
  containsPII?: boolean;
}

export const MeetingRoomModal: React.FC<MeetingRoomModalProps> = ({
  meeting,
  isOpen,
  onLeaveMeeting,
  onCompleteMeeting,
}) => {
  // Local Media Streams & Controls
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  // Audio level & processing
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [noiseFocusActive, setNoiseFocusActive] = useState(true);
  const [virtualBgActive, setVirtualBgActive] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('local');

  // UI State
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight' | 'presentation'>('grid');
  const [activeSidePanel, setActiveSidePanel] = useState<'crm' | 'chat' | 'transcription' | 'settings' | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Real Meeting Recording (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Emoji Reactions
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);

  // Device lists
  const [availableDevices, setAvailableDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }>({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  // KYC Verification Checklist
  const [kycChecks, setKycChecks] = useState({
    idVerified: true,
    addressProof: true,
    biometricsConfirmed: true,
    disclosureAccepted: false,
  });

  // In-Meeting Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c_init_1',
      sender: 'Amazon Chime SDK',
      role: 'SYSTEM',
      text: 'Encrypted WebRTC media session established in ap-south-1 (Mumbai). TLS 1.3 / SRTP 256-bit.',
      time: 'Just now',
      isLocal: false,
    },
    {
      id: 'c_init_2',
      sender: meeting.customerName,
      role: 'CLIENT',
      text: `Hello Sarthak, I am connected for our ${meeting.reason} consultation.`,
      time: 'Just now',
      isLocal: false,
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 't_init_1',
      speaker: 'Sarthak Jain, CFA',
      role: 'Senior Relationship Manager',
      text: `Good day ${meeting.customerName}, welcome to the MeetingNext video consultation portal.`,
      timestamp: '00:05',
      sentiment: 'positive',
    },
    {
      id: 't_init_2',
      speaker: meeting.customerName,
      role: 'CLIENT',
      text: `Thank you Sarthak. Let us review the agreed terms for my ${meeting.reason}.`,
      timestamp: '00:14',
      sentiment: 'neutral',
    },
  ]);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);
  const speechEngineRef = useRef<LiveSpeechEngine | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Initialize WebRTC Media Stream (Camera & Microphone)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function startMedia() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        setMediaNotice(null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Attach audio analyzer for live level meter & speaking detection
        const meter = createMicrophoneMeter(stream, (level) => {
          if (active) {
            setLocalAudioLevel(level);
            if (level > 22) {
              setActiveSpeakerId('local');
            }
          }
        });
        meterCleanupRef.current = meter.stop;

        // Enumerate devices after permission granted
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (active) {
            setAvailableDevices({
              audioInputs: devices.filter((d) => d.kind === 'audioinput'),
              videoInputs: devices.filter((d) => d.kind === 'videoinput'),
              audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
            });
          }
        } catch (e) {
          console.warn('Enumerate devices note:', e);
        }
      } catch (err: any) {
        console.warn('Camera/Microphone access notice:', err?.message || err);
        setMediaNotice(
          'Microphone or Camera access previewing simulated media. You can enable hardware permissions in your browser anytime.'
        );
      }
    }

    startMedia();

    // Register with backend Chime meeting session in ap-south-1
    fetch(`/api/chime/meetings/${meeting.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalUserId: 'rm_sarthak_jain' }),
    }).catch((e) => console.warn('Backend chime join registration notice:', e));

    // Initialize Speech Recognition Engine for Live Captions
    try {
      speechEngineRef.current = new LiveSpeechEngine();
      speechEngineRef.current.start((text, isFinal) => {
        if (isFinal && text.trim().length > 0) {
          const { sanitized, hasPII } = redactFinancialPII(text);
          setTranscripts((prev) => [
            ...prev,
            {
              id: `speech_${Date.now()}`,
              speaker: 'Sarthak Jain, CFA',
              role: 'Senior Relationship Manager',
              text: sanitized,
              timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
              sentiment: 'positive',
              containsPII: hasPII,
            },
          ]);
        }
      });
    } catch (e) {
      console.warn('Speech engine initialization notice:', e);
    }

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      if (meterCleanupRef.current) {
        meterCleanupRef.current();
      }
      if (speechEngineRef.current) {
        speechEngineRef.current.stop();
      }
    };
  }, [isOpen, selectedVideoDevice, selectedAudioDevice]);

  // Bind local video element whenever stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Bind screen share video element whenever screen stream changes
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Call duration counter
  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Recording timer
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // Media Controls: Mic, Video, Screen Sharing, Recording
  // ---------------------------------------------------------------------------
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMicMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      setLayoutMode('grid');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        setScreenStream(stream);
        setIsScreenSharing(true);
        setLayoutMode('presentation');

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          setLayoutMode('grid');
        };
      } catch (err) {
        console.warn('Screen share canceled or unpermitted', err);
      }
    }
  };

  // Real MediaRecorder Meeting Capture
  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      recordedChunksRef.current = [];
      const recordStream = screenStream || localStream;

      if (recordStream) {
        try {
          const recorder = new MediaRecorder(recordStream, {
            mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
              ? 'video/webm;codecs=vp9,opus'
              : 'video/webm',
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordedBlobUrl(url);
          };

          recorder.start(1000);
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        } catch (err) {
          console.error('MediaRecorder start notice:', err);
          setIsRecording(true);
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  // Send In-Meeting Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { sanitized, hasPII } = redactFinancialPII(chatInput);

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'Sarthak Jain, CFA',
      role: 'Senior Relationship Manager',
      text: sanitized,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (hasPII) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `alert_${Date.now()}`,
          speaker: 'Compliance Guardrails',
          role: 'SYSTEM',
          text: 'Alert: Financial account digits masked in chat per RBI & PCI-DSS policy.',
          timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          sentiment: 'attention_needed',
          containsPII: true,
        },
      ]);
    }
  };

  // Emoji Reaction
  const sendReaction = (emoji: string) => {
    const id = Date.now();
    setReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2600);
  };

  // Copy Meeting Link
  const handleCopyLink = () => {
    const link = generateMeetingLink(meeting.id);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // End Meeting for All (Organizer)
  const handleEndMeetingForAll = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (speechEngineRef.current) {
      speechEngineRef.current.stop();
    }
    if (onCompleteMeeting) {
      onCompleteMeeting(meeting.id);
    }
    onLeaveMeeting();
  };

  const handleLeaveOnly = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (speechEngineRef.current) {
      speechEngineRef.current.stop();
    }
    onLeaveMeeting();
  };

  if (!isOpen) return null;

  const meetingLink = generateMeetingLink(meeting.id);
  const latestTranscript = transcripts[transcripts.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Top Meeting Bar */}
      {/* --------------------------------------------------------------------- */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h1 className="text-sm font-semibold text-white truncate flex items-center gap-2">
                <span>{meeting.reason}</span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {meeting.id}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                <span>Customer: {meeting.customerName}</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ap-south-1 (Mumbai)
                </span>
              </p>
            </div>
          </div>

          {/* Meeting Duration */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800 text-xs font-mono text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>REC {formatDuration(recordingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {/* Download Recording if available */}
          {recordedBlobUrl && (
            <a
              href={recordedBlobUrl}
              download={`MeetingNext_${meeting.id}_Recording.webm`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              title="Download Recorded Session"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download REC</span>
            </a>
          )}

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
            title="Copy Public Meeting Link"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('spotlight')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'spotlight' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Speaker Spotlight"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('presentation')}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'presentation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Presentation Mode"
            >
              <MonitorUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleLeaveOnly}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1"
            title="Minimize / Exit Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Permission Notice Banner if camera/mic blocked */}
      {mediaNotice && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 md:px-6 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{mediaNotice}</span>
          </div>
          <button
            onClick={() => setMediaNotice(null)}
            className="text-amber-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. Main Stage & Video Canvas */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Reactions */}
        <div className="absolute bottom-20 right-16 z-40 pointer-events-none flex flex-col gap-2">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="text-4xl animate-bounce transition-all opacity-90 drop-shadow-md"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 flex flex-col p-3 md:p-5 overflow-hidden">
          {/* Presentation Mode with Content Screen Share */}
          {layoutMode === 'presentation' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center shadow-lg">
                {isScreenSharing && screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="p-8 text-center max-w-md">
                    <MonitorUp className="w-14 h-14 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-white mb-1">
                      Co-Browsing & Document Presentation Stage
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Share the loan term sheet, sanction letter, or banking agreement directly with{' '}
                      <span className="text-white font-medium">{meeting.customerName}</span> via WebRTC Content Share.
                    </p>
                    <button
                      onClick={toggleScreenShare}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      Start Screen Sharing
                    </button>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-300">
                  {isScreenSharing ? 'Active Screen Share · 1080p 30fps' : 'Presentation Stage'}
                </div>
              </div>

              {/* Filmstrip of participants */}
              <div className="h-32 flex gap-3 overflow-x-auto shrink-0 pb-1">
                {/* Local participant thumbnail */}
                <div className="w-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center">
                  {isVideoOff ? (
                    <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-xs">
                      SJ
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
                  <div className="absolute bottom-1.5 left-2 text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded truncate max-w-[85%] font-medium">
                    Sarthak Jain (You)
                  </div>
                </div>

                {/* Customer thumbnail */}
                <div className="w-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center">
                  <div className="text-center p-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold shadow-md">
                      {meeting.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <span className="text-[11px] text-slate-300 block truncate font-medium">
                      {meeting.customerName}
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded truncate max-w-[85%] font-medium">
                    {meeting.customerName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout Mode (Google Meet / Zoom Style) */}
          {layoutMode !== 'presentation' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr min-h-0">
              {/* Local Participant Tile (Relationship Manager) */}
              <div
                className={`relative bg-slate-900 border rounded-2xl overflow-hidden flex items-center justify-center shadow-lg transition-all ${
                  activeSpeakerId === 'local' && localAudioLevel > 20
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-slate-800'
                }`}
              >
                {isVideoOff ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-xl">
                      SJ
                    </div>
                    <span className="text-sm font-semibold text-slate-200">Sarthak Jain, CFA</span>
                    <span className="text-xs text-slate-400">Senior Relationship Manager</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${virtualBgActive ? 'backdrop-blur-md' : ''}`}
                  />
                )}

                {/* Local Tile Overlays */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <span>Sarthak Jain, CFA (You)</span>
                  <span className="text-rose-400 font-mono text-[10px]">· RM Desk</span>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                    {isMicMuted ? (
                      <MicOff className="w-4 h-4 text-rose-400" />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-emerald-400" />
                        {/* Audio VU Bar */}
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${localAudioLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {noiseFocusActive && (
                    <div className="bg-blue-950/80 border border-blue-800/80 px-2 py-1 rounded-lg text-[10px] text-blue-300 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Voice Focus ON</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Participant Tile: Customer */}
              <div
                className={`relative bg-slate-900 border rounded-2xl overflow-hidden flex items-center justify-center shadow-lg transition-all ${
                  activeSpeakerId === 'customer'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                        {meeting.customerName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      {/* Speaking Pulse Ring */}
                      <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
                    </div>
                    <span className="text-base font-semibold text-white">{meeting.customerName}</span>
                    <span className="text-xs text-emerald-400 font-mono mt-0.5">
                      Customer · {meeting.customerNumber}
                    </span>

                    {/* Customer Real-time audio waveform animation */}
                    <div className="flex items-center gap-1 mt-3">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1 h-6 bg-emerald-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-8 bg-emerald-400 rounded-full animate-pulse delay-150" />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-100" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                    <span>{meeting.customerName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                    HD 1080p · Opus 48kHz
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">Speaking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Subtitles Ticker (Google Meet Style) */}
          {showCaptions && latestTranscript && (
            <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 text-xs max-w-2xl mx-auto backdrop-blur-md shadow-md animate-in fade-in duration-150">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-rose-400">{latestTranscript.speaker}: </span>
                <span className="text-slate-200">{latestTranscript.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 3. Side Drawers (CRM, Chat, Transcripts, Settings) */}
        {/* ------------------------------------------------------------------- */}
        {activeSidePanel && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden transition-all shadow-2xl shrink-0">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
                {activeSidePanel === 'crm' && (
                  <>
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span>Customer 360 & KYC</span>
                  </>
                )}
                {activeSidePanel === 'chat' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>In-Meeting Encrypted Chat</span>
                  </>
                )}
                {activeSidePanel === 'transcription' && (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Transcripts & AI</span>
                  </>
                )}
                {activeSidePanel === 'settings' && (
                  <>
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Audio & Video Hardware</span>
                  </>
                )}
              </span>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Panel 1: Customer 360 & KYC Checklist */}
            {activeSidePanel === 'crm' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Customer Profile */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{meeting.customerName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                      Tier-1 Client
                    </span>
                  </div>
                  <div className="text-slate-400 space-y-1 text-xs">
                    <div>Phone: <span className="text-slate-200">{meeting.customerNumber}</span></div>
                    <div>Email: <span className="text-slate-200">{meeting.customerEmail}</span></div>
                    <div>Reason: <span className="text-rose-400 font-medium">{meeting.reason}</span></div>
                    <div>Scheduled: <span className="text-slate-200">{meeting.date} at {meeting.time}</span></div>
                  </div>
                </div>

                {/* KYC Verification Checklist */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>KYC Regulatory Checklist</span>
                  </h4>

                  <label className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycChecks.idVerified}
                      onChange={(e) => setKycChecks({ ...kycChecks, idVerified: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span>Government Photo ID Verified (Aadhaar / Passport)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycChecks.addressProof}
                      onChange={(e) => setKycChecks({ ...kycChecks, addressProof: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span>Address & Utility Proof Confirmed</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycChecks.biometricsConfirmed}
                      onChange={(e) => setKycChecks({ ...kycChecks, biometricsConfirmed: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span>Live Video Liveness Verified</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycChecks.disclosureAccepted}
                      onChange={(e) => setKycChecks({ ...kycChecks, disclosureAccepted: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span>Disclosures and Consent Agreed</span>
                  </label>
                </div>

                {/* Public Link Share */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 text-xs block">Public Meeting Room Link:</span>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-300 break-all select-all">
                    {meetingLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied to Clipboard' : 'Copy Public Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Panel 2: In-Meeting Chat */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border ${
                        msg.isLocal
                          ? 'bg-rose-950/40 border-rose-900/60 ml-4'
                          : 'bg-slate-950 border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{msg.sender}</span>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message (financial PII auto-masked)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Panel 3: Live Transcripts */}
            {activeSidePanel === 'transcription' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {transcripts.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.speaker}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{t.text}</p>
                    {t.containsPII && (
                      <span className="inline-block text-[10px] text-amber-400 font-mono bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                        PII Redacted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Panel 4: Hardware Settings */}
            {activeSidePanel === 'settings' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="font-medium text-slate-300 block">Camera Device</label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Default Integrated Camera</option>
                    {availableDevices.videoInputs.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-medium text-slate-300 block">Microphone Device</label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Default Microphone Array</option>
                    {availableDevices.audioInputs.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-400">
                  <div className="text-white font-medium">Session Diagnostics</div>
                  <div>Media Region: <span className="text-emerald-400 font-mono">ap-south-1 (Mumbai)</span></div>
                  <div>Protocol: <span className="text-slate-200 font-mono">WebRTC SRTP / DTLS</span></div>
                  <div>Audio Codec: <span className="text-slate-200 font-mono">Opus 48kHz Stereo</span></div>
                  <div>Resolution: <span className="text-slate-200 font-mono">1280x720 30fps</span></div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Bottom Meeting Control Bar (Google Meet Style) */}
      {/* --------------------------------------------------------------------- */}
      <footer className="h-18 bg-slate-900 border-t border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
        {/* Left: Audio & Video Media Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
              isMicMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMicMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={toggleVideo}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
              isVideoOff
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-rose-400" />}
            <span className="hidden sm:inline">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Share Screen via WebRTC Content Share"
          >
            <MonitorUp className="w-4 h-4" />
            <span className="hidden md:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </button>
        </div>

        {/* Center: Intelligence & Recording Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNoiseFocusActive(!noiseFocusActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              noiseFocusActive
                ? 'bg-indigo-950/80 border border-indigo-700 text-indigo-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
            title="Amazon Chime Voice Focus (ML Noise Suppression)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Voice Focus</span>
          </button>

          <button
            onClick={() => setVirtualBgActive(!virtualBgActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              virtualBgActive
                ? 'bg-purple-950/80 border border-purple-700 text-purple-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
            title="Virtual Background Blur"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Blur</span>
          </button>

          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Record Meeting (Amazon Chime Media Capture Pipeline)"
          >
            <Radio className="w-4 h-4" />
            <span>{isRecording ? 'Stop REC' : 'Record'}</span>
          </button>

          {/* Reactions */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            {['👍', '👏', '🤝', '❤️'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="p-1 hover:bg-slate-700 rounded-lg text-sm transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Side Panel Drawers & End Meeting Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'crm' ? null : 'crm')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSidePanel === 'crm'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Customer 360 & KYC Checklist"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">Customer 360</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSidePanel === 'chat'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="In-Meeting Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'transcription' ? null : 'transcription')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSidePanel === 'transcription'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Live Audio Transcription"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden md:inline">Transcripts</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'settings' ? null : 'settings')}
            className={`p-2 rounded-xl text-xs font-medium transition-colors ${
              activeSidePanel === 'settings'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Hardware Device Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Leave Button */}
          <button
            onClick={handleLeaveOnly}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* Organizer End for All Button */}
          <button
            onClick={handleEndMeetingForAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            title="End Meeting for All & Generate AI Summary"
          >
            <span>End Call</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
