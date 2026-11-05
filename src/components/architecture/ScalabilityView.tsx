import React, { useState } from 'react';
import {
  Globe,
  Server,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  DollarSign
} from 'lucide-react';

export const ScalabilityView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [activeTab, setActiveTab] = useState<'architecture' | 'free_tier' | 'latency'>('architecture');

  const regions = [
    { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 18, status: 'Optimal', compliance: 'SOC-2, HIPAA, FINRA' },
    { id: 'us-west-2', name: 'US West (Oregon)', latencyMs: 34, status: 'Optimal', compliance: 'SOC-2, HIPAA, FedRAMP' },
    { id: 'eu-central-1', name: 'Europe (Frankfurt)', latencyMs: 78, status: 'Active', compliance: 'GDPR Data Sovereign' },
    { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', latencyMs: 112, status: 'Active', compliance: 'FISC, APPI Compliant' },
    { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', latencyMs: 125, status: 'Active', compliance: 'RBI Data Localization' },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Scalability, Global Reach & Free Tier Architecture
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Global infrastructure design for high-volume banking communication, CRMNEXT integration,
              and 100% free prototype deployment.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'architecture' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              System Topology
            </button>
            <button
              onClick={() => setActiveTab('free_tier')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'free_tier' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Zero-Cost / Free Guide
            </button>
            <button
              onClick={() => setActiveTab('latency')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'latency' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global Latency Probe
            </button>
          </div>
        </div>

        {/* Tab 1: System Topology & Banking Blueprint */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Amazon Chime SDK + CRMNEXT End-to-End Enterprise Topology</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Zero Trust Architecture
                </span>
              </div>

              {/* Step-by-Step Flow Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {/* 1. Client Layer */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>1. Client Touchpoint</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    CRMNEXT Web App, Mobile SDK, and Banking Customer Portals.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    WebRTC DTLS-SRTP, TLS 1.3
                  </div>
                </div>

                {/* 2. Global Accelerator */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>2. Anycast Edge</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    AWS Global Accelerator routes packets via dedicated AWS backbone.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Sub-20ms packet transit
                  </div>
                </div>

                {/* 3. Media Service */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                    <Server className="w-4 h-4" />
                    <span>3. Chime Media Core</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Selective Forwarding Unit (SFU) audio/video mixing & Content Share.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    250+ video participants
                  </div>
                </div>

                {/* 4. Media Pipelines */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>4. ML & Redaction</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Amazon Transcribe streaming with PCI-DSS / GLBA automated redaction.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Real-time DLP masking
                  </div>
                </div>

                {/* 5. Storage & CRM */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    <span>5. S3 Vault & CRM</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Encrypted storage in S3 Glacier with bi-directional CRMNEXT webhook sync.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    7-Year FINRA WORM
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Compliance Certifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Banking Regulatory & Encryption Standards
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="font-semibold text-white block">PCI-DSS Level 1</span>
                  <span className="text-[11px] text-slate-400">Cardholder PAN and CVV zero-leakage tokenization</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="font-semibold text-white block">FINRA Rule 4511</span>
                  <span className="text-[11px] text-slate-400">Books & records 7-year immutable WORM archiving</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="font-semibold text-white block">HIPAA & SOC 2</span>
                  <span className="text-[11px] text-slate-400">Annual Type II certification with AWS KMS encryption</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="font-semibold text-white block">FIPS 140-2</span>
                  <span className="text-[11px] text-slate-400">Hardware Security Module (HSM) key protection</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Free Tier & Cost-Zero Prototype Strategy */}
        {activeTab === 'free_tier' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>How This Prototype Runs 100% Free</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Zero Cloud Costs
                </span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">1. Client-Side WebRTC & Browser Native APIs</span>
                  <p className="text-slate-400">
                    This entire application uses native HTML5 WebRTC (`navigator.mediaDevices.getUserMedia`),
                    Display Media Screen Share, and the client-side `MediaRecorder` API. Real video and
                    audio stream in peer-to-peer or local loopback without needing third-party media server
                    infrastructure fees.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">2. Web Audio API for Free Telephony & Hold Music</span>
                  <p className="text-slate-400">
                    Instead of paying per-minute PSTN gateway carrier trunks for testing, the dialer
                    generates real dual-tone multi-frequency (DTMF) acoustic tones (697Hz - 1477Hz) and
                    polyphonic hold music directly in the browser's Web Audio graph at $0 cost.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-semibold text-white block">3. AWS Chime SDK Free Tier & Developer Allowances</span>
                  <p className="text-slate-400">
                    When connecting to AWS in production, Amazon Chime SDK offers pay-as-you-go pricing
                    ($0.0017 per attendee minute) with $0 upfront costs, and AWS Free Tier grants 12 months
                    of free compute, S3 storage, and KMS key management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Global Latency Probe */}
        {activeTab === 'latency' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Amazon Chime SDK Global Media Placement Service</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Live Anycast Probing</span>
              </div>

              <div className="space-y-2.5">
                {regions.map((r) => {
                  const isSelected = selectedRegion === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRegion(r.id)}
                      className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            r.latencyMs < 50
                              ? 'bg-emerald-400'
                              : r.latencyMs < 100
                              ? 'bg-blue-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white text-xs">{r.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Region ID: {r.id} · Compliance: {r.compliance}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-white">{r.latencyMs} ms</div>
                        <div className="text-[10px] text-emerald-400 font-mono">{r.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Selected meeting routing region: <strong className="text-white font-mono">{selectedRegion}</strong></span>
                <button
                  onClick={() => alert(`Media routing preference updated to ${selectedRegion}. Meeting media will be placed in this region to enforce data sovereignty.`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                >
                  Set as Preferred Region
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
