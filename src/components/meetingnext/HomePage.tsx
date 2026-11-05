import React from 'react';
import {
  Video,
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  CalendarPlus,
  RotateCcw
} from 'lucide-react';
import { ScheduledMeeting, HomeInsights } from '../../types/meetingnext';

interface HomePageProps {
  upcomingMeetings: ScheduledMeeting[];
  onJoinMeeting: (meeting: ScheduledMeeting) => void;
  onOpenReschedule: (meeting: ScheduledMeeting) => void;
  onNavigateToSchedule: () => void;
  onNavigateToMeetings: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  upcomingMeetings,
  onJoinMeeting,
  onOpenReschedule,
  onNavigateToSchedule,
  onNavigateToMeetings,
}) => {
  const insights: HomeInsights = {
    totalMeetingsThisMonth: 18,
    upcomingCount: upcomingMeetings.length,
    completedCount: 15,
    totalCallMinutes: 412,
    customerSatisfactionRate: '98.5%',
    loanEnrollmentsCount: 12,
  };

  return (
    <div className="flex-1 bg-white text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Google Workspace Style Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-50/70 via-pink-50/40 to-white p-6 sm:p-8 border border-rose-100 shadow-sm shadow-rose-100/30">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-rose-200/80 text-[11px] font-semibold text-rose-600 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Smart Real-Time Banking Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back to MeetingNext
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Connect with customers for loan enrollments, bank account verifications, and onboarding
              with ultra-low latency Amazon Chime HD video.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onNavigateToSchedule}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full text-xs font-semibold shadow-sm shadow-rose-200 transition-all flex items-center gap-2"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Schedule New Meeting</span>
              </button>
              <button
                onClick={onNavigateToMeetings}
                className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold transition-all"
              >
                <span>View All Meetings</span>
              </button>
            </div>
          </div>

          {/* Futuristic light warm pink blurred decorative orb */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* INSIGHTS OF MY WEBSITE                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Platform Insights & Activity
              </h2>
              <p className="text-xs text-slate-400">
                Live performance metrics across customer onboarding & video consultations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all space-y-2 group">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Meetings / Mo
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 group-hover:text-rose-600 transition-colors">
                  {insights.totalMeetingsThisMonth}
                </span>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +24% vs last mo
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Loan & account opening sessions
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all space-y-2 group">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Upcoming Sessions
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-500">
                  {insights.upcomingCount}
                </span>
                <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Action Ready
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Next meeting starting soon
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all space-y-2 group">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Telephonic Minutes
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                  {insights.totalCallMinutes}m
                </span>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  PSTN & Audio
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Avg. 6 mins per client verification
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all space-y-2 group">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Loan Enrollment Rate
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                  {insights.customerSatisfactionRate}
                </span>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                High accuracy video verification
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MY UPCOMING MEETINGS                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                My Upcoming Meetings
              </h2>
              <p className="text-xs text-slate-400">
                Join live video rooms or check scheduled customer verifications
              </p>
            </div>
            <button
              onClick={onNavigateToMeetings}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <span>See All My Meetings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Customer Details */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs shadow-pink-200">
                    {meeting.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{meeting.customerName}</span>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                        {meeting.reason}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Phone: <strong className="text-slate-700 font-mono">{meeting.customerNumber}</strong></span>
                      <span>·</span>
                      <span>Date: <strong className="text-slate-700">{meeting.date}</strong></span>
                      <span>·</span>
                      <span>Time: <strong className="text-slate-700 font-mono">{meeting.time}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Join Button & Reschedule Button */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => onJoinMeeting(meeting)}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full text-xs font-semibold shadow-sm shadow-rose-200 transition-all flex items-center gap-1.5 group"
                  >
                    <Video className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Join Meeting</span>
                  </button>

                  <button
                    onClick={() => onOpenReschedule(meeting)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                    title="Reschedule or update details"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
