import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Video,
  PhoneCall,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { CustomerRecord, MeetingItem, DashboardMetrics } from '../../types/crm';

interface ExecutiveDashboardViewProps {
  customers: CustomerRecord[];
  meetings: MeetingItem[];
  metrics: DashboardMetrics;
  onOpenCommunicationHub: () => void;
  onOpenCustomerDirectory: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  customers,
  meetings,
  metrics,
  onOpenCommunicationHub,
  onOpenCustomerDirectory,
}) => {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CRMNEXT Executive Banking Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Apex Private Wealth & Commercial Banking branch performance and communications telemetry.
            </p>
          </div>

          <button
            onClick={onOpenCommunicationHub}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-2"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Communication Hub</span>
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Portfolio AUM
            </span>
            <div className="text-2xl font-mono font-bold text-white">$13,435,000.00</div>
            <div className="text-[11px] text-emerald-400 font-mono">+8.4% Net New Inflows</div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Lending Pipeline
            </span>
            <div className="text-2xl font-mono font-bold text-blue-400">$8,300,000.00</div>
            <div className="text-[11px] text-slate-400">3 Commercial Jumbo Refinances</div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Meetings Held This Month
            </span>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {metrics.totalMeetingsThisMonth}
            </div>
            <div className="text-[11px] text-slate-400">Chime SDK HD Video & Voice</div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Compliance Redaction Rate
            </span>
            <div className="text-2xl font-mono font-bold text-purple-400">100%</div>
            <div className="text-[11px] text-emerald-400 font-mono">PCI-DSS Level 1 Verified</div>
          </div>
        </div>

        {/* Quick Launchpad to Communication Hub & Customer 360 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={onOpenCommunicationHub}
            className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 cursor-pointer transition-all shadow-lg space-y-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-base font-bold text-white">Communication Hub</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open the unified communications workspace for Amazon Chime video meetings, Amazon Connect
              PSTN telephony, live transcripts, and Bedrock AI meeting insights.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold pt-1">
              <span>Open Communication Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onOpenCustomerDirectory}
            className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 cursor-pointer transition-all shadow-lg space-y-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-base font-bold text-white">Customer Directory (360)</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect comprehensive customer profiles with portfolio holdings, KYC compliance status,
              credit lines, and one-click video and audio calling.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
              <span>Explore Customer Profiles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
