import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Sparkles,
  RotateCcw,
  Copy,
  ExternalLink,
  CheckCircle2,
  FileText,
  X,
  MessageSquare,
  TrendingUp,
  Brain
} from 'lucide-react';
import { ScheduledMeeting, MeetingAiDetails } from '../../types/meetingnext';
import { MOCK_AI_DATA } from '../../db/meetingNextStore';
import { meetingNextApi } from '../../services/meetingNextApi';

interface MyMeetingsPageProps {
  upcomingMeetings: ScheduledMeeting[];
  pastMeetings: ScheduledMeeting[];
  onJoinMeeting: (meeting: ScheduledMeeting) => void;
  onOpenReschedule: (meeting: ScheduledMeeting) => void;
}

export const MyMeetingsPage: React.FC<MyMeetingsPageProps> = ({
  upcomingMeetings,
  pastMeetings,
  onJoinMeeting,
  onOpenReschedule,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // AI Modal State
  const [selectedAiMeeting, setSelectedAiMeeting] = useState<MeetingAiDetails | null>(null);
  const [aiModalTab, setAiModalTab] = useState<'transcription' | 'summary'>('transcription');

  const handleOpenAi = async (meeting: ScheduledMeeting) => {
    try {
      const details = await meetingNextApi.getAiDetails(meeting.id);
      setSelectedAiMeeting(details);
    } catch {
      const details = MOCK_AI_DATA[meeting.id] || MOCK_AI_DATA['mtg_past_01'];
      setSelectedAiMeeting(details);
    }
  };

  return (
    <div className="flex-1 bg-white text-slate-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Meetings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage your upcoming sessions and review completed meetings with AI transcripts
            </p>
          </div>

          {/* Clean Segmented Tab Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingMeetings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'past'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Past Meetings ({pastMeetings.length})
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: UPCOMING MEETINGS                                            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Customer Detail Fields: Name, Number, Reason, Time, Date */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {meeting.customerName}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                          {meeting.reason}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>
                          Phone: <strong className="text-slate-700 font-mono">{meeting.customerNumber}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Date: <strong className="text-slate-700">{meeting.date}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Time: <strong className="text-slate-700 font-mono">{meeting.time}</strong> ({meeting.durationMinutes}m)
                        </span>
                      </div>
                    </div>

                    {/* Join Button & Reschedule Button */}
                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <button
                        onClick={() => onJoinMeeting(meeting)}
                        className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full text-xs font-semibold shadow-sm shadow-rose-200 transition-all flex items-center gap-2"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </button>

                      <button
                        onClick={() => onOpenReschedule(meeting)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                        title="Reschedule or edit details"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reschedule & Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p>No upcoming meetings scheduled right now.</p>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: PAST MEETINGS                                                */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'past' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {pastMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 shadow-xs hover:shadow-sm hover:shadow-rose-100/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Name, Number, Duration, Time, Date */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {meeting.customerName}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {meeting.reason}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                        Completed
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Phone: <strong className="text-slate-700 font-mono">{meeting.customerNumber}</strong></span>
                      <span>·</span>
                      <span>Duration: <strong className="text-rose-600 font-mono">{meeting.actualDuration || '25 mins'}</strong></span>
                      <span>·</span>
                      <span>Date & Time: <strong className="text-slate-700">{meeting.date} at {meeting.time}</strong></span>
                    </div>
                  </div>

                  {/* Reschedule Button & AI Button */}
                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <button
                      onClick={() => onOpenReschedule(meeting)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                      title="Reschedule new meeting for this customer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Reschedule for Customer</span>
                    </button>

                    <button
                      onClick={() => handleOpenAi(meeting)}
                      className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 active:scale-95 text-white rounded-full text-xs font-bold shadow-sm shadow-pink-200 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Insights</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AI MODAL: Page 1 = Transcription, Page 2 = Summary & Insights       */}
      {/* ------------------------------------------------------------------ */}
      {selectedAiMeeting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Meeting Intelligence: {selectedAiMeeting.customerName}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {selectedAiMeeting.reason} · {selectedAiMeeting.date}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAiMeeting(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Two Pages/Tabs: Transcription vs Summary & Insights */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
              <button
                onClick={() => setAiModalTab('transcription')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all ${
                  aiModalTab === 'transcription'
                    ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Page 1: Meeting Transcription
              </button>
              <button
                onClick={() => setAiModalTab('summary')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all ${
                  aiModalTab === 'summary'
                    ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50/50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Page 2: AI Summary & Insights
              </button>
            </div>

            {/* Content: Page 1 Transcription */}
            {aiModalTab === 'transcription' && (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Full Speech-to-Text Dialogue
                </span>
                {selectedAiMeeting.transcription.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.speaker}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Content: Page 2 AI Summary & Insights */}
            {aiModalTab === 'summary' && (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-xs">
                {/* Summary Box */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block">
                    AI Executive Summary
                  </span>
                  <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                    {selectedAiMeeting.aiSummary.overview}
                  </p>
                </div>

                {/* Sentiment & Intent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block">
                      Customer Sentiment Score
                    </span>
                    <div className="text-sm font-bold text-emerald-600">
                      {selectedAiMeeting.aiSummary.sentimentScore}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block">
                      Customer Intent
                    </span>
                    <div className="text-xs text-slate-800 font-medium">
                      {selectedAiMeeting.aiSummary.customerIntent}
                    </div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Key Discussion Points
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {selectedAiMeeting.aiSummary.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">
                    Agreed Next Actions
                  </span>
                  {selectedAiMeeting.aiSummary.actionItems.map((act, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{act.task}</span>
                      <span className="text-[10px] font-mono text-slate-500">{act.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAiMeeting(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
