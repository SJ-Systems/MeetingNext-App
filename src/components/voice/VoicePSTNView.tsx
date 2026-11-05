import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  FileText,
  UserCheck,
  ShieldCheck,
  Server,
  Save,
  CheckCircle2
} from 'lucide-react';
import { ActiveCallState, CustomerCRMRecord, UserProfile } from '../../types';
import { playDTMFTone, playRingbackBeep, startHoldMusic, stopHoldMusic } from '../../utils/audioTones';

interface VoicePSTNViewProps {
  currentUser: UserProfile;
  crmRecord: CustomerCRMRecord;
  initialPhoneNumber?: string;
}

export const VoicePSTNView: React.FC<VoicePSTNViewProps> = ({
  currentUser,
  crmRecord,
  initialPhoneNumber = '',
}) => {
  const [inputNumber, setInputNumber] = useState(initialPhoneNumber || '+1 (415) 890-4412');
  const [callState, setCallState] = useState<ActiveCallState>({
    status: 'idle',
    direction: 'outbound',
    phoneNumber: '',
    durationSeconds: 0,
    isMuted: false,
    isOnHold: false,
    isRecording: false,
    dtmfLog: [],
  });

  const [callNotes, setCallNotes] = useState(
    'Customer called to confirm wire routing instructions for commercial mortgage deposit. Verified caller voice identity and linked CRM Ticket TCK-2024-88.'
  );
  const [notesSaved, setNotesSaved] = useState(false);
  const [showKeypadInCall, setShowKeypadInCall] = useState(false);

  // Call duration counter
  useEffect(() => {
    let interval: number;
    if (callState.status === 'connected' || callState.status === 'on_hold') {
      interval = window.setInterval(() => {
        setCallState((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.status]);

  // Handle DTMF button click
  const handleDigitClick = (digit: string) => {
    playDTMFTone(digit);
    if (callState.status === 'connected' || callState.status === 'on_hold') {
      setCallState((prev) => ({
        ...prev,
        dtmfLog: [...prev.dtmfLog, digit],
      }));
    } else {
      setInputNumber((prev) => prev + digit);
    }
  };

  // Start Outbound Call
  const startOutboundCall = () => {
    if (!inputNumber.trim()) return;

    setCallState({
      status: 'dialing',
      direction: 'outbound',
      phoneNumber: inputNumber,
      callerName: inputNumber.includes('4412') ? 'David Sterling' : 'Outbound Customer',
      customerProfile: inputNumber.includes('4412') ? crmRecord : undefined,
      durationSeconds: 0,
      isMuted: false,
      isOnHold: false,
      isRecording: false,
      dtmfLog: [],
    });

    playRingbackBeep();

    // Simulate PSTN connection after 2 seconds
    setTimeout(() => {
      setCallState((prev) => ({
        ...prev,
        status: 'connected',
      }));
    }, 2200);
  };

  // Simulate Inbound Banking Call from Customer
  const triggerInboundSimulation = () => {
    setCallState({
      status: 'ringing',
      direction: 'inbound',
      phoneNumber: '+1 (415) 890-4412',
      callerName: 'David Sterling (Private Wealth Client)',
      customerProfile: crmRecord,
      durationSeconds: 0,
      isMuted: false,
      isOnHold: false,
      isRecording: true,
      dtmfLog: [],
    });

    playRingbackBeep();
  };

  // Answer Inbound Call
  const answerCall = () => {
    setCallState((prev) => ({
      ...prev,
      status: 'connected',
    }));
  };

  // Hangup / End Call
  const endCall = () => {
    stopHoldMusic();
    setCallState((prev) => ({
      ...prev,
      status: 'ended',
    }));
    setTimeout(() => {
      setCallState((prev) => ({
        ...prev,
        status: 'idle',
        durationSeconds: 0,
        dtmfLog: [],
      }));
    }, 1800);
  };

  // Hold / Resume Toggle with synthesized hold music
  const toggleHold = () => {
    if (callState.isOnHold) {
      stopHoldMusic();
      setCallState((prev) => ({ ...prev, isOnHold: false, status: 'connected' }));
    } else {
      startHoldMusic();
      setCallState((prev) => ({ ...prev, isOnHold: true, status: 'on_hold' }));
    }
  };

  // Mute Toggle
  const toggleMute = () => {
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  // Transfer Call
  const transferCall = (targetName: string) => {
    alert(`Transferring call to ${targetName} via Chime Voice Connector SIP REFER.`);
    setCallState((prev) => ({
      ...prev,
      transferredTo: targetName,
    }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialpadDigits = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' },
    { num: '0', sub: '+' },
    { num: '#', sub: '' },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Amazon Chime Voice Connector & PSTN SIP Trunk
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise SIP softphone for banking relationship managers and CRM contact centers with
              real Web Audio DTMF synthesis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerInboundSimulation}
              disabled={callState.status !== 'idle'}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <PhoneIncoming className="w-3.5 h-3.5" />
              <span>Simulate Inbound Bank Call</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
              <Server className="w-3.5 h-3.5" />
              <span>SIP Trunk Active · 22ms</span>
            </div>
          </div>
        </div>

        {/* Incoming Call Alert Modal / Banner */}
        {callState.status === 'ringing' && (
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-lg p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <PhoneIncoming className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                  Inbound PSTN SIP Call
                </div>
                <div className="text-base font-bold text-white">{callState.callerName}</div>
                <div className="text-xs text-slate-400 font-mono">{callState.phoneNumber}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={answerCall}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 shadow-lg transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Answer Call</span>
              </button>
              <button
                onClick={endCall}
                className="px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Connected Call Screen */}
        {(callState.status === 'connected' || callState.status === 'on_hold') && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white ${
                    callState.isOnHold ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  {callState.callerName?.[0] || 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{callState.callerName}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        callState.isOnHold
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {callState.isOnHold ? 'ON HOLD (Playing Music)' : 'CONNECTED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {callState.phoneNumber} · G.711u / SRTP Encrypted · Codec Opus
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Call Duration</div>
                  <div className="text-xl font-mono font-bold text-white">
                    {formatTimer(callState.durationSeconds)}
                  </div>
                </div>

                <button
                  onClick={endCall}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <button
                onClick={toggleMute}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-colors ${
                  callState.isMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {callState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{callState.isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              <button
                onClick={toggleHold}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-colors ${
                  callState.isOnHold
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {callState.isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{callState.isOnHold ? 'Resume Call' : 'Hold Music'}</span>
              </button>

              <button
                onClick={() => transferCall('Marcus Vance (Wealth Advisor)')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <PhoneForwarded className="w-4 h-4 text-blue-400" />
                <span>Transfer Call</span>
              </button>

              <button
                onClick={() => setShowKeypadInCall(!showKeypadInCall)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <span>DTMF Keypad</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 rounded text-xs text-rose-300 font-mono">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Media Pipeline Capture Active</span>
              </div>
            </div>

            {/* In-Call Keypad (if open) */}
            {showKeypadInCall && (
              <div className="max-w-xs mx-auto bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-center text-xs text-slate-400 mb-2">Send In-Call DTMF Tones</div>
                <div className="grid grid-cols-3 gap-2">
                  {dialpadDigits.map((d) => (
                    <button
                      key={d.num}
                      onClick={() => handleDigitClick(d.num)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-sm font-semibold transition-colors"
                    >
                      {d.num}
                    </button>
                  ))}
                </div>
                {callState.dtmfLog.length > 0 && (
                  <div className="mt-2 text-center text-[11px] font-mono text-emerald-400">
                    Sent digits: {callState.dtmfLog.join(' ')}
                  </div>
                )}
              </div>
            )}

            {/* Split: Customer Profile & Real-Time Call Notepad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer 360 lookup */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      CRMNEXT Caller Identity
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Voice Biometrics Matched
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Customer Name</span>
                    <span className="font-semibold text-white">{crmRecord.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Account Portfolio</span>
                    <span className="font-semibold font-mono text-emerald-400">
                      {crmRecord.portfolioValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Active Lending Facility</span>
                    <span className="text-slate-200">Commercial Jumbo ($1.8M)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">KYC / Compliance</span>
                    <span className="text-slate-200">Verified (Tier-1 VIP)</span>
                  </div>
                </div>
              </div>

              {/* Call Summary Notepad */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        CRM Call Log Notes
                      </span>
                    </div>
                    {notesSaved && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Saved to Ticket
                      </span>
                    )}
                  </div>
                  <textarea
                    value={callNotes}
                    onChange={(e) => {
                      setCallNotes(e.target.value);
                      setNotesSaved(false);
                    }}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setNotesSaved(true);
                    setTimeout(() => setNotesSaved(false), 3000);
                  }}
                  className="self-end px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Sync to CRMNEXT Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Softphone Dialer & Dialpad (Idle State) */}
        {callState.status === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Telephone Dialpad */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>PSTN Outbound Softphone</span>
                <span className="text-[10px] font-mono text-slate-400">AWS Chime Voice</span>
              </div>

              {/* Number Display Input */}
              <div className="relative">
                <input
                  type="text"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  placeholder="Enter telephone number..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-lg font-mono text-white text-center tracking-wider focus:outline-none focus:border-blue-500"
                />
                {inputNumber && (
                  <button
                    onClick={() => setInputNumber('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dialpad Matrix */}
              <div className="grid grid-cols-3 gap-3">
                {dialpadDigits.map((d) => (
                  <button
                    key={d.num}
                    onClick={() => handleDigitClick(d.num)}
                    className="py-3 px-2 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-lg flex flex-col items-center justify-center transition-colors group"
                  >
                    <span className="text-lg font-bold font-mono text-white group-active:scale-110 transition-transform">
                      {d.num}
                    </span>
                    {d.sub && (
                      <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-200 tracking-widest">
                        {d.sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Dial Call Button */}
              <button
                onClick={startOutboundCall}
                disabled={!inputNumber.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Number</span>
              </button>
            </div>

            {/* Right 7 Cols: Quick Banking Speed Dials & SIP Configuration */}
            <div className="md:col-span-7 space-y-4">
              {/* Quick Customer Speed Dials */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Verified Customer Directory (CRMNEXT)</span>
                  <span className="text-[10px] text-slate-500">1-Click Dial</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">David Sterling</div>
                      <div className="text-[11px] text-slate-400">Managing Partner, Aurora · +1 (415) 890-4412</div>
                    </div>
                    <button
                      onClick={() => {
                        setInputNumber('+1 (415) 890-4412');
                        startOutboundCall();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Elena Rostova</div>
                      <div className="text-[11px] text-slate-400">Chief Compliance Auditor · +1 (212) 555-0194</div>
                    </div>
                    <button
                      onClick={() => {
                        setInputNumber('+1 (212) 555-0194');
                        startOutboundCall();
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">Omnichannel Loan Escrow Desk</div>
                      <div className="text-[11px] text-slate-400">Tier-2 Queue #88 · +1 (800) 849-2041</div>
                    </div>
                    <button
                      onClick={() => {
                        setInputNumber('+1 (800) 849-2041');
                        startOutboundCall();
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AWS Voice Connector Infrastructure Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Amazon Chime Voice Connector Details</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Outbound Host</span>
                    <span className="font-mono text-slate-200 text-[11px]">apex-vc.chime.aws</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Encryption</span>
                    <span className="font-mono text-emerald-400 text-[11px]">TLS 1.3 / SRTP</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">PSTN Origination</span>
                    <span className="font-mono text-slate-200 text-[11px]">Enabled (USA/EUR)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
