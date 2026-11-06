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
  Monitor,
  PowerOff
} from 'lucide-react';
import { ScheduledMeeting, ChimeDeviceOption } from '../../types/meetingnext';
import { meetingNextApi } from '../../services/meetingNextApi';
import {
  chimeClientService,
  ChimeConnectionState,
  VideoTileItem,
} from '../../services/chimeClientService';

interface MeetingRoomModalProps {
  meeting: ScheduledMeeting;
  isOpen: boolean;
  onLeaveMeeting: () => void;
  onCompleteMeeting?: (meetingId: string) => void;
}

export const MeetingRoomModal: React.FC<MeetingRoomModalProps> = ({
  meeting,
  isOpen,
  onLeaveMeeting,
  onCompleteMeeting,
}) => {
  // Pre-meeting vs In-meeting state
  const [inPreMeetingLobby, setInPreMeetingLobby] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // In-meeting Controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'roster' | 'chat' | 'verification' | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showDeviceMenu, setShowDeviceMenu] = useState<'audio' | 'video' | null>(null);

  // Device lists & selections
  const [audioInputDevices, setAudioInputDevices] = useState<ChimeDeviceOption[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<ChimeDeviceOption[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<ChimeDeviceOption[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('default');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('default');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('default');

  // Chime session state
  const [connectionState, setConnectionState] = useState<ChimeConnectionState>('idle');
  const [connectionStatusText, setConnectionStatusText] = useState('Ready to connect');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoTiles, setVideoTiles] = useState<VideoTileItem[]>([]);
  const [attendees, setAttendees] = useState<
    { attendeeId: string; externalUserId?: string; present: boolean; muted?: boolean; volume?: number }[]
  >([]);

  // Call duration counter
  const [callSeconds, setCallSeconds] = useState(0);

  // DOM Refs
  const lobbyPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenShareRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    { sender: string; time: string; text: string; isRm: boolean }[]
  >([
    {
      sender: 'Amazon Chime SDK',
      time: 'Just now',
      text: 'Encrypted WebRTC media session initialized in ap-south-1 (Mumbai).',
      isRm: false,
    },
    {
      sender: meeting.customerName,
      time: 'Just now',
      text: `Hello Sarthak, I am ready for our ${meeting.reason} discussion.`,
      isRm: false,
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Live Captions ticker
  const [currentCaption, setCurrentCaption] = useState(
    `Sarthak Jain, CFA: Good day ${meeting.customerName}, welcome to MeetingNext banking portal.`
  );

  // ---------------------------------------------------------------------------
  // Load Hardware Devices on Open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadDevices() {
      const [mics, cams, spks] = await Promise.all([
        chimeClientService.listAudioInputDevices(),
        chimeClientService.listVideoInputDevices(),
        chimeClientService.listAudioOutputDevices(),
      ]);
      if (isMounted) {
        setAudioInputDevices(mics);
        setVideoInputDevices(cams);
        setAudioOutputDevices(spks);
        if (mics.length > 0) setSelectedAudioInput(mics[0].deviceId);
        if (cams.length > 0) setSelectedVideoInput(cams[0].deviceId);
        if (spks.length > 0) setSelectedAudioOutput(spks[0].deviceId);
      }
    }
    loadDevices();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Start pre-meeting camera preview
  useEffect(() => {
    if (isOpen && inPreMeetingLobby && isVideoOn && lobbyPreviewVideoRef.current) {
      chimeClientService.startPreMeetingPreview(lobbyPreviewVideoRef.current, selectedVideoInput);
    } else {
      chimeClientService.stopPreMeetingPreview();
    }
    return () => {
      chimeClientService.stopPreMeetingPreview();
    };
  }, [isOpen, inPreMeetingLobby, isVideoOn, selectedVideoInput]);

  // ---------------------------------------------------------------------------
  // Chime Client Service Callback Subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    chimeClientService.setCallbacks({
      onConnectionStateChange: (state, msg) => {
        setConnectionState(state);
        if (msg) setConnectionStatusText(msg);
      },
      onTileUpdate: (tiles) => {
        setVideoTiles([...tiles]);
      },
      onAttendeeChange: (attList) => {
        setAttendees([...attList]);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onScreenShareChange: (sharing) => {
        setIsScreenSharing(sharing);
      },
    });
  }, [isOpen]);

  // Call duration counter
  useEffect(() => {
    let timer: number;
    if (isOpen && !inPreMeetingLobby) {
      timer = window.setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, inPreMeetingLobby]);

  // Caption switcher
  useEffect(() => {
    if (!isOpen || inPreMeetingLobby) return;
    const captionsList = [
      `Sarthak Jain, CFA: We are reviewing your KYC verification docket for ${meeting.reason}.`,
      `${meeting.customerName}: I have uploaded my PAN and financial statements to the portal.`,
      `Sarthak Jain, CFA: Excellent, all details are compliant with RBI guidelines.`,
      `${meeting.customerName}: Thank you Sarthak, will I receive the confirmation packet via email?`,
      `Sarthak Jain, CFA: Yes, the official sanction confirmation has been dispatched to your Gmail.`,
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % captionsList.length;
      setCurrentCaption(captionsList[idx]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, inPreMeetingLobby, meeting]);

  // Bind video tiles when active
  useEffect(() => {
    if (inPreMeetingLobby) return;

    videoTiles.forEach((tile) => {
      if (tile.isLocal && localVideoRef.current) {
        chimeClientService.bindVideoElement(tile.tileId, localVideoRef.current);
      } else if (tile.isContentShare && remoteScreenShareRef.current) {
        chimeClientService.bindVideoElement(tile.tileId, remoteScreenShareRef.current);
      }
    });
  }, [videoTiles, inPreMeetingLobby]);

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleJoinMeeting = async () => {
    setIsJoining(true);
    setErrorMessage(null);
    try {
      chimeClientService.stopPreMeetingPreview();

      // 1. Join Chime meeting via backend API
      const sessionResponse = await meetingNextApi.joinChimeMeeting(
        meeting.id,
        'rm_sarthak_jain'
      );

      // 2. Initialize Chime MeetingSession with remote audio element binding
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
      }

      await chimeClientService.initializeSession(
        sessionResponse,
        remoteAudioRef.current,
        !isMicOn,
        isVideoOn
      );

      // 3. Set selected input devices
      if (selectedAudioInput) await chimeClientService.selectAudioInput(selectedAudioInput);
      if (selectedVideoInput) await chimeClientService.selectVideoInput(selectedVideoInput);
      if (selectedAudioOutput) await chimeClientService.selectAudioOutput(selectedAudioOutput);

      // 4. Start audio/video facade
      await chimeClientService.start();

      setInPreMeetingLobby(false);
    } catch (err: any) {
      console.warn('Error entering meeting room:', err);
      setErrorMessage(err.message || 'Failed to establish connection with Amazon Chime media server.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleToggleMic = async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    await chimeClientService.setMicrophoneMuted(!next);
  };

  const handleToggleVideo = async () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    await chimeClientService.setVideoEnabled(next);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await chimeClientService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      await chimeClientService.startScreenShare();
    }
  };

  const handleLeaveMeeting = async () => {
    await chimeClientService.leaveMeeting();
    onLeaveMeeting();
  };

  const handleEndMeetingForAll = async () => {
    await chimeClientService.endMeetingForEveryone(meeting.id);
    if (onCompleteMeeting) {
      onCompleteMeeting(meeting.id);
    }
    onLeaveMeeting();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Sarthak Jain, CFA (RM)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim(),
        isRm: true,
      },
    ]);
    setChatInput('');
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasContentShare = videoTiles.some((t) => t.isContentShare);

  // ---------------------------------------------------------------------------
  // View 1: Pre-Meeting Green Room / Device Check Lobby
  // ---------------------------------------------------------------------------
  if (inPreMeetingLobby) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                <Video className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">MeetingNext Device Check</h3>
                <p className="text-xs text-slate-500">
                  Amazon Chime SDK Meetings · Region: <span className="font-semibold text-rose-600">ap-south-1 (Mumbai)</span>
                </p>
              </div>
            </div>
            <button
              onClick={onLeaveMeeting}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Camera Preview Tile */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={lobbyPreviewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="text-center space-y-2 p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-white font-bold text-xl flex items-center justify-center mx-auto border border-slate-700">
                      SJ
                    </div>
                    <p className="text-xs text-slate-400">Camera is off</p>
                  </div>
                )}

                {/* Overlay toggles */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-3 rounded-full transition-all shadow-md ${
                      isMicOn
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-white'
                        : 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-400/50'
                    }`}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-3 rounded-full transition-all shadow-md ${
                      isVideoOn
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-white'
                        : 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-400/50'
                    }`}
                    title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-between text-xs px-2 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isMicOn ? 'Microphone ready' : 'Microphone muted'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isVideoOn ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isVideoOn ? 'Camera active' : 'Camera disabled'}
                </span>
              </div>
            </div>

            {/* Right: Meeting Details & Hardware Selectors */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                {/* Meeting card */}
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      Scheduled Session
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-rose-600 font-bold border border-rose-200">
                      ap-south-1
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{meeting.reason}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <span className="font-medium text-slate-800">{meeting.customerName}</span> · {meeting.customerNumber}
                  </p>
                </div>

                {/* Hardware Dropdowns */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Camera Device
                    </label>
                    <select
                      value={selectedVideoInput}
                      onChange={(e) => setSelectedVideoInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-rose-400"
                    >
                      {videoInputDevices.length > 0 ? (
                        videoInputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))
                      ) : (
                        <option value="default">Default HD Webcam</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Microphone Device
                    </label>
                    <select
                      value={selectedAudioInput}
                      onChange={(e) => setSelectedAudioInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-rose-400"
                    >
                      {audioInputDevices.length > 0 ? (
                        audioInputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))
                      ) : (
                        <option value="default">Default System Microphone</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Speaker Device
                    </label>
                    <select
                      value={selectedAudioOutput}
                      onChange={(e) => setSelectedAudioOutput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-rose-400"
                    >
                      {audioOutputDevices.length > 0 ? (
                        audioOutputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))
                      ) : (
                        <option value="default">Default System Speaker</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Join action */}
              <div className="pt-2">
                <button
                  onClick={handleJoinMeeting}
                  disabled={isJoining}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Chime (ap-south-1)...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 fill-white" />
                      <span>Join Meeting Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View 2: Live Amazon Chime SDK Video Meeting Room (Google Meet Style)
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200">
      {/* Hidden audio element for remote participant audio streams */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ------------------------------------------------------------------ */}
      {/* Top Header: Clean Branding & Chime ap-south-1 Connection Bar       */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-xs">
            <Video className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">MeetingNext</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/50">
                {meeting.reason}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Customer: {meeting.customerName} · {meeting.customerNumber}
            </div>
          </div>
        </div>

        {/* Center: Call Timer & Real AWS Chime ap-south-1 Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{formatCallTime(callSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chime SDK · ap-south-1 (Mumbai)</span>
            {connectionState === 'reconnecting' && (
              <span className="text-amber-600 font-bold animate-pulse ml-1">(Reconnecting)</span>
            )}
          </div>
        </div>

        {/* Right side controls: KYC Verification & Chat & Participants */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'roster' ? null : 'roster')}
            className={`p-2 rounded-full transition-all ${
              activeSidePanel === 'roster'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Participants list"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'verification' ? null : 'verification')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSidePanel === 'verification'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KYC Verify</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            className={`p-2 rounded-full transition-all ${
              activeSidePanel === 'chat'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="In-call Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Error / Reconnection Toast Banner                                  */}
      {/* ------------------------------------------------------------------ */}
      {errorMessage && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-amber-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Main Video Arena & Side Panels                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-4 bg-slate-50/50">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* If someone is sharing screen: Screen-sharing layout */}
          {hasContentShare ? (
            <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0">
              {/* Main Shared Screen */}
              <div className="flex-1 relative rounded-3xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm border border-slate-800">
                <video
                  ref={remoteScreenShareRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-xs rounded-full text-white text-xs font-medium flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-rose-400" />
                  <span>Shared Screen Presentation</span>
                </div>
              </div>

              {/* Side Strip of Participants */}
              <div className="w-full md:w-64 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
                {/* Local Video Thumbnail */}
                <div className="aspect-video w-48 md:w-full rounded-2xl bg-slate-900 overflow-hidden relative border border-slate-800 shrink-0">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-slate-800">
                      You (Camera Off)
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white">
                    You {!isMicOn && '· Muted'}
                  </div>
                </div>

                {/* Customer Thumbnail */}
                <div className="aspect-video w-48 md:w-full rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 overflow-hidden relative border border-slate-800 shrink-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center">
                    {meeting.customerName.slice(0, 2)}
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white">
                    {meeting.customerName}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Participant Grid (Google Meet / Zoom style) */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
              {/* Participant 1: Customer (Remote Participant) */}
              <div className="relative rounded-3xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm border border-slate-200 group">
                <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-rose-500/20 ring-4 ring-rose-400/30 animate-pulse">
                      {meeting.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-white">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-white font-bold text-base sm:text-lg">
                      {meeting.customerName}
                    </h4>
                    <p className="text-rose-200/80 text-xs font-medium">
                      Customer · {meeting.reason}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-white text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Amazon Chime Audio/Video HD</span>
                </div>
              </div>

              {/* Participant 2: Relationship Manager (Local Video Feed) */}
              <div className="relative rounded-3xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm border border-slate-200">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-3xl ring-4 ring-slate-600">
                      SJ
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-white font-bold text-base">Sarthak Jain, CFA (You)</h4>
                      <p className="text-slate-400 text-xs">Senior Relationship Manager · Camera Off</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-white text-xs font-medium flex items-center gap-2">
                  <span>Sarthak Jain (RM)</span>
                  {!isMicOn && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                </div>
              </div>
            </div>
          )}

          {/* Live Captions Bar (Google Meet Style) */}
          {showCaptions && (
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Subtitles className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs text-slate-700 font-medium truncate">
                <span className="text-rose-600 font-bold mr-1">Live Captions:</span>
                {currentCaption}
              </div>
              <button
                onClick={() => setShowCaptions(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2"
              >
                Hide
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Side Panel: Participant Roster                                     */}
        {/* ------------------------------------------------------------------ */}
        {activeSidePanel === 'roster' && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Meeting Participants (2)</h3>
              </div>
              <button onClick={() => setActiveSidePanel(null)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {/* Local RM */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs">
                    SJ
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Sarthak Jain, CFA (You)</div>
                    <div className="text-[10px] text-rose-600 font-semibold">Organizer · Senior RM</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMicOn ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                  {isVideoOn ? <Video className="w-4 h-4 text-emerald-600" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Remote Customer */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                    {meeting.customerName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{meeting.customerName}</div>
                    <div className="text-[10px] text-slate-400">{meeting.customerNumber}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <Video className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Encrypted Chime Audio & Video Stream (ap-south-1)</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Side Panel: In-Call Chat                                           */}
        {/* ------------------------------------------------------------------ */}
        {activeSidePanel === 'chat' && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">In-Call Chat</h3>
              </div>
              <button onClick={() => setActiveSidePanel(null)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl space-y-1 ${
                    msg.isRm
                      ? 'bg-rose-50 border border-rose-100 ml-6 text-slate-900'
                      : 'bg-slate-50 border border-slate-100 mr-6 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message meeting participants..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-400"
              />
              <button
                type="submit"
                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Side Panel: KYC Customer Verification Checklist                     */}
        {/* ------------------------------------------------------------------ */}
        {activeSidePanel === 'verification' && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">KYC & Document Checklist</h3>
              </div>
              <button onClick={() => setActiveSidePanel(null)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                <div className="font-bold text-slate-900">{meeting.customerName}</div>
                <div className="text-slate-500 font-mono text-[11px]">{meeting.customerNumber}</div>
                <div className="text-rose-600 font-semibold text-[11px] mt-1">
                  Purpose: {meeting.reason}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Mandatory Verification Checks:
                </span>
                {[
                  'Live biometric facial verification matched against government ID',
                  'Residential address proof verified',
                  'Income & bank account statements inspected',
                  'Customer agreement terms explained & approved',
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-rose-50/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={idx === 0}
                      className="mt-0.5 rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-slate-700 text-xs leading-snug">{item}</span>
                  </label>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold">
                  Compliant with RBI / TRAI Regulatory Standards
                </span>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => setActiveSidePanel(null)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-xs transition-colors"
              >
                Approve Verification & Sign Off
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Meeting Controls Bar (Google Meet Style)                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="h-20 bg-white border-t border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0 relative">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Chime ID: {meeting.id}</span>
        </div>

        {/* Center Control Dock */}
        <div className="flex items-center gap-2.5 sm:gap-3 mx-auto">
          {/* Microphone Toggle + Device Dropdown Trigger */}
          <div className="relative">
            <div className="flex items-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors p-0.5">
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-full transition-all ${
                  isMicOn
                    ? 'text-slate-700'
                    : 'bg-rose-500 text-white shadow-md shadow-rose-200'
                }`}
                title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowDeviceMenu(showDeviceMenu === 'audio' ? null : 'audio')}
                className="px-1.5 py-3 text-slate-500 hover:text-slate-800"
                title="Select microphone device"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Audio Device Popover */}
            {showDeviceMenu === 'audio' && (
              <div className="absolute bottom-16 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                <div className="font-bold text-slate-800 mb-2">Microphone Device</div>
                <div className="space-y-1">
                  {audioInputDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={async () => {
                        setSelectedAudioInput(d.deviceId);
                        await chimeClientService.selectAudioInput(d.deviceId);
                        setShowDeviceMenu(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg truncate ${
                        selectedAudioInput === d.deviceId
                          ? 'bg-rose-50 text-rose-600 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Camera Toggle + Device Dropdown Trigger */}
          <div className="relative">
            <div className="flex items-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors p-0.5">
              <button
                onClick={handleToggleVideo}
                className={`p-3 rounded-full transition-all ${
                  isVideoOn
                    ? 'text-slate-700'
                    : 'bg-rose-500 text-white shadow-md shadow-rose-200'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowDeviceMenu(showDeviceMenu === 'video' ? null : 'video')}
                className="px-1.5 py-3 text-slate-500 hover:text-slate-800"
                title="Select camera device"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Device Popover */}
            {showDeviceMenu === 'video' && (
              <div className="absolute bottom-16 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                <div className="font-bold text-slate-800 mb-2">Camera Device</div>
                <div className="space-y-1">
                  {videoInputDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={async () => {
                        setSelectedVideoInput(d.deviceId);
                        await chimeClientService.selectVideoInput(d.deviceId);
                        setShowDeviceMenu(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg truncate ${
                        selectedVideoInput === d.deviceId
                          ? 'bg-rose-50 text-rose-600 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Screen Share (Chime Content Share) */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isScreenSharing
                ? 'bg-rose-100 text-rose-600 border border-rose-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Share your screen"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Captions Toggle */}
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              showCaptions
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle Live Captions"
          >
            <Subtitles className="w-5 h-5" />
          </button>

          {/* Leave Meeting (Standard Participant Leave) */}
          <button
            onClick={handleLeaveMeeting}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-colors flex items-center gap-1.5"
            title="Leave this meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* End Meeting for All (Organizer Privilege) */}
          <button
            onClick={handleEndMeetingForAll}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-full shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
            title="End meeting for everyone & generate AI summary"
          >
            <PowerOff className="w-4 h-4" />
            <span>End for All</span>
          </button>
        </div>

        {/* Right side connection indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Chime Media Live</span>
        </div>
      </footer>
    </div>
  );
};
