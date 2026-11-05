import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Radio,
  FileText,
  MessageSquare,
  Lock,
  Volume2,
  Sparkles,
  PhoneOff,
  LayoutGrid,
  Maximize2,
  CheckCircle2,
  Download,
  AlertTriangle,
  Smile,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { Participant, MeetingMessage, LiveTranscriptItem, CustomerCRMRecord, UserProfile } from '../../types';
import { createMicrophoneMeter } from '../../utils/audioTones';
import { LiveSpeechEngine, redactFinancialPII } from '../../utils/speechRecognition';

interface MeetingsSDKViewProps {
  currentUser: UserProfile;
  crmRecord: CustomerCRMRecord;
}

export const MeetingsSDKView: React.FC<MeetingsSDKViewProps> = ({ currentUser, crmRecord }) => {
  // Local Media Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Audio Processing & Level
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [noiseFocusActive, setNoiseFocusActive] = useState(true);
  const [virtualBgActive, setVirtualBgActive] = useState(false);

  // Meeting State
  const [meetingJoined, setMeetingJoined] = useState(true);
  const [meetingId] = useState('mtg-chime-apex-9082');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight' | 'presentation'>('grid');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('local');
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);

  // Meeting Recording (Real MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Panels
  const [activeSidePanel, setActiveSidePanel] = useState<'crm' | 'chat' | 'transcription' | null>('crm');

  // In-Meeting Chat
  const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([
    {
      id: 'm1',
      senderId: 'usr_client_david_sterling',
      senderName: 'David Sterling',
      senderRole: 'CLIENT',
      text: 'Good morning Sarah, joining from our London branch.',
      timestamp: '10:01 AM',
      isEncrypted: true,
    },
    {
      id: 'm2',
      senderId: 'usr_wealth_marcus_vance',
      senderName: 'Marcus Vance',
      senderRole: 'WEALTH_ADVISOR',
      text: 'I have pulled up the treasury yields and swap agreements.',
      timestamp: '10:02 AM',
      isEncrypted: true,
      hasAttachment: true,
      attachmentName: 'Apex_Treasury_Swap_Memo.pdf',
      attachmentSize: '1.2 MB',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([
    {
      id: 't1',
      speaker: 'David Sterling',
      role: 'CLIENT',
      text: 'Sarah, let us confirm the interest rate lock on the commercial mortgage facility.',
      timestamp: '00:15',
      sentiment: 'neutral',
    },
    {
      id: 't2',
      speaker: 'Sarah Lin, CFA',
      role: 'RELATIONSHIP_MANAGER',
      text: 'Underwriting confirmed the 5.15% fixed rate for 7 years on CRMNEXT ticket #TCK-2024-88.',
      timestamp: '00:24',
      sentiment: 'positive',
    },
  ]);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);
  const speechEngineRef = useRef<LiveSpeechEngine | null>(null);

  // Participants roster
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'local',
      name: currentUser.name,
      role: currentUser.role,
      isLocal: true,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: false,
      audioLevel: 0,
      handRaised: false,
      avatarColor: 'bg-blue-600',
      connectionQuality: 'excellent',
    },
    {
      id: 'p_david',
      name: 'David Sterling',
      role: 'CLIENT',
      isLocal: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: true,
      audioLevel: 68,
      handRaised: false,
      avatarColor: 'bg-emerald-600',
      connectionQuality: 'excellent',
    },
    {
      id: 'p_marcus',
      name: 'Marcus Vance',
      role: 'WEALTH_ADVISOR',
      isLocal: false,
      isMuted: true,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeaking: false,
      audioLevel: 0,
      handRaised: false,
      avatarColor: 'bg-purple-600',
      connectionQuality: 'good',
    },
    {
      id: 'p_elena',
      name: 'Elena Rostova',
      role: 'COMPLIANCE_OFFICER',
      isLocal: false,
      isMuted: false,
      isVideoOff: true,
      isScreenSharing: false,
      isSpeaking: false,
      audioLevel: 12,
      handRaised: false,
      avatarColor: 'bg-amber-600',
      connectionQuality: 'excellent',
    },
  ]);

  // Initialize WebRTC User Media
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        setMediaError(null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup microphone analyzer
        const meter = createMicrophoneMeter(stream, (level) => {
          if (active) {
            setLocalAudioLevel(level);
            if (level > 25) {
              setActiveSpeakerId('local');
            }
          }
        });
        meterCleanupRef.current = meter.stop;
      } catch (err: any) {
        console.warn('WebRTC camera/microphone access note:', err.message);
        setMediaError(
          'Microphone or Camera access previewing simulated media. You can enable camera permissions in your browser anytime.'
        );
      }
    }

    if (meetingJoined) {
      initCamera();
    }

    // Initialize speech engine
    speechEngineRef.current = new LiveSpeechEngine();
    speechEngineRef.current.start((text, isFinal) => {
      if (isFinal && text.trim().length > 0) {
        const { sanitized, hasPII } = redactFinancialPII(text);
        setTranscripts((prev) => [
          ...prev,
          {
            id: `speech_${Date.now()}`,
            speaker: currentUser.name,
            role: currentUser.role,
            text: sanitized,
            timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            sentiment: 'positive',
            containsSensitivePII: hasPII,
          },
        ]);
      }
    });

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (meterCleanupRef.current) {
        meterCleanupRef.current();
      }
      if (speechEngineRef.current) {
        speechEngineRef.current.stop();
      }
    };
  }, [meetingJoined]);

  // Update local video element when stream or video toggle changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

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

  // Toggle Microphone
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMicMuted(!isMicMuted);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isMuted: !isMicMuted } : p))
    );
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff(!isVideoOff);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isVideoOff: !isVideoOff } : p))
    );
  };

  // Screen Sharing via getDisplayMedia
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

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

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

  // Real Recording using MediaRecorder
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
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

          recorder.start(1000); // 1s slice
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        } catch (err) {
          console.error('MediaRecorder start error:', err);
          setIsRecording(true); // Fallback to simulated capture pipeline
        }
      } else {
        setIsRecording(true);
      }
    }
  };

  // Send In-Meeting Chat
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const { sanitized, hasPII } = redactFinancialPII(chatInput);

    const newMsg: MeetingMessage = {
      id: `m_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: sanitized,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (hasPII) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `alert_${Date.now()}`,
          speaker: 'Amazon Chime Guardrails',
          role: 'COMPLIANCE_OFFICER',
          text: 'Alert: Financial account digits masked in chat per PCI-DSS policy.',
          timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          sentiment: 'attention_needed',
          containsSensitivePII: true,
        },
      ]);
    }
  };

  // In-Meeting Emoji Reaction
  const sendReaction = (emoji: string) => {
    const id = Date.now();
    setReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Meeting Info Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">
              Commercial Jumbo Refinance & Wealth Advisory
            </span>
            <span className="text-slate-400 font-mono">({meetingId})</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebRTC DTLS-SRTP 256-bit</span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 text-rose-400 font-mono font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>REC {formatTimer(recordingSeconds)}</span>
              <span className="text-slate-400 text-[11px]">(Amazon Chime Media Pipeline)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {recordedBlobUrl && (
            <a
              href={recordedBlobUrl}
              download={`ApexBank_Meeting_${meetingId}.webm`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Recording (.webm)</span>
            </a>
          )}

          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded">
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
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {mediaError && (
        <div className="bg-amber-950/60 border-b border-amber-800/80 px-6 py-2 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Viewport: Video Stage & Context Side Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Canvas Stage */}
        <div className="flex-1 relative p-4 flex flex-col justify-between overflow-y-auto">
          {/* Reaction Float Animation */}
          <div className="absolute bottom-24 right-12 z-40 pointer-events-none flex flex-col gap-2">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="text-3xl animate-bounce transition-all opacity-90 drop-shadow-lg"
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Presentation Mode with Screen Share */}
          {layoutMode === 'presentation' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
                {isScreenSharing && screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="p-8 text-center max-w-md">
                    <MonitorUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-white mb-1">
                      Co-Browsing & Document Presentation Stage
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Share the commercial mortgage loan term sheet or banking prospectus directly with
                      the client via Amazon Chime Content Share.
                    </p>
                    <button
                      onClick={toggleScreenShare}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
                    >
                      Share Your Screen
                    </button>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-slate-300">
                  {isScreenSharing ? 'Active Screen Share · 1080p 30fps' : 'Presentation Stage'}
                </div>
              </div>

              {/* Filmstrip of participants */}
              <div className="h-28 flex gap-3 overflow-x-auto shrink-0 pb-1">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="w-44 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center"
                  >
                    {p.isLocal ? (
                      isVideoOff ? (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                          {currentUser.avatarText}
                        </div>
                      ) : (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="text-center p-2">
                        <div
                          className={`w-9 h-9 rounded-full ${p.avatarColor} text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold`}
                        >
                          {p.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <span className="text-[11px] text-slate-300 block truncate font-medium">
                          {p.name.split(',')[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded truncate max-w-[85%]">
                      {p.name.split(',')[0]} {p.isLocal && '(You)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid Layout Mode (Zoom / Meet Style) */}
          {layoutMode !== 'presentation' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr min-h-0">
              {/* Local Participant Tile */}
              <div
                className={`relative bg-slate-900 border rounded-lg overflow-hidden flex items-center justify-center shadow-sm transition-all ${
                  activeSpeakerId === 'local' && localAudioLevel > 20
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-800'
                }`}
              >
                {isVideoOff ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-md">
                      {currentUser.avatarText}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{currentUser.name}</span>
                    <span className="text-xs text-slate-400">{currentUser.title}</span>
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
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                  <span>{currentUser.name} (You)</span>
                  <span className="text-blue-400 font-mono text-[10px]">· RM Desk</span>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded flex items-center gap-2 text-xs">
                    {isMicMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        {/* Audio VU Bar */}
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${localAudioLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {noiseFocusActive && (
                    <div className="bg-blue-950/80 border border-blue-800/80 px-2 py-1 rounded text-[10px] text-blue-300 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Voice Focus ON</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Participant 1: David Sterling (Customer) */}
              <div
                className={`relative bg-slate-900 border rounded-lg overflow-hidden flex items-center justify-center shadow-sm transition-all ${
                  activeSpeakerId === 'p_david'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Simulated Customer Live Video Canvas with realistic professional presence */}
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        DS
                      </div>
                      {/* Speaking Pulse Ring */}
                      <span className="absolute -inset-1.5 rounded-full border border-emerald-400/60 animate-ping pointer-events-none" />
                    </div>
                    <span className="text-sm font-semibold text-white">David Sterling</span>
                    <span className="text-xs text-emerald-400 font-mono">
                      Verified Client · Tier-1 Private Wealth
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

                  <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                    <span>David Sterling</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>

                  <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                    HD 1080p · Opus 48kHz
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded flex items-center gap-2 text-xs">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-slate-300">Speaking...</span>
                  </div>
                </div>
              </div>

              {/* Remote Participant 2: Marcus Vance (Wealth Strategist) */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-800 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-md">
                    MV
                  </div>
                  <span className="text-sm font-semibold text-white">Marcus Vance</span>
                  <span className="text-xs text-slate-400">Principal Wealth Strategist</span>
                </div>

                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                  Marcus Vance (Desk)
                </div>

                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-xs text-rose-400 flex items-center gap-1.5">
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Muted</span>
                </div>
              </div>

              {/* Remote Participant 3: Elena Rostova (Compliance Auditor) */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-orange-700 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-md">
                    ER
                  </div>
                  <span className="text-sm font-semibold text-white">Elena Rostova</span>
                  <span className="text-xs text-amber-400 font-mono">Chief Compliance Auditor</span>
                </div>

                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span>Elena Rostova</span>
                  <span className="text-amber-400 text-[10px] font-mono">· Active Auditor</span>
                </div>

                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-xs text-emerald-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[11px] text-slate-300">Passive Ingest</span>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Bottom Toolbar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
            {/* Left Controls: Audio/Video */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
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
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isVideoOff
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isVideoOff ? 'Start Video' : 'Stop Video'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-blue-400" />}
                <span className="hidden sm:inline">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Share Screen via WebRTC Content Share"
              >
                <MonitorUp className="w-4 h-4" />
                <span className="hidden md:inline">
                  {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                </span>
              </button>
            </div>

            {/* Center Controls: ML Intelligence & Media Recording */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNoiseFocusActive(!noiseFocusActive)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  noiseFocusActive
                    ? 'bg-indigo-900/60 border border-indigo-700 text-indigo-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title="Toggle Amazon Chime Voice Focus (ML Noise Suppression)"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Voice Focus</span>
              </button>

              <button
                onClick={() => setVirtualBgActive(!virtualBgActive)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  virtualBgActive
                    ? 'bg-purple-900/60 border border-purple-700 text-purple-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title="Virtual Background Blur"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline">Background Blur</span>
              </button>

              <button
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Record Meeting (Amazon Chime Media Capture Pipeline)"
              >
                <Radio className="w-4 h-4" />
                <span>{isRecording ? 'Stop REC' : 'Record'}</span>
              </button>

              {/* Reaction Bar */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded">
                <button
                  onClick={() => sendReaction('👍')}
                  className="p-1 hover:bg-slate-700 rounded text-sm transition-transform active:scale-125"
                  title="Thumbs Up"
                >
                  👍
                </button>
                <button
                  onClick={() => sendReaction('👏')}
                  className="p-1 hover:bg-slate-700 rounded text-sm transition-transform active:scale-125"
                  title="Clap"
                >
                  👏
                </button>
                <button
                  onClick={() => sendReaction('🤝')}
                  className="p-1 hover:bg-slate-700 rounded text-sm transition-transform active:scale-125"
                  title="Deal Agreed"
                >
                  🤝
                </button>
              </div>
            </div>

            {/* Right Controls: Panels & End Call */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'crm' ? null : 'crm')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activeSidePanel === 'crm'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Customer 360 CRMNEXT Panel"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Customer 360</span>
              </button>

              <button
                onClick={() =>
                  setActiveSidePanel(activeSidePanel === 'transcription' ? null : 'transcription')
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activeSidePanel === 'transcription'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Live Audio Transcription & Sentiment"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden md:inline">Transcripts</span>
              </button>

              <button
                onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activeSidePanel === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="In-Meeting Encrypted Chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Chat</span>
              </button>

              <button
                onClick={() => setMeetingJoined(!meetingJoined)}
                className="flex items-center gap-2 px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-medium transition-colors"
                title="Leave Meeting"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel Drawer (CRM, Live Transcription, In-Call Chat) */}
        {activeSidePanel && (
          <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden transition-all">
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                {activeSidePanel === 'crm' && 'CRMNEXT Customer 360'}
                {activeSidePanel === 'transcription' && 'Live Audio Transcription'}
                {activeSidePanel === 'chat' && 'Encrypted In-Call Chat'}
              </span>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Panel Content: CRMNEXT View */}
            {activeSidePanel === 'crm' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Client Profile Card */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{crmRecord.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                      {crmRecord.kycStatus}
                    </span>
                  </div>
                  <div className="text-slate-400">Account: {crmRecord.accountNumber}</div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">AUM Portfolio:</span>
                    <span className="font-mono font-semibold text-white">
                      {crmRecord.portfolioValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Relationship Mgr:</span>
                    <span className="text-slate-200">{crmRecord.assignedRM}</span>
                  </div>
                </div>

                {/* Open Lending Tickets */}
                <div className="space-y-2">
                  <span className="font-semibold text-slate-300 block">Active CRM Tickets</span>
                  {crmRecord.openTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 text-[11px]">{t.id}</span>
                        <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-slate-200 font-medium">{t.title}</div>
                      <div className="text-[10px] text-slate-500">Updated: {t.updatedAt}</div>
                    </div>
                  ))}
                </div>

                {/* In-Call Quick Actions */}
                <div className="space-y-2 pt-2">
                  <span className="font-semibold text-slate-300 block">In-Call CRM Actions</span>
                  <button
                    onClick={() => {
                      const newMsg: MeetingMessage = {
                        id: `push_${Date.now()}`,
                        senderId: currentUser.id,
                        senderName: currentUser.name,
                        senderRole: currentUser.role,
                        text: 'Pushed verified commercial loan term sheet directly to customer meeting room.',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isEncrypted: true,
                        hasAttachment: true,
                        attachmentName: 'Commercial_Jumbo_RateLock_TermSheet.pdf',
                        attachmentSize: '2.1 MB',
                      };
                      setChatMessages((prev) => [...prev, newMsg]);
                      setActiveSidePanel('chat');
                    }}
                    className="w-full text-left p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span>Push Term Sheet to Call</span>
                    <span className="font-mono text-blue-400">→</span>
                  </button>

                  <button
                    onClick={() => {
                      alert('Audit token #AUD-99201 generated and synced to FINRA Compliance Log.');
                    }}
                    className="w-full text-left p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span>Generate Compliance Seal</span>
                    <span className="font-mono text-emerald-400">✓</span>
                  </button>
                </div>
              </div>
            )}

            {/* Panel Content: Live Transcription */}
            {activeSidePanel === 'transcription' && (
              <div className="flex-1 flex flex-col overflow-hidden p-3">
                <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                  <span>Amazon Transcribe & Comprehend Engine</span>
                  <span className="text-emerald-400 font-mono">Real-Time Ingest</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {transcripts.map((item) => (
                    <div key={item.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300">{item.speaker}</span>
                        <span className="font-mono text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.text}</p>
                      {item.containsSensitivePII && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                          <ShieldAlert className="w-3 h-3" />
                          <span>PCI-DSS Masking Applied to Audio & Text</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel Content: In-Call Chat */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs p-2.5 rounded ${
                        msg.senderId === currentUser.id
                          ? 'bg-blue-950/80 border border-blue-800/80 ml-4'
                          : 'bg-slate-950 border border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{msg.senderName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-normal">{msg.text}</p>
                      {msg.hasAttachment && (
                        <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
                          <div className="truncate">
                            <div className="font-medium text-slate-200 truncate">{msg.attachmentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{msg.attachmentSize}</div>
                          </div>
                          <button
                            onClick={() => alert(`Downloading verified banking document: ${msg.attachmentName}`)}
                            className="p-1 hover:bg-slate-800 rounded text-blue-400"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send encrypted message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
