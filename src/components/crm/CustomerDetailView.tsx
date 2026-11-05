import React, { useState } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  Video,
  Calendar,
  Send,
  History,
  Radio,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Copy,
  ExternalLink,
  Edit2,
  Save
} from 'lucide-react';
import {
  CustomerRecord,
  MeetingItem,
  CallRecord,
  FollowUpItem,
  MeetingRecordingItem
} from '../../types/crm';

interface CustomerDetailViewProps {
  customer: CustomerRecord;
  meetings: MeetingItem[];
  calls: CallRecord[];
  followUps: FollowUpItem[];
  recordings: MeetingRecordingItem[];
  onBack: () => void;
  onCallCustomer: (customer: CustomerRecord) => void;
  onStartVideoMeeting: (customer: CustomerRecord) => void;
  onScheduleMeeting: (customer: CustomerRecord) => void;
  onViewAiAnalysis: (meetingId: string) => void;
  onJoinMeeting: (meeting: MeetingItem) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  meetings,
  calls,
  followUps,
  recordings,
  onBack,
  onCallCustomer,
  onStartVideoMeeting,
  onScheduleMeeting,
  onViewAiAnalysis,
  onJoinMeeting,
}) => {
  const [activeCommTab, setActiveCommTab] = useState<
    'history' | 'upcoming' | 'recordings' | 'ai_summaries' | 'followups'
  >('upcoming');

  const [invitationCopied, setInvitationCopied] = useState(false);
  const [notesText, setNotesText] = useState(customer.notes);
  const [notesSaved, setNotesSaved] = useState(false);

  // Filter items for this specific customer
  const customerMeetings = meetings.filter((m) => m.customerId === customer.id);
  const upcomingMeetings = customerMeetings.filter(
    (m) => m.status === 'scheduled' || m.status === 'in_progress'
  );
  const pastMeetings = customerMeetings.filter((m) => m.status === 'completed');
  const customerCalls = calls.filter((c) => c.customerId === customer.id);
  const customerFollowUps = followUps.filter((f) => f.customerId === customer.id);
  const customerRecordings = recordings.filter((r) => r.customerId === customer.id);

  const handleCopyInviteLink = () => {
    const invite = `https://crmnext.apexvaultbank.com/meet/instant?customer=${customer.customerId}&auth=jwt_${Date.now()}`;
    navigator.clipboard.writeText(invite);
    setInvitationCopied(true);
    setTimeout(() => setInvitationCopied(false), 2500);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back navigation & Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customer Directory</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              KYC: {customer.kycStatus}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Account: {customer.accountNumber}
            </span>
          </div>
        </div>

        {/* Customer 360 Header Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-2xl text-white shadow-lg shrink-0">
                {customer.avatar}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white tracking-tight">{customer.name}</h1>
                  <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-800 px-2 py-0.5 rounded">
                    {customer.customerId}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {customer.company} · {customer.accountType}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Phone: <strong className="text-slate-200 font-mono">{customer.mobile}</strong></span>
                  <span>·</span>
                  <span>Email: <strong className="text-slate-200">{customer.email}</strong></span>
                  <span>·</span>
                  <span>Relationship Manager: <strong className="text-slate-200">{customer.assignedRMName}</strong></span>
                </div>
              </div>
            </div>

            {/* Financial Overview Metrics */}
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
              <div className="text-right">
                <div className="text-xs text-slate-400">Total Portfolio (AUM)</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {customer.portfolioValue}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Tier-1 Private Client</div>
              </div>
            </div>
          </div>

          {/* Open Lending Tickets Bar */}
          {customer.openTickets.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Active CRM Tickets & Lending Facilities
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customer.openTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-400 font-semibold">{t.id}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-300 rounded font-mono">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-slate-200 font-medium mt-0.5">{t.title}</div>
                    </div>
                    {t.amount && (
                      <span className="font-mono font-semibold text-white">{t.amount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 4 REQUIREMENT: Dedicated Communication Section             */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-slate-900 border-2 border-blue-500/40 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Communication & Meeting Management
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  CRMNEXT Auto-Linked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Initiate authenticated sessions with {customer.name}. All meetings and calls
                automatically link to customer record #{customer.customerId}.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onStartVideoMeeting(customer)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                title="Start Instant Video Meeting"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Start Video Meeting</span>
              </button>

              <button
                onClick={() => onCallCustomer(customer)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                title="Direct In-App Audio or Mobile Calling"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </button>

              <button
                onClick={() => onScheduleMeeting(customer)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                title="Schedule Future Meeting"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Schedule Meeting</span>
              </button>

              <button
                onClick={handleCopyInviteLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                title="Copy Secure Meeting Invitation Link"
              >
                <Send className="w-3.5 h-3.5 text-purple-400" />
                <span>{invitationCopied ? 'Link Copied!' : 'Send Meeting Invitation'}</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs within Communication Section */}
          <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setActiveCommTab('upcoming')}
              className={`px-3 py-2 rounded-t transition-colors font-medium whitespace-nowrap ${
                activeCommTab === 'upcoming'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming Meetings ({upcomingMeetings.length})
            </button>
            <button
              onClick={() => setActiveCommTab('history')}
              className={`px-3 py-2 rounded-t transition-colors font-medium whitespace-nowrap ${
                activeCommTab === 'history'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Previous Interactions ({pastMeetings.length + customerCalls.length})
            </button>
            <button
              onClick={() => setActiveCommTab('recordings')}
              className={`px-3 py-2 rounded-t transition-colors font-medium whitespace-nowrap ${
                activeCommTab === 'recordings'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recordings & Media ({customerRecordings.length})
            </button>
            <button
              onClick={() => setActiveCommTab('ai_summaries')}
              className={`px-3 py-2 rounded-t transition-colors font-medium whitespace-nowrap ${
                activeCommTab === 'ai_summaries'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Summaries & Intent Insights
            </button>
            <button
              onClick={() => setActiveCommTab('followups')}
              className={`px-3 py-2 rounded-t transition-colors font-medium whitespace-nowrap ${
                activeCommTab === 'followups'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending Follow-ups ({customerFollowUps.filter((f) => f.status === 'Pending').length})
            </button>
          </div>

          {/* Sub-Tab 1: Upcoming Meetings */}
          {activeCommTab === 'upcoming' && (
            <div className="space-y-3">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{m.title}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            m.status === 'in_progress'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {m.status === 'in_progress' ? 'LIVE NOW' : 'SCHEDULED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {m.internalReference}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Date: <strong className="text-slate-200">{m.scheduledDate}</strong></span>
                        <span>·</span>
                        <span>Time: <strong className="text-slate-200 font-mono">{m.startTime} - {m.endTime}</strong> ({m.durationMinutes}m)</span>
                        <span>·</span>
                        <span>Type: <strong className="text-slate-200 capitalize">{m.meetingType}</strong></span>
                      </div>
                      <p className="text-xs text-slate-400">{m.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onJoinMeeting(m)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                      </button>
                      {m.hasAiAnalysis && (
                        <button
                          onClick={() => onViewAiAnalysis(m.id)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>AI Insights</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-xs space-y-2">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No upcoming meetings scheduled with {customer.name}.</p>
                  <button
                    onClick={() => onScheduleMeeting(customer)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                  >
                    Schedule Meeting Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Previous Interactions (Meetings & Calls) */}
          {activeCommTab === 'history' && (
            <div className="space-y-3">
              {customerCalls.length > 0 || pastMeetings.length > 0 ? (
                <div className="space-y-2.5">
                  {customerCalls.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-white">
                            {c.direction === 'inbound' ? 'Inbound Call' : 'Outbound Call'} ({c.telephonyProvider})
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.startTime} · Duration: <span className="font-mono">{Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s</span> · RM: {c.rmName}
                        </div>
                        <p className="text-slate-300 text-[11px]">{c.notes}</p>
                      </div>
                    </div>
                  ))}

                  {pastMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-semibold text-white">{m.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            COMPLETED
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.scheduledDate} · {m.startTime} · RM: {m.rmName}
                        </div>
                      </div>
                      <button
                        onClick={() => onViewAiAnalysis(m.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Analysis</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No interaction history recorded yet.
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Recordings & Media */}
          {activeCommTab === 'recordings' && (
            <div className="space-y-3">
              {customerRecordings.length > 0 ? (
                customerRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold text-white">{rec.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                          PII Masked
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span>{rec.date}</span>
                        <span>·</span>
                        <span>{rec.durationFormatted}</span>
                        <span>·</span>
                        <span>{rec.storageTier}</span>
                      </div>
                    </div>

                    <a
                      href={rec.presignedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Secure S3 Playback</span>
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No recordings stored for this customer.
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 4: AI Summaries */}
          {activeCommTab === 'ai_summaries' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Amazon Bedrock Synthesis (Meeting MTG-2026-8812)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">92% Sentiment Index</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  David Sterling agreed to term sheet parameters for $1.8M commercial refinance.
                  Confirmed 5.15% 7-year rate lock on ticket #TCK-2024-88. Concurrently cleared
                  AML pre-authorization for €320,000 foreign currency transfer.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onViewAiAnalysis('mtg_001')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>View Complete Intent & Follow-up Email Generator</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 5: Pending Follow-ups */}
          {activeCommTab === 'followups' && (
            <div className="space-y-2.5 text-xs">
              {customerFollowUps.map((fup) => (
                <div
                  key={fup.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{fup.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          fup.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {fup.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{fup.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Due: {fup.dueDate} · Channel: {fup.channel}
                    </div>
                  </div>
                  {fup.status !== 'Completed' && (
                    <button
                      onClick={() => alert(`Marked follow-up "${fup.title}" as completed in CRM.`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Relationship Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Relationship Manager Notes & Preferences</span>
            </span>
            {notesSaved && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to CRM
              </span>
            )}
          </div>
          <textarea
            value={notesText}
            onChange={(e) => {
              setNotesText(e.target.value);
              setNotesSaved(false);
            }}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
