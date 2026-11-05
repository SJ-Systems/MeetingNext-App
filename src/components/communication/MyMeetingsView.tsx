import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Filter,
  Plus,
  Video,
  PhoneCall,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { MeetingItem, CustomerRecord, RelationshipManager } from '../../types/crm';

interface MyMeetingsViewProps {
  meetings: MeetingItem[];
  customers: CustomerRecord[];
  allRMs: RelationshipManager[];
  onJoinMeeting: (meeting: MeetingItem) => void;
  onScheduleMeeting: () => void;
  onViewAiAnalysis: (meetingId: string) => void;
  onRescheduleMeeting: (meeting: MeetingItem) => void;
  onCancelMeeting: (meeting: MeetingItem) => void;
  onSelectCustomerById: (customerId: string) => void;
}

export const MyMeetingsView: React.FC<MyMeetingsViewProps> = ({
  meetings,
  customers,
  allRMs,
  onJoinMeeting,
  onScheduleMeeting,
  onViewAiAnalysis,
  onRescheduleMeeting,
  onCancelMeeting,
  onSelectCustomerById,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRmId, setSelectedRmId] = useState<string>('all');

  const filteredMeetings = meetings.filter((m) => {
    const matchesType = filterType === 'all' || m.meetingType === filterType;
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchesRm = selectedRmId === 'all' || m.rmId === selectedRmId;
    return matchesType && matchesStatus && matchesRm;
  });

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              My Meetings & Calendar
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized scheduling calendar with automated Amazon Chime SDK session provisioning
              and client invitations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: List vs Calendar */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar View</span>
              </button>
            </div>

            <button
              onClick={onScheduleMeeting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
              {(['all', 'video', 'audio'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    filterType === t ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">Live / In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>

            {/* RM Filter */}
            <select
              value={selectedRmId}
              onChange={(e) => setSelectedRmId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Relationship Managers</option>
              {allRMs.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Showing {filteredMeetings.length} of {meetings.length} sessions
          </div>
        </div>

        {/* Calendar View Mode */}
        {viewMode === 'calendar' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">November 2026</span>
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded">
                  <button className="p-1 hover:text-white text-slate-400">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 hover:text-white text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day / Week / Month tab */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded text-xs">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCalendarView(mode)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      calendarView === mode
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode} View
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Days Grid Matrix */}
            <div className="grid grid-cols-5 gap-3">
              {['Mon (Nov 02)', 'Tue (Nov 03)', 'Wed (Nov 04)', 'Thu (Nov 05)', 'Fri (Nov 06)'].map(
                (dayName, colIdx) => {
                  const dayDate = `2026-11-0${colIdx + 2}`;
                  const dayMeetings = meetings.filter((m) => m.scheduledDate === dayDate);

                  return (
                    <div
                      key={dayName}
                      className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[320px] space-y-2"
                    >
                      <div className="font-semibold text-slate-300 text-xs border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span>{dayName}</span>
                        {dayMeetings.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>

                      <div className="space-y-2">
                        {dayMeetings.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onJoinMeeting(m)}
                            className={`p-2.5 rounded border text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                              m.status === 'in_progress'
                                ? 'bg-emerald-950/80 border-emerald-600 ring-1 ring-emerald-500'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px] text-blue-400">
                                {m.startTime} ({m.durationMinutes}m)
                              </span>
                              <span className="text-[9px] font-mono uppercase text-slate-400">
                                {m.meetingType}
                              </span>
                            </div>
                            <div className="font-semibold text-white truncate">{m.title}</div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {m.customerName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* List View Mode */}
        {viewMode === 'list' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold bg-slate-950/40">
                    <th className="py-3 px-4">Subject & Internal Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">RM</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMeetings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{m.title}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {m.internalReference}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectCustomerById(m.customerId)}
                          className="font-medium text-slate-200 hover:text-blue-400 transition-colors"
                        >
                          {m.customerName}
                        </button>
                        <div className="text-[11px] text-slate-400">{m.customerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{m.scheduledDate}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {m.startTime} - {m.endTime} ({m.durationMinutes}m)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-slate-300 capitalize">
                          {m.meetingType === 'video' ? (
                            <Video className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{m.meetingType}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            m.status === 'in_progress'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                              : m.status === 'completed'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {m.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">{m.rmName.split(',')[0]}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onJoinMeeting(m)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow transition-colors"
                          >
                            <Video className="w-3 h-3" />
                            <span>Join</span>
                          </button>

                          {m.hasAiAnalysis && (
                            <button
                              onClick={() => onViewAiAnalysis(m.id)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded transition-colors"
                              title="View Bedrock AI Meeting Intelligence"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onRescheduleMeeting(m)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                          >
                            Reschedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
