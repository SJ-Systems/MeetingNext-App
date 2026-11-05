import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Calendar,
  Filter,
  Video,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { MeetingItem, CallRecord, RelationshipManager, CustomerRecord } from '../../types/crm';

interface MeetingInsightsViewProps {
  meetings: MeetingItem[];
  calls: CallRecord[];
  allRMs: RelationshipManager[];
  customers: CustomerRecord[];
}

export const MeetingInsightsView: React.FC<MeetingInsightsViewProps> = ({
  meetings,
  calls,
  allRMs,
  customers,
}) => {
  const [selectedRmId, setSelectedRmId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'30days' | '90days' | 'year'>('30days');

  // Metrics computation
  const videoMeetingsCount = meetings.filter((m) => m.meetingType === 'video').length;
  const audioMeetingsCount = meetings.filter((m) => m.meetingType === 'audio').length + calls.length;
  const totalCompleted = meetings.filter((m) => m.status === 'completed').length;
  const totalMissed = meetings.filter((m) => m.status === 'missed' || m.status === 'canceled').length;

  // Sentiment Breakdown
  const sentimentStats = [
    { label: 'Positive Experience (90%+)', count: 18, color: 'bg-emerald-500', pct: 75 },
    { label: 'Neutral Inquiry (70%-89%)', count: 5, color: 'bg-blue-500', pct: 21 },
    { label: 'Attention Needed (<70%)', count: 1, color: 'bg-amber-500', pct: 4 },
  ];

  // Most Discussed Customer Topics
  const topicStats = [
    { topic: 'Commercial Jumbo Rate Locks (5.15% Fixed)', count: 42, growth: '+18%' },
    { topic: 'Foreign Currency (FX) Wire Pre-Clearances', count: 28, growth: '+12%' },
    { topic: 'Automated Treasury Liquidity Yield Sweeps', count: 19, growth: '+8%' },
    { topic: 'Family Office Trust Escrow Arrangements', count: 14, growth: '+5%' },
    { topic: 'Municipal Bond Ladder Rebalancing', count: 9, growth: '+3%' },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Meeting Insights & Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cross-portfolio communication volume, sentiment distributions, topic trends, and
              relationship manager velocity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* RM Filter */}
            <select
              value={selectedRmId}
              onChange={(e) => setSelectedRmId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Relationship Managers</option>
              {allRMs.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded transition-colors ${
                  dateRange === '30days' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange('90days')}
                className={`px-3 py-1 rounded transition-colors ${
                  dateRange === '90days' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ratio: Video vs Audio */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Meeting Format Breakdown
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <Video className="w-3.5 h-3.5" /> Video Meetings ({videoMeetingsCount})
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <PhoneCall className="w-3.5 h-3.5" /> Audio Calls ({audioMeetingsCount})
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{
                  width: `${(videoMeetingsCount / (videoMeetingsCount + audioMeetingsCount)) * 100}%`,
                }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${(audioMeetingsCount / (videoMeetingsCount + audioMeetingsCount)) * 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              68% client consultations conducted via Chime HD Video.
            </div>
          </div>

          {/* Completion vs Missed Rate */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Meeting Reliability & Show-Up Rate
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Show-Up Reliability</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">96.2%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96.2%' }} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Automated SMS/Email reminders reduced no-shows by 44%.
            </div>
          </div>

          {/* Average Duration */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Average Consultation Duration
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">28.4 mins</div>
            <div className="text-[11px] text-slate-400">
              Target cadence: 30 minutes · Efficiency index: <strong className="text-emerald-400 font-mono">+12%</strong>
            </div>
          </div>

          {/* Follow-up Completion Rate */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Follow-Up Completion Velocity
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">SLA Met Within 24h</span>
              <span className="font-mono text-blue-400 font-bold text-sm">91.8%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '91.8%' }} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Average turnaround to DocuSign dispatch: 3.2 hours.
            </div>
          </div>
        </div>

        {/* Sentiment Distribution & Topics Discussed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Sentiment Distribution */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Customer Sentiment Distribution
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Bedrock Analyzed</span>
            </div>

            <div className="space-y-3">
              {sentimentStats.map((st, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{st.label}</span>
                    <span className="font-mono text-slate-300">
                      {st.count} sessions ({st.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${st.color} h-full rounded-full`} style={{ width: `${st.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Most Discussed Topics */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Top Discussion Drivers & Opportunities
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">CRMNEXT Indexed</span>
            </div>

            <div className="space-y-2">
              {topicStats.map((top, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 text-[11px]">0{idx + 1}</span>
                    <span className="font-medium text-white">{top.topic}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-300">{top.count} calls</span>
                    <span className="text-emerald-400 text-[11px]">{top.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
