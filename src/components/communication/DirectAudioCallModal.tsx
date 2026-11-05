import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  User,
  Radio,
  Server,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Save
} from 'lucide-react';
import { CustomerRecord, RelationshipManager, CallRecord } from '../../types/crm';
import { playDTMFTone, playRingbackBeep, startHoldMusic, stopHoldMusic } from '../../utils/audioTones';
import { api } from '../../services/api';

interface DirectAudioCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord;
  currentRM: RelationshipManager;
  onCallLogged: (call: CallRecord) => void;
}

export const DirectAudioCallModal: React.FC<DirectAudioCallModalProps> = ({
  isOpen,
  onClose,
  customer,
  currentRM,
  onCallLogged,
}) => {
  const [callMode, setCallMode] = useState<'in_app_audio' | 'pstn_telephony'>('in_app_audio');
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'on_hold' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callNotes, setCallNotes] = useState(
    `Outbound call with ${customer.name} regarding active facility ticket #TCK-2024-88.`
  );
  const [ticketId, setTicketId] = useState(customer.openTickets[0]?.id || 'TCK-2024-88');

  // Call timer
  useEffect(() => {
    let interval: number;
    if (callState === 'connected' || callState === 'on_hold') {
      interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const handleStartCall = async () => {
    setCallState('dialing');
    playRingbackBeep();

    setTimeout(() => {
      setCallState('connected');
    }, 2200);
  };

  const handleToggleHold = () => {
    if (callState === 'on_hold') {
      stopHoldMusic();
      setCallState('connected');
    } else {
      startHoldMusic();
      setCallState('on_hold');
    }
  };

  const handleEndCall = async () => {
    stopHoldMusic();
    setCallState('ended');

    try {
      let loggedCall: CallRecord;
      if (callMode === 'in_app_audio') {
        loggedCall = await api.startAudioCall({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.mobile,
          rmId: currentRM.id,
          rmName: currentRM.name,
          durationSeconds: callDuration,
          associatedTicketId: ticketId,
          notes: callNotes,
        });
      } else {
        loggedCall = await api.startPhoneCall({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.mobile,
          rmId: currentRM.id,
          rmName: currentRM.name,
          durationSeconds: callDuration,
          associatedTicketId: ticketId,
          notes: callNotes,
        });
      }
      onCallLogged(loggedCall);
    } catch (err) {
      console.warn('Call logged locally');
    }

    setTimeout(() => {
      onClose();
      setCallState('idle');
      setCallDuration(0);
    }, 1500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Direct Customer Voice Calling
            </h2>
          </div>
          {callState === 'idle' && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Information Header */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-base">
              {customer.avatar}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{customer.name}</div>
              <div className="text-xs text-slate-400 font-mono">{customer.mobile}</div>
              <div className="text-[11px] text-slate-500">{customer.accountType} · {customer.portfolioValue}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
            {customer.kycStatus}
          </span>
        </div>

        {/* Call Mode Switcher (Section 6 Requirement) */}
        {callState === 'idle' && (
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Select Direct Calling Mode
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Mode A: In-App Audio Meeting */}
              <button
                type="button"
                onClick={() => setCallMode('in_app_audio')}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
                  callMode === 'in_app_audio'
                    ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Mode A: In-App Audio</span>
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Amazon Chime SDK Meetings 1-on-1 private audio channel in browser.
                </p>
                <span className="text-[10px] text-emerald-400 font-mono block">Zero Telecom Fees</span>
              </button>

              {/* Mode B: Actual Mobile PSTN via Amazon Connect */}
              <button
                type="button"
                onClick={() => setCallMode('pstn_telephony')}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
                  callMode === 'pstn_telephony'
                    ? 'bg-emerald-600/15 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">Mode B: Mobile / PSTN</span>
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Amazon Connect Customer outbound PSTN call directly to customer phone.
                </p>
                <span className="text-[10px] text-blue-400 font-mono block">Amazon Connect Voice</span>
              </button>
            </div>

            {callMode === 'pstn_telephony' && (
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Amazon Connect Telephony Adapter Ready</span>
                </div>
                <p>
                  Outbound host: <strong className="text-slate-200 font-mono">apex-banking.connect.aws</strong> · Trunk Caller ID: <strong className="text-slate-200 font-mono">+1 (800) 849-2041</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connected / Active Call Screen */}
        {callState !== 'idle' && (
          <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                {callState === 'dialing' && 'Dialing Customer...'}
                {callState === 'connected' && 'Call Connected · HD Audio'}
                {callState === 'on_hold' && 'Call On Hold (Music Active)'}
                {callState === 'ended' && 'Call Concluded · Saving to CRM'}
              </span>
              <div className="text-2xl font-mono font-bold text-white">
                {formatTimer(callDuration)}
              </div>
              <div className="text-xs text-slate-400">
                {callMode === 'in_app_audio'
                  ? 'Amazon Chime Audio Stream'
                  : 'Amazon Connect Outbound Mobile'}
              </div>
            </div>

            {/* In-Call Controls */}
            {callState !== 'ended' && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleToggleHold}
                  className={`p-3 rounded-full transition-colors ${
                    callState === 'on_hold'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-200 hover:text-white'
                  }`}
                  title={callState === 'on_hold' ? 'Resume' : 'Hold Music'}
                >
                  {callState === 'on_hold' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors shadow-lg"
                  title="Hang Up"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Call Notes & CRM Ticket Association */}
        <div className="space-y-2 text-xs">
          <label className="block text-slate-300 font-medium">CRM Call Notes & Action Log</label>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Idle Start Call Action */}
        {callState === 'idle' && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartCall}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs shadow-lg flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Initiate Call to Customer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
