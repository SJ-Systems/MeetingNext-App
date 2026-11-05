import React, { useState } from 'react';
import {
  Radio,
  FileCheck,
  ShieldCheck,
  Download,
  Play,
  Layers,
  ArrowRight,
  Database,
  Search,
  Plus,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { MediaPipelineSession } from '../../types';

interface MediaPipelinesViewProps {
  pipelines: MediaPipelineSession[];
  onCreatePipeline: (newPipeline: MediaPipelineSession) => void;
}

export const MediaPipelinesView: React.FC<MediaPipelinesViewProps> = ({
  pipelines,
  onCreatePipeline,
}) => {
  const [selectedPipeline, setSelectedPipeline] = useState<MediaPipelineSession | null>(
    pipelines[0] || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New pipeline form state
  const [newTitle, setNewTitle] = useState('Quarterly Lending Review & Collateral Valuation');
  const [newMeetingId, setNewMeetingId] = useState('meet-chime-9082');
  const [newStorageTier, setNewStorageTier] = useState<'S3 Standard' | 'S3 Glacier Flexible' | 'Vault Deep Archive'>('S3 Standard');

  const filteredPipelines = pipelines.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.meetingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: MediaPipelineSession = {
      id: `pipe-chime-${Math.floor(10000 + Math.random() * 90000)}`,
      title: newTitle,
      meetingId: newMeetingId,
      date: 'Just now',
      duration: 'Live Ingesting...',
      fileSizeBytes: 84000000,
      status: 'active',
      storageTier: newStorageTier,
      transcriptionStatus: 'Processing',
      piiRedacted: true,
      summary: 'Pipeline initialized. Real-time audio stream routed to Amazon Transcribe with PCI-DSS redaction.',
      keyTopics: ['Lending Review', 'Collateral Val', 'CRMNEXT Linked'],
    };
    onCreatePipeline(newSession);
    setSelectedPipeline(newSession);
    setShowCreateModal(false);
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Amazon Chime SDK Media Pipelines
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated media capture, concatenation, real-time transcription, and FINRA-compliant
              PII redaction pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Media Pipeline</span>
            </button>
          </div>
        </div>

        {/* Pipeline Architecture Flow Visualizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Media Pipeline Data Flow (Capture → ML → Storage)</span>
            <span className="text-[10px] font-mono text-emerald-400">AWS Managed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Step 1: Ingest */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Radio className="w-3.5 h-3.5" />
                <span>1. Media Ingest</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Captures individual WebRTC video, microphone opus tracks & content share.
              </p>
            </div>

            {/* Step 2: Concatenation */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>2. Concatenation</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Merges video tiles into composite 1080p MP4 and isolated multi-channel WAVs.
              </p>
            </div>

            {/* Step 3: ML Intelligence */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Live Transcribe & DLP</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Amazon Transcribe streaming + automatic masking of PAN, SSN and bank details.
              </p>
            </div>

            {/* Step 4: S3 Archive */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>4. S3 Glacier Vault</span>
              </div>
              <p className="text-[11px] text-slate-400">
                FINRA Rule 4511 & SEC 17a-4 compliant immutable WORM archival for 7 years.
              </p>
            </div>
          </div>
        </div>

        {/* Search & List of Captured Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Pipeline Sessions List */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Captured Meeting Sessions ({filteredPipelines.length})
              </span>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter archives..."
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredPipelines.map((session) => {
                const isSelected = selectedPipeline?.id === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedPipeline(session)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-xs truncate max-w-[220px]">
                        {session.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          session.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                        }`}
                      >
                        {session.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mb-2">
                      <span>{session.date}</span>
                      <span>·</span>
                      <span className="font-mono">{session.duration}</span>
                      <span>·</span>
                      <span className="font-mono">{formatFileSize(session.fileSizeBytes)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>PII Redacted</span>
                      </div>
                      <span className="text-slate-400 font-mono">{session.storageTier}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 6 Cols: Selected Pipeline Details & Transcript Preview */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            {selectedPipeline ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedPipeline.title}</h2>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Pipeline ARN: arn:aws:chime:pipeline/{selectedPipeline.id}
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Initiating secure direct download for ${selectedPipeline.id}.webm`)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Media</span>
                  </button>
                </div>

                {/* Pipeline Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Source Meeting ID</span>
                    <span className="font-mono text-slate-200">{selectedPipeline.meetingId}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Storage Vault</span>
                    <span className="font-mono text-emerald-400">{selectedPipeline.storageTier}</span>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive AI Summary & Compliance Findings</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selectedPipeline.summary}</p>
                </div>

                {/* Key Extraction Tags */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Key Financial Topics Tagged
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedPipeline.keyTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const transcriptJson = JSON.stringify(selectedPipeline, null, 2);
                      const blob = new Blob([transcriptJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedPipeline.id}_transcript.json`;
                      a.click();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export JSON Transcript</span>
                  </button>

                  <button
                    onClick={() => alert('Audit bundle verified: Hash SHA-256 registered on blockchain.')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Verify Cryptographic Seal</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a media pipeline session from the list to inspect details.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Media Pipeline */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  Create Amazon Chime Media Pipeline
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Pipeline Title / Purpose
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target Meeting ID
                  </label>
                  <input
                    type="text"
                    value={newMeetingId}
                    onChange={(e) => setNewMeetingId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    S3 Storage Vault Tier
                  </label>
                  <select
                    value={newStorageTier}
                    onChange={(e) => setNewStorageTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="S3 Standard">S3 Standard (Immediate Multi-AZ Access)</option>
                    <option value="S3 Glacier Flexible">S3 Glacier Flexible (Compliance Archival)</option>
                    <option value="Vault Deep Archive">Vault Deep Archive (7-Year FINRA WORM)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Automated Compliance Guardrails</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Amazon Transcribe DLP filter will automatically redact 16-digit credit card PANs,
                    9-digit SSNs, and banking routing numbers from audio & text sinks.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Deploy Pipeline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
