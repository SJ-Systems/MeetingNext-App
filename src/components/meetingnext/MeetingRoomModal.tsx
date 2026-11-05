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
  Sparkles,
  Maximize2,
  Info,
  CheckCircle2,
  FileCheck,
  Send,
  Zap,
  Subtitles
} from 'lucide-react';
import { ScheduledMeeting } from '../../types/meetingnext';

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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'info' | 'verification' | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);

  // In-call chat
  const [chatMessages, setChatMessages] = useState<
    { sender: string; time: string; text: string; isRm: boolean }[]
  >([
    {
      sender: 'System (Chime SDK)',
      time: 'Just now',
      text: 'Encrypted peer-to-peer media session established via us-east-1.',
      isRm: false,
    },
    {
      sender: meeting.customerName,
      time: 'Just now',
      text: `Hello! I have my documents ready for ${meeting.reason}.`,
      isRm: false,
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Live Captions / Transcription ticker
  const [currentCaption, setCurrentCaption] = useState(
    `Relationship Manager: Good morning ${meeting.customerName}, let us verify your banking credentials.`
  );

  // Call duration counter
  const [callSeconds, setCallSeconds] = useState(0);

  // Local Video ref
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: number;
    if (isOpen) {
      timer = window.setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  // Caption switcher
  useEffect(() => {
    if (!isOpen) return;
    const captionsList = [
      `Relationship Manager: Welcome to MeetingNext secure video room.`,
      `${meeting.customerName}: Can you verify my identity document for ${meeting.reason}?`,
      `Relationship Manager: Everything looks clear on our end. Identity validated.`,
      `${meeting.customerName}: Thank you, this process is so convenient!`,
      `Relationship Manager: We have dispatched the confirmation packet to your Gmail and phone.`,
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % captionsList.length;
      setCurrentCaption(captionsList[idx]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, meeting]);

  // Handle local camera
  useEffect(() => {
    if (isOpen && isVideoOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera unavailable in preview frame; graceful fallback
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, isVideoOn]);

  if (!isOpen) return null;

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Sarah Lin (RM)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim(),
        isRm: true,
      },
    ]);
    setChatInput('');
  };

  const handleEndCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (onCompleteMeeting) {
      onCompleteMeeting(meeting.id);
    }
    onLeaveMeeting();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200">
      {/* ------------------------------------------------------------------ */}
      {/* Top Header: Clean Google Meet Style with Warm Pink Accent          */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-xs">
            <Video className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">MeetingNext Room</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200/50">
                {meeting.reason}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Customer: {meeting.customerName} · {meeting.customerNumber}
            </div>
          </div>
        </div>

        {/* Center: Call Timer & Chime Free Tier Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{formatCallTime(callSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-600 font-medium px-2.5 py-1 rounded-full bg-emerald-50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Amazon Chime WebRTC · Free Tier</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setActiveSidePanel(activeSidePanel === 'verification' ? null : 'verification')
            }
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
      {/* Main Video Arena & Side Panels                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-4 bg-slate-50/50">
        {/* Video Canvas Area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            {/* Participant 1: Customer (Primary Remote Stream) */}
            <div className="relative rounded-3xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm border border-slate-200 group">
              {/* Futuristic Video Simulation / Stream */}
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

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-white text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Audio/Video HD Connected</span>
              </div>
            </div>

            {/* Participant 2: Relationship Manager (Local Feed) */}
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
                    SL
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-white font-bold text-base">Sarah Lin (You)</h4>
                    <p className="text-slate-400 text-xs">Relationship Manager · Camera Off</p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full text-white text-xs font-medium flex items-center gap-2">
                <span>Sarah Lin (RM)</span>
                {!isMicOn && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>
          </div>

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
        {/* Side Panel: In-Call Chat                                           */}
        {/* ------------------------------------------------------------------ */}
        {activeSidePanel === 'chat' && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Meeting Chat</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
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

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a message to client..."
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
                <h3 className="font-bold text-slate-900 text-sm">KYC & Loan Verification</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
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
                  Compliant with Banking Regulatory Standards
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
      {/* Bottom Meeting Controls Dock (Clean, Rounded, Google Meet Style)   */}
      {/* ------------------------------------------------------------------ */}
      <footer className="h-20 bg-white border-t border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Room: mtg-chime-8491</span>
        </div>

        {/* Center Dock of Buttons */}
        <div className="flex items-center gap-3 mx-auto">
          {/* Mute Button */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isMicOn
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-rose-500 text-white shadow-md shadow-rose-200'
            }`}
            title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isVideoOn
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-rose-500 text-white shadow-md shadow-rose-200'
            }`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
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

          {/* End Call / Leave Meeting (Red Pill) */}
          <button
            onClick={handleEndCall}
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-lg shadow-rose-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Meeting</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Secure Chime RTC</span>
        </div>
      </footer>
    </div>
  );
};
