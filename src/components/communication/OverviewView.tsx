import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  User,
  ShieldCheck,
  Radio,
  FileText
} from 'lucide-react';
import {
  DashboardMetrics,
  MeetingItem,
  CallRecord,
  FollowUpItem
} from '../../types/crm';

interface OverviewViewProps {
  metrics: DashboardMetrics;
  meetings: MeetingItem[];
  calls: CallRecord[];
  followUps: FollowUpItem[];
  onJoinMeeting: (meeting: MeetingItem) => void;
  onScheduleMeeting: () => void;
  onSelectCustomerById: (customerId: string) => void;
  onViewAiAnalysis: (meetingId: string) => void;
  onRescheduleMeeting: (meeting: MeetingItem) => void;
  onCancelMeeting: (meeting: MeetingItem) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  meetings,
  calls,
  followUps,
  onJoinMeeting,
  onScheduleMeeting,
  onSelectCustomerById,
  onViewAiAnalysis,
  onRescheduleMeeting,
  onCancelMeeting,
}) => {
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' || m.status === 'in_progress'
  );

  const completedMeetings = meetings.filter((m) => m.status === 'completed');

  const pendingFollowUps = followUps.filter((f) => f.status === 'Pending');

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Title & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Communication Hub Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time enterprise banking communications, active meetings, and AI-driven client
              intelligence powered by Amazon Chime SDK.
            </p>
          </div>

          <button
            onClick={onScheduleMeeting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule New Meeting</span>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3 REQUIREMENT: Top KPI Dashboard Metric Cards              */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Total Meetings This Month */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Meetings / Mo</span>
            <span className="font-mono text-xl font-bold text-white">
              {metrics.totalMeetingsThisMonth}
            </span>
            <span className="text-[10px] text-emerald-400 block font-mono">100% On-Track</span>
          </div>

          {/* 2. Upcoming Meetings */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Upcoming</span>
            <span className="font-mono text-xl font-bold text-blue-400">
              {metrics.upcomingMeetingsCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Next in 25m</span>
          </div>

          {/* 3. Completed Meetings */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Completed</span>
            <span className="font-mono text-xl font-bold text-emerald-400">
              {metrics.completedMeetingsCount}
            </span>
            <span className="text-[10px] text-emerald-400 block font-mono">All Logged</span>
          </div>

          {/* 4. Missed Meetings */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Missed / Canc.</span>
            <span className="font-mono text-xl font-bold text-slate-300">
              {metrics.missedMeetingsCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Auto-notified</span>
          </div>

          {/* 5. Total Call Duration */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Call Minutes</span>
            <span className="font-mono text-xl font-bold text-white">
              {metrics.totalCallDurationMinutes}m
            </span>
            <span className="text-[10px] text-slate-500 block">Audio & PSTN</span>
          </div>

          {/* 6. Average Meeting Duration */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Avg Duration</span>
            <span className="font-mono text-xl font-bold text-white">
              {metrics.averageMeetingDurationMinutes}m
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">Target: 30m</span>
          </div>

          {/* 7. Pending Follow-ups */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Follow-ups</span>
            <span className="font-mono text-xl font-bold text-amber-400">
              {metrics.pendingFollowUpsCount}
            </span>
            <span className="text-[10px] text-amber-400 block font-mono">Action Due</span>
          </div>

          {/* 8. AI Sentiment Index */}
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Client Sentiment</span>
            <span className="font-mono text-xl font-bold text-purple-400">
              {metrics.sentimentAverageScore}%
            </span>
            <span className="text-[10px] text-emerald-400 block font-mono">Positive</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3 REQUIREMENT: Upcoming Meetings Section                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Upcoming Meetings ({upcomingMeetings.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Live Amazon Chime SDK Video & Audio Schedule
            </span>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:border-slate-700"
              >
                {/* Customer Details & Subject */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                    {m.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectCustomerById(m.customerId)}
                        className="font-semibold text-white hover:text-blue-400 transition-colors text-sm"
                      >
                        {m.customerName}
                      </button>
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.internalReference}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          m.status === 'in_progress'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {m.status === 'in_progress' ? 'IN PROGRESS (LIVE)' : 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="font-medium text-slate-200 text-xs">{m.title}</div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span>Date: <strong className="text-slate-200">{m.scheduledDate}</strong></span>
                      <span>·</span>
                      <span>Time: <strong className="text-slate-200 font-mono">{m.startTime} - {m.endTime}</strong> ({m.durationMinutes} min)</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {m.meetingType === 'video' ? (
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="capitalize">{m.meetingType} Call</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Join Meeting, Reschedule, Cancel */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onJoinMeeting(m)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-2"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                  </button>

                  <button
                    onClick={() => onRescheduleMeeting(m)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Reschedule
                  </button>

                  <button
                    onClick={() => onCancelMeeting(m)}
                    className="px-3 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3 REQUIREMENT: Recent Communication & AI Insights Grid     */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Recent Communication */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recent Communication
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Audio & Video Log</span>
            </div>

            <div className="space-y-2.5">
              {calls.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {c.mode === 'in_app_audio' ? (
                        <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <button
                        onClick={() => onSelectCustomerById(c.customerId)}
                        className="font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {c.customerName}
                      </button>
                      <span className="text-[10px] font-mono text-slate-500">
                        {c.direction === 'inbound' ? 'Inbound' : 'Outbound'} · {c.telephonyProvider}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{c.startTime}</span>
                      <span>·</span>
                      <span className="font-mono">
                        {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s
                      </span>
                      <span>·</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          c.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-tight pt-0.5">{c.notes}</p>
                  </div>

                  <button
                    onClick={() => onSelectCustomerById(c.customerId)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium shrink-0 ml-3"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: AI Insights Section */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <h2 className="text-xs uppercase tracking-wider text-white">
                  AI Insights & Action Watchdog
                </h2>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded">
                Amazon Bedrock
              </span>
            </div>

            {/* Customer Sentiment Trends */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Customer Sentiment Trends</span>
                <span className="font-mono text-emerald-400 font-semibold">92% Positive Avg</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Lending interest rate certainty is driving highest customer satisfaction across Tier-1
                relationships.
              </p>
            </div>

            {/* Most Discussed Topics */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Most Discussed Topics This Month
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono">
                  Jumbo Rate Lock (42%)
                </span>
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono">
                  FX Forward Swaps (28%)
                </span>
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono">
                  Treasury Yield Sweeps (18%)
                </span>
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono">
                  Escrow Wire Clearances (12%)
                </span>
              </div>
            </div>

            {/* Pending Customer Commitments */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Customer Commitments & Follow-ups
              </span>
              {pendingFollowUps.slice(0, 2).map((fup) => (
                <div
                  key={fup.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white">{fup.title}</div>
                    <div className="text-[11px] text-slate-400">
                      Customer: {fup.customerName} · Due: {fup.dueDate}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    HIGH PRIORITY
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => onViewAiAnalysis('mtg_001')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>View Full AI Meeting Intelligence Digest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
