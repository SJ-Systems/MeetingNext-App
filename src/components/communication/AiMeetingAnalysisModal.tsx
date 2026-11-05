import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  Copy,
  Brain,
  FileText,
  User,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
  Edit2,
  Save,
  Check
} from 'lucide-react';
import { MeetingAnalysisData, ActionItem } from '../../types/crm';

interface AiMeetingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: MeetingAnalysisData;
  onApplyCrmUpdates: (updates: { field: string; proposedValue: string }[]) => void;
}

export const AiMeetingAnalysisModal: React.FC<AiMeetingAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onApplyCrmUpdates,
}) => {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'intent' | 'sentiment' | 'actions' | 'email' | 'crm_updates' | 'quality'
  >('summary');

  // Follow-up email state
  const [emailSubject, setEmailSubject] = useState(analysis.followUpEmail.subject);
  const [emailBody, setEmailBody] = useState(analysis.followUpEmail.body);
  const [emailStatus, setEmailStatus] = useState(analysis.followUpEmail.status);
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);

  // CRM suggestions approval states
  const [crmSuggestions, setCrmSuggestions] = useState(analysis.crmUpdateSuggestions);
  const [appliedCount, setAppliedCount] = useState(0);

  if (!isOpen) return null;

  const handleToggleCrmApproval = (idx: number) => {
    setCrmSuggestions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, approved: !s.approved } : s))
    );
  };

  const handleApplyApprovedCrmUpdates = () => {
    const approved = crmSuggestions.filter((s) => s.approved);
    onApplyCrmUpdates(approved);
    setAppliedCount(approved.length);
    setTimeout(() => setAppliedCount(0), 3000);
  };

  const handleCopyEmail = () => {
    const fullEmail = `${emailSubject}\n\n${analysis.followUpEmail.greeting}\n\n${emailBody}\n\nNext Steps:\n${analysis.followUpEmail.agreedNextSteps.map((s) => `• ${s}`).join('\n')}\n\nBest regards,\nSarah Lin, CFA`;
    navigator.clipboard.writeText(fullEmail);
    setIsCopiedEmail(true);
    setTimeout(() => setIsCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Amazon Bedrock AI Meeting Intelligence
              </h2>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <span>Model: {analysis.modelUsed}</span>
                <span>·</span>
                <span>Analyzed: {analysis.analyzedAt}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'summary' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            A. Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('intent')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'intent' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            B. Customer Intent
          </button>
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'sentiment' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            C. Sentiment Analysis
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'actions' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            D. Action Items ({analysis.actionItems.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'email' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            E. Follow-up Email
          </button>
          <button
            onClick={() => setActiveTab('crm_updates')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'crm_updates' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            F. CRM Updates
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === 'quality' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            G. Meeting Quality
          </button>
        </div>

        {/* Tab A: Executive & Detailed Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-purple-400 block uppercase tracking-wider text-[10px]">
                Executive Summary
              </span>
              <p className="text-slate-200 leading-relaxed text-sm">{analysis.executiveSummary}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                Detailed Discussion Breakdown
              </span>
              <p className="text-slate-300 leading-relaxed">{analysis.detailedSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-emerald-400 block text-[11px]">
                  Important Discussion Points
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {analysis.importantPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-blue-400 block text-[11px]">
                  Customer Expectations
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {analysis.customerExpectations.map((exp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-400">→</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab B: Customer Intent Analysis */}
        {activeTab === 'intent' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                Primary Reason Customer Contacted RM
              </span>
              <p className="text-white font-medium text-sm">
                {analysis.customerIntent.reasonForContact}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-blue-400 block text-[11px]">
                  Customer Requirements Identified
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {analysis.customerIntent.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono">[{i + 1}]</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-purple-400 block text-[11px]">
                  Products & Services of Interest
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysis.customerIntent.productInterests.map((p, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab C: Sentiment Analysis */}
        {activeTab === 'sentiment' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Overall Conversation Sentiment
                  </span>
                  <div className="text-lg font-bold text-emerald-400 flex items-center gap-2 mt-0.5">
                    <span>{analysis.sentiment.overall}</span>
                    <span className="text-xs font-mono text-slate-400">({analysis.sentiment.score}/100)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    High Client Trust Score
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analysis.sentiment.score}%` }}
                />
              </div>

              <p className="text-slate-400 text-[11px]">
                Model-generated sentiment index is based on speech acoustic pacing and lexical sentiment
                tracked through Amazon Transcribe & Bedrock.
              </p>
            </div>

            {/* Sentiment Progression Curve */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block text-[11px]">
                Sentiment Progression Across Meeting Duration
              </span>
              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                {analysis.sentiment.progression.map((prog, i) => (
                  <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono block">{prog.time}</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{prog.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab D: Action Items */}
        {activeTab === 'actions' && (
          <div className="space-y-3 text-xs">
            {analysis.actionItems.map((act) => (
              <div
                key={act.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white text-sm">{act.task}</div>
                  <div className="text-slate-400 flex items-center gap-3">
                    <span>Responsible: <strong className="text-slate-200">{act.responsiblePerson}</strong></span>
                    <span>·</span>
                    <span>Deadline: <strong className="text-slate-200 font-mono">{act.deadline}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {act.priority} Priority
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab E: Follow-Up Email Generator & Editor (Section 10 Requirement) */}
        {activeTab === 'email' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Bedrock Drafted Follow-Up Email (Editable by RM)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopiedEmail ? 'Email Copied!' : 'Copy Email'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Message Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Agreed Next Steps */}
              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="font-semibold text-blue-400 block text-[11px]">
                  Agreed Next Steps:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {analysis.followUpEmail.agreedNextSteps.map((st, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Status:{' '}
                  <strong className="text-emerald-400 uppercase font-mono">{emailStatus}</strong>
                </span>

                <button
                  onClick={() => {
                    setEmailStatus('approved');
                    alert('Email approved and queued for dispatch via secure banking mail gateway.');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Dispatch Follow-Up Email</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab F: CRM Update Suggestions (Section 10 Requirement) */}
        {activeTab === 'crm_updates' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block">
                  Suggested CRM Record Modifications
                </span>
                <p className="text-slate-400 text-[11px]">
                  Review and approve AI updates to customer portfolio attributes.
                </p>
              </div>

              {appliedCount > 0 && (
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {appliedCount} update(s) applied to CRM
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {crmSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{sug.field}:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{sug.proposedValue}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{sug.reason}</p>
                  </div>

                  <button
                    onClick={() => handleToggleCrmApproval(idx)}
                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      sug.approved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {sug.approved ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{sug.approved ? 'Approved' : 'Approve Update'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={handleApplyApprovedCrmUpdates}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold shadow transition-colors"
              >
                Apply Approved Updates to CRM Record
              </button>
            </div>
          </div>
        )}

        {/* Tab G: Meeting Quality Analysis */}
        {activeTab === 'quality' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Communication Quality Score</span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  {analysis.qualityAnalysis.qualityScore}/100
                </span>
              </div>

              {/* Talk Ratio Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>RM Talk Time ({analysis.qualityAnalysis.talkRatioRM}%)</span>
                  <span>Customer Talk Time ({analysis.qualityAnalysis.talkRatioCustomer}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${analysis.qualityAnalysis.talkRatioRM}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${analysis.qualityAnalysis.talkRatioCustomer}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-blue-400 block text-[11px]">
                Coaching & Communication Improvements
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {analysis.qualityAnalysis.suggestedImprovements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400">★</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
