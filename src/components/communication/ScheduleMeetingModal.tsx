import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  PhoneCall,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  Send,
  X,
  ShieldCheck
} from 'lucide-react';
import { CustomerRecord, RelationshipManager, MeetingItem } from '../../types/crm';
import { api } from '../../services/api';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  allRMs: RelationshipManager[];
  currentRM: RelationshipManager;
  preSelectedCustomer?: CustomerRecord | null;
  onMeetingScheduled: (meeting: MeetingItem) => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  customers,
  allRMs,
  currentRM,
  preSelectedCustomer,
  onMeetingScheduled,
}) => {
  // Form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preSelectedCustomer?.id || customers[0]?.id || ''
  );
  const [selectedRmId, setSelectedRmId] = useState<string>(currentRM.id);
  const [title, setTitle] = useState('Commercial Credit & Mortgage Review');
  const [description, setDescription] = useState(
    'Formal review of underwriting conditions, interest rate lock hedge, and execution timeline.'
  );
  const [agenda, setAgenda] = useState(
    '1. Review credit facility terms\n2. Verify identity and compliance disclosures\n3. Execute closing promissory note\n4. Wire transfer instructions'
  );
  const [meetingType, setMeetingType] = useState<'video' | 'audio'>('video');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );
  const [startTime, setStartTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reminderEmail, setReminderEmail] = useState(true);
  const [reminderSms, setReminderSms] = useState(true);

  // Status & Conflict checking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generatedInvitationUrl, setGeneratedInvitationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedCustomer) {
      setSelectedCustomerId(preSelectedCustomer.id);
    }
  }, [preSelectedCustomer]);

  if (!isOpen) return null;

  const currentSelectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const currentSelectedRM = allRMs.find((r) => r.id === selectedRmId) || currentRM;

  // Calculate end time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const totalMinutes = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setIsSubmitting(true);

    try {
      const newMeeting = await api.createMeeting({
        title,
        description,
        agenda,
        meetingType,
        customerId: currentSelectedCustomer.id,
        customerName: currentSelectedCustomer.name,
        customerEmail: currentSelectedCustomer.email,
        customerPhone: currentSelectedCustomer.mobile,
        rmId: currentSelectedRM.id,
        rmName: currentSelectedRM.name,
        scheduledDate,
        startTime,
        endTime,
        durationMinutes,
        reminderPreferences: {
          email: reminderEmail,
          sms: reminderSms,
          timeBeforeMinutes: 15,
        },
      });

      onMeetingScheduled(newMeeting);
      onClose();
    } catch (err: any) {
      setConflictError(
        err.message || 'Scheduling conflict detected: The Relationship Manager already has a booked session during this time.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Schedule Enterprise Banking Meeting
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {conflictError && (
          <div className="bg-rose-950/80 border border-rose-800 p-3 rounded-lg text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{conflictError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Selection (Pre-populates CRM data) */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <label className="block text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Customer Selection (CRMNEXT Database)
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerId}) · {c.accountType} · {c.portfolioValue} AUM
                </option>
              ))}
            </select>

            {currentSelectedCustomer && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Phone: <strong className="text-slate-200 font-mono">{currentSelectedCustomer.mobile}</strong></span>
                <span>·</span>
                <span>Email: <strong className="text-slate-200">{currentSelectedCustomer.email}</strong></span>
                <span>·</span>
                <span>KYC: <strong className="text-emerald-400 font-mono">{currentSelectedCustomer.kycStatus}</strong></span>
              </div>
            )}
          </div>

          {/* Meeting Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-slate-300 font-medium">Meeting Subject / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Meeting Format</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMeetingType('video')}
                  className={`py-1.5 rounded flex items-center justify-center gap-1 font-medium transition-colors ${
                    meetingType === 'video'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingType('audio')}
                  className={`py-1.5 rounded flex items-center justify-center gap-1 font-medium transition-colors ${
                    meetingType === 'audio'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
            </div>
          </div>

          {/* Relationship Manager Selection & Conflict Detector */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-medium">Assigned Relationship Manager</label>
            <select
              value={selectedRmId}
              onChange={(e) => setSelectedRmId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {allRMs.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name} · {rm.department}
                </option>
              ))}
            </select>
          </div>

          {/* Agenda & Discussion Topics */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-medium">Meeting Agenda</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Reminder Preferences */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-white block">Automated Meeting Reminders</span>
              <span className="text-[11px] text-slate-400">
                Dispatches encrypted invitation and reminder 15 minutes before session.
              </span>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Email Invitation</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderSms}
                  onChange={(e) => setReminderSms(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>SMS Alert</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-semibold shadow transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking Availability...' : 'Confirm & Schedule Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
