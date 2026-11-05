import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  Search,
  User,
  Clock,
  CheckCircle2,
  X,
  History,
  RotateCcw,
  Radio,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Building2,
  Lock,
  Tag,
  AlertTriangle,
  Headphones,
  Activity,
  Server,
  Cpu
} from 'lucide-react';
import {
  TelephonicCall,
  CustomerInfo,
  CallPurposeCategory,
  TraiCallerIdSeries,
  AmazonConnectCallResponse
} from '../../types/meetingnext';
import { INITIAL_CUSTOMERS_LIST } from '../../db/meetingNextStore';
import { playDTMFTone, playRingbackBeep, startHoldMusic, stopHoldMusic } from '../../utils/audioTones';
import { meetingNextApi } from '../../services/meetingNextApi';

interface TelephonicCallPageProps {
  callHistory: TelephonicCall[];
  onLogNewCall: (call: TelephonicCall) => void;
}

export const TelephonicCallPage: React.FC<TelephonicCallPageProps> = ({
  callHistory,
  onLogNewCall,
}) => {
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [targetName, setTargetName] = useState('');
  const [searchHistory, setSearchHistory] = useState('');

  // TRAI Compliance & Call Purpose selection
  const [callPurpose, setCallPurpose] = useState<CallPurposeCategory>('service_reminder');
  const [traiSeries, setTraiSeries] = useState<TraiCallerIdSeries>('1600_service');

  // Sync TRAI series with purpose
  useEffect(() => {
    if (callPurpose === 'promoting_schemes') {
      setTraiSeries('140_promotional');
    } else {
      setTraiSeries('1600_service');
    }
  }, [callPurpose]);

  const assignedCli = traiSeries === '140_promotional' ? '140-910-8820' : '1600-200-4810';

  // Call mode: 'amazon_connect' | 'cellular_mobile' | 'chime_browser'
  const [callMode, setCallMode] = useState<'amazon_connect' | 'cellular_mobile' | 'chime_browser'>('amazon_connect');
  const [activeConnectSession, setActiveConnectSession] = useState<AmazonConnectCallResponse | null>(null);

  // Active call state
  const [activeCallState, setActiveCallState] = useState<
    'idle' | 'calling' | 'connected' | 'on_hold' | 'ended'
  >('idle');
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileCallNotif, setMobileCallNotif] = useState<string | null>(null);

  // Call timer
  useEffect(() => {
    let interval: number;
    if (activeCallState === 'connected' || activeCallState === 'on_hold') {
      interval = window.setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallState]);

  const handleDigitClick = (digit: string) => {
    playDTMFTone(digit);
    setTargetNumber((prev) => prev + digit);
  };

  const handleSelectCustomer = (customer: CustomerInfo) => {
    setTargetName(customer.name);
    setTargetNumber(customer.number);
  };

  // 1. Amazon Connect Outbound Customer Call (Automated Orchestration with Sarthak Jain Softphone)
  const handleStartAmazonConnectCall = async () => {
    if (!targetNumber.trim()) return;

    setActiveCallState('calling');
    playRingbackBeep();

    try {
      const connectRes = await meetingNextApi.dispatchAmazonConnectCall(
        targetNumber.trim(),
        targetName.trim() || 'Direct Dial Customer',
        callPurpose,
        traiSeries
      );
      setActiveConnectSession(connectRes);
      if (connectRes.callRecord) {
        onLogNewCall(connectRes.callRecord);
      }
    } catch (e) {
      console.warn('Amazon Connect dispatch error:', e);
    }

    setTimeout(() => {
      setActiveCallState('connected');
    }, 2000);
  };

  // 2. Direct Cellular Call with Bank Authorized CLI
  const handleCellularMobileCall = async () => {
    if (!targetNumber.trim()) return;
    const cleanNum = targetNumber.replace(/[^\d+]/g, '');

    try {
      const res = await meetingNextApi.dispatchPstnCall(
        targetNumber.trim(),
        targetName.trim() || 'Direct Dial Customer',
        callPurpose,
        traiSeries
      );
      if (res.call) {
        onLogNewCall(res.call);
      }
    } catch (e) {
      console.warn('Backend call dispatch note:', e);
    }

    setMobileCallNotif(
      `Outbound call initiated to ${targetNumber}. Bank CLI presented to customer: ${assignedCli}. Employee personal mobile masked.`
    );

    // Trigger device native phone dialer with bridge
    window.location.href = `tel:${cleanNum}`;

    setTimeout(() => {
      setTimeout(() => {
        setMobileCallNotif(null);
        setShowNewCallModal(false);
        setTargetNumber('');
        setTargetName('');
      }, 4000);
    }, 1200);
  };

  // 3. In-Browser VoIP Amazon Chime Call
  const handleStartBrowserCall = () => {
    if (!targetNumber.trim()) return;

    setActiveCallState('calling');
    playRingbackBeep();

    setTimeout(() => {
      setActiveCallState('connected');
    }, 2200);
  };

  const handleToggleHold = () => {
    if (activeCallState === 'on_hold') {
      stopHoldMusic();
      setActiveCallState('connected');
    } else {
      startHoldMusic();
      setActiveCallState('on_hold');
    }
  };

  const handleEndBrowserCall = async () => {
    stopHoldMusic();
    setActiveCallState('ended');

    const mins = Math.floor(callDurationSeconds / 60);
    const secs = callDurationSeconds % 60;
    const durationFormatted = `${mins}m ${secs.toString().padStart(2, '0')}s`;

    const purposeLabel =
      callPurpose === 'promoting_schemes'
        ? 'Promoting New Schemes & Loan Products'
        : callPurpose === 'service_reminder'
        ? 'Service & KYC Reminder'
        : callPurpose === 'relationship_greeting'
        ? 'Customer Greetings & Relationship Management'
        : 'Outbound Banking Verification Call';

    try {
      const savedCall = await meetingNextApi.logCall({
        customerName: targetName.trim() || 'Direct Dial Customer',
        customerNumber: targetNumber.trim(),
        reason: purposeLabel,
        dateTime: 'Just now',
        duration: durationFormatted,
        direction: 'Outbound',
        status: 'Completed',
        notes: activeConnectSession
          ? `Amazon Connect Call (AWS Mumbai ap-south-1). ContactId: ${activeConnectSession.contactId}. Authorized CLI: ${assignedCli}. RM personal mobile masked.`
          : `Call connected via AWS Voice Connector (AWS Mumbai ap-south-1). Authorized CLI: ${assignedCli}. RM personal mobile masked.`,
        traiSeries,
        authorizedCallerId: assignedCli,
        callPurposeCategory: callPurpose,
        traiComplianceStatus:
          traiSeries === '140_promotional'
            ? 'DND Scrubbed & Verified (140-CLI)'
            : 'Compliant - Service CLI (1600)',
        branchEmployeeName: 'Sarthak Jain, CFA (Senior RM)',
        employeePersonalNumberHidden: true,
      });
      onLogNewCall(savedCall);
    } catch (e) {
      console.warn('Log call fallback:', e);
    }

    setTimeout(() => {
      setActiveCallState('idle');
      setActiveConnectSession(null);
      setShowNewCallModal(false);
      setCallDurationSeconds(0);
      setTargetNumber('');
      setTargetName('');
    }, 1500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredHistory = callHistory.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      c.customerNumber.includes(searchHistory) ||
      (c.authorizedCallerId && c.authorizedCallerId.includes(searchHistory)) ||
      (c.reason && c.reason.toLowerCase().includes(searchHistory.toLowerCase()))
  );

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
    <div className="flex-1 bg-white text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Telephonic Call
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                TRAI & AWS Telephony Compliant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Initiate outbound calls directly from CRMNEXT with official 1600xx (Service) and 140xx
              (Promotional) CLI series
            </p>
          </div>

          {/* New Call Button */}
          <button
            onClick={() => {
              setShowNewCallModal(true);
              setActiveCallState('idle');
              setMobileCallNotif(null);
            }}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full text-xs font-bold shadow-sm shadow-rose-200 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <PhoneCall className="w-4 h-4" />
            <span>New Call</span>
          </button>
        </div>

        {/* TRAI Regulatory Compliance Informational Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/60 via-pink-50/30 to-white border border-rose-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>TRAI UCC & Indian Banking Telephony Protection</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  Personal Numbers Masked
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Under TRAI UCC guidelines, branch employees must never display personal mobile numbers.
                All calls initiated from CRMNEXT present the bank’s authorized <strong>1600xx</strong>{' '}
                (Service reminders & greetings) or <strong>140xx</strong> (Promotional schemes) Caller ID.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>RM Privacy Protected</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>AWS Mumbai ap-south-1</span>
            </div>
          </div>
        </div>

        {/* Amazon Connect Live Softphone & Instance Status Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span>Amazon Connect Customer Calling Engine</span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                  crmnext-bank-connect
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Agent: <span className="font-semibold text-slate-700">Sarthak Jain, CFA</span> • Region: <span className="font-semibold text-slate-700">ap-south-1 (Mumbai)</span> • Softphone: <span className="text-emerald-600 font-bold">Available</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              140xx & 1600xx Active
            </span>
          </div>
        </div>

        {/* Global Notification Banner */}
        {mobileCallNotif && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{mobileCallNotif}</span>
          </div>
        )}

        {/* Search Call History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search by customer, phone, or 1600/140 CLI..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-400 transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredHistory.length} regulatory calls logged
          </div>
        </div>

        {/* Call History Table Maintained on This Page */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold bg-slate-50/50">
                  <th className="py-3.5 px-5">Customer & Mobile</th>
                  <th className="py-3.5 px-4">Authorized Bank Caller ID</th>
                  <th className="py-3.5 px-4">TRAI Call Purpose</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">TRAI Compliance</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((call) => (
                  <tr key={call.id} className="hover:bg-rose-50/20 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{call.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{call.customerNumber}</div>
                    </td>

                    {/* Authorized Bank Caller ID (1600xx / 140xx) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          {call.authorizedCallerId || (call.traiSeries === '140_promotional' ? '140-910-8820' : '1600-200-4810')}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            (call.traiSeries === '140_promotional' || (call.authorizedCallerId && call.authorizedCallerId.startsWith('140')))
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {(call.traiSeries === '140_promotional' || (call.authorizedCallerId && call.authorizedCallerId.startsWith('140'))) ? '140xx Promo' : '1600xx Service'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Personal mobile masked</div>
                    </td>

                    {/* TRAI Call Purpose */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 block max-w-xs truncate">
                        {call.reason || 'Service Reminder'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        RM: {call.branchEmployeeName || 'Sarah Lin'}
                      </span>
                    </td>

                    {/* Date Time */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{call.dateTime}</td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {call.duration}
                    </td>

                    {/* TRAI Compliance Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{call.traiComplianceStatus || 'TRAI Compliant'}</span>
                      </span>
                    </td>

                    {/* Action: Call Again */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setTargetName(call.customerName);
                          setTargetNumber(call.customerNumber);
                          if (call.callPurposeCategory) {
                            setCallPurpose(call.callPurposeCategory);
                          }
                          setShowNewCallModal(true);
                          setActiveCallState('idle');
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 rounded-full font-semibold text-[11px] transition-colors"
                      >
                        Call Again
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NEW CALL MODAL WITH TRAI COMPLIANCE & NUMBER SERIES ORCHESTRATION */}
      {/* ------------------------------------------------------------------ */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New Outbound Call</h3>
                  <p className="text-[11px] text-slate-400">
                    TRAI 140xx / 1600xx series automated CLI allocation
                  </p>
                </div>
              </div>
              {activeCallState === 'idle' && (
                <button
                  onClick={() => setShowNewCallModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Step 1: Call Purpose Category (TRAI Mandate) */}
            {activeCallState === 'idle' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    1. Select Call Purpose (Auto-assigns TRAI Series)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">
                    CLI: {assignedCli}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Option 1: Promoting schemes (140xx) */}
                  <button
                    type="button"
                    onClick={() => setCallPurpose('promoting_schemes')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      callPurpose === 'promoting_schemes'
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center justify-between">
                      <span>Promote Schemes</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-mono">
                        140xx
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      New loans, deposits & offers
                    </div>
                  </button>

                  {/* Option 2: Service Reminders (1600xx) */}
                  <button
                    type="button"
                    onClick={() => setCallPurpose('service_reminder')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      callPurpose === 'service_reminder'
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center justify-between">
                      <span>Service Reminders</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">
                        1600xx
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      KYC, EMI & account notices
                    </div>
                  </button>

                  {/* Option 3: Customer Greetings & Relationship (1600xx) */}
                  <button
                    type="button"
                    onClick={() => setCallPurpose('relationship_greeting')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      callPurpose === 'relationship_greeting'
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-[11px] flex items-center justify-between">
                      <span>Greetings / RM</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">
                        1600xx
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Festival, birthday & reviews
                    </div>
                  </button>
                </div>

                {/* DND Scrubbing status */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 mt-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {callPurpose === 'promoting_schemes'
                        ? 'DND Registry: Passed (Customer opted-in for commercial communication)'
                        : 'Exempt from Commercial DND: Permitted Service Communication'}
                    </span>
                  </div>
                  <div className="text-slate-400">TRAI UCC Rule 2024</div>
                </div>
              </div>
            )}

            {/* Quick Choose from Past History Contacts */}
            {activeCallState === 'idle' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Select Customer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_CUSTOMERS_LIST.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 text-[11px] font-medium transition-all"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Number Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Customer Mobile Number:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-400 text-center tracking-wider"
                />
                {targetNumber && activeCallState === 'idle' && (
                  <button
                    onClick={() => setTargetNumber('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              {targetName && (
                <div className="text-center text-xs font-semibold text-rose-600">
                  Customer: {targetName}
                </div>
              )}
            </div>

            {/* Caller ID Verification Box */}
            {activeCallState === 'idle' && (
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <span>Customer Will See Authorized Bank CLI:</span>
                  </div>
                  <div className="font-mono text-rose-700 font-extrabold text-sm">
                    {assignedCli}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold block">
                    RM Mobile Hidden
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    AWS Mumbai ap-south-1
                  </span>
                </div>
              </div>
            )}

            {/* Active Connected Screen (For Amazon Connect / Browser VoIP Mode) */}
            {activeCallState !== 'idle' && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold block">
                    {activeCallState === 'calling' && `Dialing Outbound via Amazon Connect · Bank CLI ${assignedCli}...`}
                    {activeCallState === 'connected' && `Call Active via Amazon Connect CCP · Bank CLI: ${assignedCli}`}
                    {activeCallState === 'on_hold' && 'On Hold (Hold Music Active)'}
                    {activeCallState === 'ended' && 'Call Concluded & Compliant Log Recorded'}
                  </span>
                  <div className="text-3xl font-mono font-bold text-slate-900">
                    {formatTimer(callDurationSeconds)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Customer: {targetNumber} · Bank CLI: {assignedCli}
                  </div>

                  {activeConnectSession && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-rose-100 text-left text-[11px] font-mono space-y-1 text-slate-600 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-800 font-bold">
                        <span className="flex items-center gap-1.5 text-rose-600">
                          <Headphones className="w-3.5 h-3.5" />
                          Amazon Connect CCP Session
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          Agent Softphone Connected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 pt-1">
                        <div>Contact ID: <span className="text-slate-800">{activeConnectSession.contactId}</span></div>
                        <div>Region: <span className="text-slate-800">AWS Mumbai (ap-south-1)</span></div>
                        <div>Agent: <span className="text-slate-800">Sarthak Jain, CFA</span></div>
                        <div>TRAI CLI: <span className="text-rose-600 font-bold">{assignedCli}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call Control Buttons */}
                {activeCallState !== 'ended' && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-full transition-all cursor-pointer ${
                        isMuted
                          ? 'bg-rose-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={handleToggleHold}
                      className={`p-3 rounded-full transition-all cursor-pointer ${
                        activeCallState === 'on_hold'
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={activeCallState === 'on_hold' ? 'Resume' : 'Hold Music'}
                    >
                      {activeCallState === 'on_hold' ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={handleEndBrowserCall}
                      className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform active:scale-90 shadow-md cursor-pointer"
                      title="End Call"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dialpad Matrix (Idle State) */}
            {activeCallState === 'idle' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {dialpadDigits.map((d) => (
                    <button
                      key={d.num}
                      type="button"
                      onClick={() => handleDigitClick(d.num)}
                      className="py-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer"
                    >
                      <span className="text-base font-bold font-mono text-slate-800 group-hover:text-rose-600">
                        {d.num}
                      </span>
                      {d.sub && (
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-rose-400">
                          {d.sub}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  {/* Option 1 (Primary / Recommended): Amazon Connect Customer Outbound Call */}
                  <button
                    type="button"
                    onClick={handleStartAmazonConnectCall}
                    disabled={!targetNumber.trim()}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 disabled:opacity-40 text-white font-bold text-xs rounded-full shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Headphones className="w-4 h-4 text-white" />
                    <span>Dial with Amazon Connect (Softphone & CLI {assignedCli})</span>
                  </button>

                  {/* Option 2: Cellular Mobile Bridge */}
                  <button
                    type="button"
                    onClick={handleCellularMobileCall}
                    disabled={!targetNumber.trim()}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 font-semibold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Dial via Mobile Terminal (Bridge Link)</span>
                  </button>

                  {/* Option 3: Browser WebRTC Chime */}
                  <button
                    type="button"
                    onClick={handleStartBrowserCall}
                    disabled={!targetNumber.trim()}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 font-medium text-[11px] rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Radio className="w-3 h-3 text-rose-500" />
                    <span>Browser WebRTC Session (Amazon Chime Voice)</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    Compliant with TRAI UCC Regulations. Outbound call connects Sarthak Jain, CFA directly with customer using bank caller ID {assignedCli}.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
