import React, { useState } from 'react';
import {
  Radio,
  Download,
  Play,
  Search,
  ShieldCheck,
  FileText,
  Clock,
  Lock,
  ExternalLink,
  Filter,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { MeetingRecordingItem, MeetingTranscriptEntry } from '../../types/crm';
import { INITIAL_TRANSCRIPTS } from '../../db/inMemoryDb';

interface RecordingsViewProps {
  recordings: MeetingRecordingItem[];
  onSelectCustomerById: (customerId: string) => void;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({
  recordings,
  onSelectCustomerById,
}) => {
  const [selectedRecId, setSelectedRecId] = useState<string>(recordings[0]?.id || '');
  const [search, setSearch] = useState('');
  const [piiMaskActive, setPiiMaskActive] = useState(true);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const selectedRecording = recordings.find((r) => r.id === selectedRecId) || recordings[0];
  const transcriptEntries: MeetingTranscriptEntry[] =
    INITIAL_TRANSCRIPTS[selectedRecording?.meetingId] || [];

  const filteredRecordings = recordings.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTranscript = transcriptEntries.filter(
    (t) =>
      t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const handleDownloadTranscript = (format: 'json' | 'srt' | 'txt') => {
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(transcriptEntries, null, 2);
    } else {
      content = transcriptEntries
        .map((t) => `[${t.timestamp}] ${t.speaker}: ${piiMaskActive && t.redactedText ? t.redactedText : t.text}`)
        .join('\n\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRecording?.id}_transcript.${format}`;
    a.click();
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Recordings & Transcripts Compliance Vault
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Encrypted Amazon S3 media capture pipelines with automated Amazon Transcribe speech-to-text
              and PCI-DSS/GLBA redaction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FINRA 7-Year WORM Storage</span>
            </span>
          </div>
        </div>

        {/* Master Split Grid: Recordings Roster vs Interactive Player & Transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Recordings Roster */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Captured Meeting Sessions ({filteredRecordings.length})
              </span>
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter recordings..."
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredRecordings.map((rec) => {
                const isSelected = selectedRecId === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecId(rec.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-xs truncate max-w-[220px]">
                        {rec.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {rec.transcriptionStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2 font-mono">
                      <span>{rec.date}</span>
                      <span>·</span>
                      <span>{rec.durationFormatted}</span>
                      <span>·</span>
                      <span>{(rec.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-300">{rec.customerName}</span>
                      <span className="text-emerald-400 font-mono text-[10px]">
                        PII Redacted ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 7 Cols: Video Playback & Synced Transcript */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            {selectedRecording ? (
              <div className="space-y-4">
                {/* Header & Presigned URL Notice */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedRecording.title}</h2>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Temporary Presigned S3 Token (Expires in 15m)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadTranscript('json')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Export JSON Transcript"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTranscript('txt')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Export Text Transcript"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>TXT</span>
                    </button>
                  </div>
                </div>

                {/* S3 Media Player Simulation */}
                <div className="aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center group">
                  <div className="text-center p-6 space-y-2">
                    <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
                      <Play className="w-6 h-6 ml-0.5" />
                    </div>
                    <span className="text-xs text-slate-300 font-medium block">
                      Secure S3 Streaming · 1080p Composite Media
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {selectedRecording.s3Uri}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Customer Consent Verified Prior to Ingest</span>
                  </div>
                </div>

                {/* Interactive Transcript Player with Search & PII Redaction */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Synchronized Speech Transcript
                      </span>
                    </div>

                    {/* PII Toggle */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 text-[11px]">PCI-DSS Redaction:</span>
                      <button
                        onClick={() => setPiiMaskActive(!piiMaskActive)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors ${
                          piiMaskActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {piiMaskActive ? 'MASK ON (••••)' : 'RAW UNMASKED'}
                      </button>
                    </div>
                  </div>

                  {/* Transcript Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      placeholder="Search within conversation spoken words..."
                      className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Dialogue Entries */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
                    {filteredTranscript.map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-400">{entry.speaker}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">
                          {piiMaskActive && entry.redactedText ? entry.redactedText : entry.text}
                        </p>
                        {entry.containsSensitivePII && (
                          <div className="text-[10px] font-mono text-amber-400 pt-0.5">
                            [PCI-DSS Alert: Sensitive card/account token masked]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a recording from the roster to inspect media and synchronized speech transcript.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
