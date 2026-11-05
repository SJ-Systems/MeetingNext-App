import React, { useState } from 'react';
import {
  CalendarPlus,
  Mail,
  MessageSquare,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Clock,
  Phone,
  Send,
  Share2
} from 'lucide-react';
import { ScheduledMeeting, MeetingReason } from '../../types/meetingnext';
import { INITIAL_CUSTOMERS_LIST } from '../../db/meetingNextStore';
import { meetingNextApi } from '../../services/meetingNextApi';

interface ScheduleMeetingPageProps {
  onMeetingScheduled: (meeting: ScheduledMeeting) => void;
  onNavigateToMeetings: () => void;
}

export const ScheduleMeetingPage: React.FC<ScheduleMeetingPageProps> = ({
  onMeetingScheduled,
  onNavigateToMeetings,
}) => {
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reason, setReason] = useState<MeetingReason | string>('Loan Enrollment');
  const [date, setDate] = useState('Tomorrow');
  const [time, setTime] = useState('11:00 AM');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Loading & confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<ScheduledMeeting | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [directSentStatus, setDirectSentStatus] = useState<string | null>(null);

  // Quick autofill helper from known customer directory
  const handleSelectQuickCustomer = (c: { name: string; number: string; email: string }) => {
    setCustomerName(c.name);
    setCustomerNumber(c.number);
    setCustomerEmail(c.email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerNumber.trim()) return;

    setIsSubmitting(true);
    const email = customerEmail.trim() || `${customerName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

    try {
      const { meeting } = await meetingNextApi.scheduleMeeting({
        customerName: customerName.trim(),
        customerNumber: customerNumber.trim(),
        customerEmail: email,
        reason,
        date,
        time,
        durationMinutes,
      });

      onMeetingScheduled(meeting);
      setScheduledResult(meeting);

      // Reset inputs
      setCustomerName('');
      setCustomerNumber('');
      setCustomerEmail('');
    } catch (err) {
      console.error('Schedule failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const cleanNumber = scheduledResult?.customerNumber.replace(/[^\d+]/g, '') || '';
  const smsBodyText = scheduledResult
    ? `MeetingNext: Your verification meeting with Senior RM Sarthak Jain, CFA for ${scheduledResult.reason} is scheduled for ${scheduledResult.date} at ${scheduledResult.time}. Join link: ${scheduledResult.meetingLink}`
    : '';

  const gmailSubject = scheduledResult
    ? `Meeting Invitation: ${scheduledResult.reason} - MeetingNext`
    : '';
  const gmailBody = scheduledResult
    ? `Dear ${scheduledResult.customerName},\n\nYour banking consultation for ${scheduledResult.reason} has been confirmed.\n\nDate: ${scheduledResult.date}\nTime: ${scheduledResult.time} (${scheduledResult.durationMinutes} mins)\n\nJoin Video Room Link:\n${scheduledResult.meetingLink}\n\nRelationship Manager: Sarthak Jain, CFA\nMeetingNext Banking RTC`
    : '';

  return (
    <div className="flex-1 bg-white text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Schedule a Meeting
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Create an authenticated session for loan enrollment, bank account verification, or account opening.
          </p>
        </div>

        {/* Confirmation Banner if meeting was just scheduled */}
        {scheduledResult && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Meeting Successfully Scheduled & Link Dispatched!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Saved to database and added to your <strong>Upcoming Meetings</strong> list.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setScheduledResult(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Link & Dispatch receipts */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Customer & Purpose
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {scheduledResult.customerName} · {scheduledResult.reason}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Date & Time
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {scheduledResult.date} at {scheduledResult.time}
                  </span>
                </div>
              </div>

              {/* Automated Backend Receipt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-900 text-[11px]">
                        Message (SMS) Dispatched
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Delivered
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Recipient: {scheduledResult.customerNumber}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold text-slate-900 text-[11px]">
                        Gmail Invitation Dispatched
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                      Sent & Synced
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Recipient: {scheduledResult.customerEmail}
                  </div>
                </div>
              </div>

              {/* Direct interactive client send options so user can test and immediately send */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Interactive Customer Send & Delivery Controls:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Direct Phone SMS via Messages app */}
                  <a
                    href={`sms:${cleanNumber}?body=${encodeURIComponent(smsBodyText)}`}
                    onClick={() => setDirectSentStatus('SMS Messages app launched!')}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via Phone SMS App</span>
                  </a>

                  {/* Direct Gmail compose */}
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                      scheduledResult.customerEmail
                    )}&su=${encodeURIComponent(gmailSubject)}&body=${encodeURIComponent(gmailBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setDirectSentStatus('Gmail web invitation opened!')}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Gmail (Send Now)</span>
                  </a>

                  {/* WhatsApp send */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=${cleanNumber.replace('+', '')}&text=${encodeURIComponent(smsBodyText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>

                {directSentStatus && (
                  <div className="text-[11px] text-emerald-600 font-medium">
                    ✓ {directSentStatus}
                  </div>
                )}
              </div>

              {/* Copyable link */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={scheduledResult.meetingLink}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 font-mono text-xs text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(scheduledResult.meetingLink)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onNavigateToMeetings}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <span>View in My Meetings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Autofill Select from known customers */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Quick Customer Autofill:
          </span>
          <div className="flex flex-wrap gap-2">
            {INITIAL_CUSTOMERS_LIST.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectQuickCustomer(c)}
                className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 text-slate-700 text-xs font-medium transition-all"
              >
                + {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting Scheduling Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-sm shadow-slate-100 space-y-6 text-xs"
        >
          {/* Customer Details */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-2">
              1. Customer Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. David Sterling"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-rose-400 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">
                  Customer Phone Number (for SMS) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="e.g. +1 (415) 890-4412"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-rose-400 transition-colors"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-slate-600 font-semibold">
                  Customer Gmail Address (for Calendar Invite) *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. david.sterling@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-rose-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Meeting Purpose / Reason */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-2">
              2. Meeting Reason / Purpose
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Loan Enrollment', 'Bank Account Verification', 'Account Opening'] as const).map(
                (r) => {
                  const isSelected = reason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200 text-rose-700 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs">{r}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {r === 'Loan Enrollment' && 'Commercial & personal borrowing review'}
                        {r === 'Bank Account Verification' && 'KYC biometric ID & passport checks'}
                        {r === 'Account Opening' && 'Initial deposit & sweep setup'}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-2">
              3. Date & Time Selection
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Date</label>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-rose-400"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Nov 05, 2026">Thursday, Nov 05</option>
                  <option value="Nov 06, 2026">Friday, Nov 06</option>
                  <option value="Next Monday">Next Monday</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Start Time</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-rose-400"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-rose-400"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invitation Notice */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">
                Automatic Customer Dispatch
              </span>
              <p className="text-slate-500 text-[11px]">
                Upon scheduling, the meeting link will be dispatched to the customer via SMS Message
                and Gmail invitation automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white border border-rose-200 text-rose-600 text-[10px] font-bold">
                SMS + Gmail Both
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 active:scale-95 text-white rounded-full text-xs font-bold shadow-md shadow-rose-200 transition-all flex items-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Scheduling & Dispatching...' : 'Schedule Meeting & Dispatch Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
