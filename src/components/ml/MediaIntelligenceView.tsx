import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Volume2,
  Mic,
  Activity,
  CheckCircle2,
  FileText,
  Copy,
  Brain,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { LiveSpeechEngine, redactFinancialPII } from '../../utils/speechRecognition';

export const MediaIntelligenceView: React.FC = () => {
  // Voice Focus (Noise Reduction) Simulation
  const [voiceFocusEnabled, setVoiceFocusEnabled] = useState(true);
  const [ambientNoiseLevel, setAmbientNoiseLevel] = useState(65); // dB
  const [speechSignalLevel, setSpeechSignalLevel] = useState(82);

  // Live PII Redactor Test Bench
  const [rawTextSample, setRawTextSample] = useState(
    'Please authorize the wire transfer of $150,000 for customer David Sterling. The debit account number is 4920-1182-9901 and Social Security identifier is 982-12-8491.'
  );
  const [redactedResult, setRedactedResult] = useState('');
  const [hasPIIFound, setHasPIIFound] = useState(false);

  // AI Meeting Minutes & Intent Insights
  const [sentimentScore, setSentimentScore] = useState(88); // 88% positive
  const [speakerAnalysis] = useState([
    { speaker: 'Sarah Lin (RM)', share: 44, sentiment: 'Highly Professional · Helpful' },
    { speaker: 'David Sterling (Client)', share: 38, sentiment: 'Confident · Receptive' },
    { speaker: 'Marcus Vance (Wealth)', share: 18, sentiment: 'Analytical · Structured' },
  ]);

  const [aiSummary, setAiSummary] = useState(
    `Executive Brief:
1. Mortgage Refinance: Fixed rate lock confirmed at 5.15% on 7-year term sheet (TCK-2024-88).
2. Wire Pre-Authorization: €320,000 international transfer cleared AML screening.
3. Tax Advisory: Private trust allocation approved for Q4 tax-loss harvesting.`
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Real-time Canvas Audio Spectrum
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const { sanitized, hasPII } = redactFinancialPII(rawTextSample);
    setRedactedResult(sanitized);
    setHasPIIFound(hasPII);
  }, [rawTextSample]);

  // Animated Audio Spectrum Visualizer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const renderSpectrum = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 36;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        // Calculate frequency response
        const freqRatio = i / numBars;
        let height = 0;

        // Human speech band (center frequencies)
        const isSpeechBand = freqRatio > 0.2 && freqRatio < 0.65;
        if (isSpeechBand) {
          height = Math.sin(time * 3 + i * 0.4) * 25 + 35;
        } else {
          // Noise band
          if (voiceFocusEnabled) {
            // Voice Focus suppresses background noise drastically
            height = Math.sin(time * 2 + i * 0.3) * 4 + 6;
          } else {
            // Noise unsuppressed
            height = Math.sin(time * 5 + i * 0.8) * 18 + 24;
          }
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - height;

        ctx.fillStyle = isSpeechBand
          ? '#3b82f6'
          : voiceFocusEnabled
          ? '#10b981'
          : '#ef4444';

        ctx.fillRect(x, y, barWidth, height);
      }

      animId = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();
    return () => cancelAnimationFrame(animId);
  }, [voiceFocusEnabled]);

  const handleRegenerateMinutes = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiSummary(
        `CRMNEXT Automated Minutes & Compliance Digest (Updated):
• Client David Sterling confirmed escrow instructions for $1.8M refinance.
• Compliance Auditor Elena Rostova verified AML wire pre-check.
• Action Item for Sarah Lin: Dispatch Promissory Note for DocuSign execution by 5:00 PM EST.`
      );
      setIsGeneratingAi(false);
    }, 1000);
  };

  const copySummaryText = () => {
    navigator.clipboard.writeText(aiSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Machine Learning & Media Intelligence
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Amazon Chime Voice Focus noise reduction, speaker diarization, sentiment tracking, and
              PCI-DSS PII redaction.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2.5 py-1 rounded">
            <Brain className="w-3.5 h-3.5" />
            <span>Chime ML Pipeline Active</span>
          </div>
        </div>

        {/* Feature 1: Amazon Chime Voice Focus DSP */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Amazon Chime Voice Focus (Deep Learning Noise Suppression)</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Suppresses barking dogs, HVAC rumble, office chatter, and keyboard clicks while
                preserving high-fidelity human vocal timbre.
              </p>
            </div>

            <button
              onClick={() => setVoiceFocusEnabled(!voiceFocusEnabled)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                voiceFocusEnabled
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {voiceFocusEnabled ? 'Voice Focus: ENABLED (-40dB Noise)' : 'Voice Focus: DISABLED'}
            </button>
          </div>

          {/* Audio Spectrum Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Acoustic Frequency Spectrum (0Hz - 20kHz)</span>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Human Vocal Tract
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${
                      voiceFocusEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {voiceFocusEnabled ? 'Suppressed Noise' : 'Ambient Noise Leak'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <canvas
                ref={canvasRef}
                width={800}
                height={100}
                className="w-full h-24 block rounded"
              />
            </div>
          </div>
        </div>

        {/* Feature 2: Real-Time Financial PII Redaction Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Real-Time Financial PII Redaction & DLP Engine</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Complies with PCI-DSS Level 1 & GLBA by redacting payment card PANs and Social Security
                numbers before audio/text storage.
              </p>
            </div>

            {hasPIIFound && (
              <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Masking Active</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Raw Input Box */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">
                Live Voice Transcription Ingest (Test with CC or SSN digits):
              </label>
              <textarea
                value={rawTextSample}
                onChange={(e) => setRawTextSample(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Redacted Compliant Output Box */}
            <div className="space-y-1.5">
              <label className="block text-emerald-400 font-medium">
                Compliant Redacted Transcript (Safe for CRMNEXT Archival):
              </label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 font-mono min-h-[96px] leading-relaxed">
                {redactedResult}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Speaker Diarization, Sentiment & AI Minutes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Speaker Diarization & Sentiment */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Speaker Diarization & Real-Time Sentiment
            </span>

            {/* Sentiment Meter */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Call Sentiment Index</span>
                <span className="font-mono font-bold text-emerald-400">{sentimentScore}% Positive</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${sentimentScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500">
                Customer tone indicators: Receptive, cooperative, low friction.
              </div>
            </div>

            {/* Speaker Diarization Breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Talk-Time Distribution
              </span>
              {speakerAnalysis.map((s, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{s.speaker}</span>
                    <span className="font-mono text-blue-400">{s.share}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{s.sentiment}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: AI Meeting Minutes & CRMNEXT Ticket Generator */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Meeting Minutes & Action Items
              </span>
              <button
                onClick={handleRegenerateMinutes}
                disabled={isGeneratingAi}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
              >
                {isGeneratingAi ? 'Analyzing...' : 'Refresh Minutes'}
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs whitespace-pre-wrap leading-relaxed text-slate-200 font-mono">
              {aiSummary}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={copySummaryText}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={() => alert('Synced executive minutes directly to CRMNEXT Ticket TCK-2024-88.')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export to CRMNEXT Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
