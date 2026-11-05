/**
 * ChimeVault Connect - Domain Types
 * Amazon Chime SDK for Banking & CRMNEXT Architecture
 */

export type UserRole = 'RELATIONSHIP_MANAGER' | 'CLIENT' | 'WEALTH_ADVISOR' | 'COMPLIANCE_OFFICER' | 'CONTACT_CENTER_AGENT';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatarText: string;
  department: string;
  title: string;
  appInstanceUserArn: string;
}

export interface CustomerCRMRecord {
  customerId: string;
  name: string;
  accountType: 'Private Wealth' | 'Commercial Banking' | 'Premier Retail';
  accountNumber: string;
  portfolioValue: string;
  kycStatus: 'Verified' | 'Pending Review' | 'Tier-3 VIP';
  assignedRM: string;
  openTickets: {
    id: string;
    title: string;
    status: 'In Progress' | 'Escalated' | 'Pending Approval';
    priority: 'High' | 'Medium';
    updatedAt: string;
  }[];
  recentActivities: {
    date: string;
    action: string;
    channel: 'Video Meeting' | 'PSTN Call' | 'Secure Chat';
  }[];
}

export interface Participant {
  id: string;
  name: string;
  role: UserRole;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100
  handRaised: boolean;
  avatarColor: string;
  connectionQuality: 'excellent' | 'good' | 'poor';
}

export interface MeetingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
}

export interface LiveTranscriptItem {
  id: string;
  speaker: string;
  role: UserRole;
  text: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'attention_needed';
  containsSensitivePII?: boolean;
  redactedText?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  category: 'channel' | 'direct';
  participantName?: string;
  participantRole?: UserRole;
  participantOnline?: boolean;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  avatarText: string;
  text: string;
  timestamp: string;
  isE2EE: boolean;
  attachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'img' | 'doc';
    url?: string;
  };
  piiFlag?: boolean;
  readByCount: number;
}

export type PSTNCallStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'on_hold' | 'ended';

export interface ActiveCallState {
  status: PSTNCallStatus;
  direction: 'inbound' | 'outbound';
  phoneNumber: string;
  callerName?: string;
  customerProfile?: CustomerCRMRecord;
  durationSeconds: number;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  dtmfLog: string[];
  transferredTo?: string;
}

export interface MediaPipelineSession {
  id: string;
  title: string;
  meetingId: string;
  date: string;
  duration: string;
  fileSizeBytes: number;
  status: 'active' | 'completed' | 'archived';
  storageTier: 'S3 Standard' | 'S3 Glacier Flexible' | 'Vault Deep Archive';
  transcriptionStatus: 'Complete' | 'Processing';
  piiRedacted: boolean;
  downloadUrl?: string;
  summary: string;
  keyTopics: string[];
}

export interface AppInstanceData {
  appInstanceArn: string;
  name: string;
  region: string;
  createdDate: string;
  activeUsersCount: number;
  activeChannelsCount: number;
  kmsKeyId: string;
  dataRetentionDays: number;
}
