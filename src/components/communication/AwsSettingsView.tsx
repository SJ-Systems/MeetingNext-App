import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  Key,
  Database,
  Sparkles,
  PhoneCall,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code
} from 'lucide-react';
import { AwsConfig } from '../../types/crm';
import { api } from '../../services/api';

interface AwsSettingsViewProps {
  config: AwsConfig;
  onUpdateConfig: (updated: AwsConfig) => void;
}

export const AwsSettingsView: React.FC<AwsSettingsViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [formData, setFormData] = useState<AwsConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await api.updateAwsConfig(formData);
    onUpdateConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Settings & AWS Cloud Architecture
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configuration console for Amazon Chime SDK, Amazon Connect Customer telephony, Bedrock
              LLM models, and KMS encryption.
            </p>
          </div>

          {isSaved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration Synchronized</span>
            </span>
          )}
        </div>

        {/* AWS Infrastructure Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
              Amazon Chime SDK Meetings
            </span>
            <div className="font-semibold text-white text-sm">WebRTC Multi-Region Mesh</div>
            <span className="text-[10px] font-mono text-emerald-400 block">
              Connected · Region: us-east-1
            </span>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
              Amazon Connect Customer Telephony
            </span>
            <div className="font-semibold text-white text-sm">PSTN Softphone Adapter</div>
            <span className="text-[10px] font-mono text-emerald-400 block">
              Provisioned · Inbound & Outbound Active
            </span>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">
              Amazon Bedrock AI Intelligence
            </span>
            <div className="font-semibold text-white text-sm">Claude 3.5 Sonnet & Titan</div>
            <span className="text-[10px] font-mono text-purple-400 block">
              High-Precision Banking Models Active
            </span>
          </div>
        </div>

        {/* AWS Settings Form */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">AWS Service Configuration Parameters</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Parameters are securely loaded via backend environment credentials (never exposed to client).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amazon Chime SDK Media Region
              </label>
              <input
                type="text"
                value={formData.chimeRegion}
                onChange={(e) => setFormData({ ...formData, chimeRegion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amazon Chime Messaging AppInstance ARN
              </label>
              <input
                type="text"
                value={formData.chimeMessagingArn}
                onChange={(e) => setFormData({ ...formData, chimeMessagingArn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amazon Connect Instance ARN
              </label>
              <input
                type="text"
                value={formData.amazonConnectInstanceArn}
                onChange={(e) => setFormData({ ...formData, amazonConnectInstanceArn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amazon Connect Outbound Caller ID (E.164)
              </label>
              <input
                type="text"
                value={formData.amazonConnectSourcePhone}
                onChange={(e) => setFormData({ ...formData, amazonConnectSourcePhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Media Pipeline S3 Storage Bucket
              </label>
              <input
                type="text"
                value={formData.mediaPipelinesS3Bucket}
                onChange={(e) => setFormData({ ...formData, mediaPipelinesS3Bucket: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                KMS Customer Managed Key (CMK) ARN
              </label>
              <input
                type="text"
                value={formData.s3KmsKeyArn}
                onChange={(e) => setFormData({ ...formData, s3KmsKeyArn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amazon Bedrock Model ID
              </label>
              <input
                type="text"
                value={formData.bedrockModelId}
                onChange={(e) => setFormData({ ...formData, bedrockModelId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                FINRA Regulatory Retention Period
              </label>
              <select
                value={formData.retentionYears}
                onChange={(e) => setFormData({ ...formData, retentionYears: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
              >
                <option value={7}>7 Years (FINRA Rule 4511 & SEC 17a-4)</option>
                <option value={10}>10 Years (Extended Commercial Banking)</option>
                <option value={5}>5 Years (Standard Retail)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save AWS Configuration</span>
            </button>
          </div>
        </form>

        {/* AWS Production Setup Documentation (Section 6 & 16 Requirement) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
            <Code className="w-4 h-4" />
            <span>Production Deployment & IAM Policy Setup Guide</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
            <div className="text-slate-500"># Required IAM permissions for the backend execution role:</div>
            <div>chime:CreateMeeting, chime:CreateAttendee, chime:CreateMediaCapturePipeline</div>
            <div>connect:StartOutboundVoiceContact, connect:StopContact</div>
            <div>bedrock:InvokeModel (anthropic.claude-3-5-sonnet-20241022-v2:0)</div>
            <div>transcribe:StartStreamTranscription, transcribe:StartMedicalStreamTranscription</div>
            <div>s3:PutObject, s3:GetObject, kms:GenerateDataKey, kms:Decrypt</div>
          </div>
        </div>
      </div>
    </div>
  );
};
