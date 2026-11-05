import React, { useState } from 'react';
import {
  RotateCcw,
  Calendar,
  Clock,
  User,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Sparkles,
  Edit3
} from 'lucide-react';
import { ScheduledMeeting } from '../../types/meetingnext';

interface RescheduleModalProps {
  meeting: ScheduledMeeting;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (
    meetingId: string,
    updates: {
      customerName: string;
      customerNumber: string;
      customerEmail: string;
      newDate: string;
      newTime: string;
      newReason: string;
      durationMinutes: number;
    }
  ) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onConfirmReschedule,
}) => {
  const [customerName, setCustomerName] = useState(meeting.customerName);
  const [customerNumber, setCustomerNumber] = useState(meeting.customerNumber);
  const [customerEmail, setCustomerEmail] = useState(
    meeting.customerEmail || `${meeting.customerName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
  );
  const [newDate, setNewDate] = useState(meeting.date || 'Tomorrow');
  const [newTime, setNewTime] = useState(meeting.time || '02:00 PM');
  const [newReason, setNewReason] = useState<string>(meeting.reason);
  const [durationMinutes, setDurationMinutes] = useState(meeting.durationMinutes || 30);
  const [sendNotice, setSendNotice] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReschedule(meeting.id, {
      customerName: customerName.trim(),
      customerNumber: customerNumber.trim(),
      customerEmail: customerEmail.trim(),
      newDate,
      newTime,
      newReason,
      durationMinutes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Reschedule & Update Meeting Details
              </h3>
              <p className="text-[11px] text-slate-400">
                Modify customer credentials, date, timeslot, or verification purpose
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reschedule & Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Credentials */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              1. Customer Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Phone Number (SMS)</label>
                <input
                  type="tel"
                  required
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-slate-600 font-semibold">Gmail Address</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              2. New Schedule & Duration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Date</label>
                <select
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-400"
                >
                  <option value="Today">Today (Later)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Nov 05, 2026">Thursday, Nov 05</option>
                  <option value="Nov 06, 2026">Friday, Nov 06</option>
                  <option value="Next Monday">Next Monday</option>
                  <option value="Next Tuesday">Next Tuesday</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 font-semibold">Start Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-400"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-400"
                >
                  <option value={15}>15 Mins</option>
                  <option value={20}>20 Mins</option>
                  <option value={30}>30 Mins</option>
                  <option value={45}>45 Mins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Meeting Reason */}
          <div className="space-y-1">
            <label className="block text-slate-600 font-semibold">Meeting Purpose / Reason</label>
            <select
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-rose-400"
            >
              <option value="Loan Enrollment">Loan Enrollment</option>
              <option value="Bank Account Verification">Bank Account Verification</option>
              <option value="Account Opening">Account Opening</option>
              <option value="Mortgage Pre-Approval">Mortgage Pre-Approval</option>
              <option value="KYC Re-verification">KYC Re-verification</option>
            </select>
          </div>

          {/* Customer Notification Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotice}
              onChange={(e) => setSendNotice(e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400 border-slate-300"
            />
            <div className="text-slate-700">
              <span className="font-semibold block text-slate-900">
                Dispatch Updated Link via SMS & Gmail
              </span>
              <span className="text-[10px] text-slate-500">
                Automatically notifies customer on mobile and email with refreshed calendar invite.
              </span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold shadow-sm shadow-rose-200 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Re-dispatch Meeting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
