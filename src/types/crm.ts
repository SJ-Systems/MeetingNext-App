/**
 * CRMNEXT Enterprise Communication & AI Meeting Platform - Data Models
 */

export type MeetingType = 'audio' | 'video';
export type MeetingStatus = 'scheduled' | 'connecting' | 'in_progress' | 'completed' | 'canceled' | 'missed';
export type CallMode = 'in_app_audio' | 'pstn_telephony';
export type CallOutcome = 'completed' | 'missed' | 'unanswered' | 'busy' | 'failed';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type FollowUpStatus = 'Pending' | 'In Progress' | 'Completed';

export interface RelationshipManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  avatar: string;
  availabilitySchedule: {
    workDays: number[]; // 1 to 5 (Mon-Fri)
    startHour: number; // 9 = 9 AM
    endHour: number; // 18 = 6 PM
  };
}

export interface CustomerTicket {
  id: string;
  title: string;
  category: 'Lending' | 'Wealth Advisory' | 'Wire Transfer' | 'Account Services';
  status: 'In Progress' | 'Escalated' | 'Pending Approval' | 'Closed';
  priority: PriorityLevel;
  updatedAt: string;
  amount?: string;
}

export interface CustomerRecord {
  id: string;
  customerId: string;
  name: string;
  email: string;
  mobile: string;
  avatar: string;
  accountType: 'Private Wealth' | 'Commercial Banking' | 'Premier Retail';
  accountNumber: string;
  portfolioValue: string;
  kycStatus: 'Verified' | 'Pending Review' | 'Tier-3 VIP';
  assignedRMId: string;
  assignedRMName: string;
  company?: string;
  openTickets: CustomerTicket[];
  notes: string;
  createdAt: string;
}

export interface MeetingAttendee {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'customer' | 'attendee' | 'compliance_auditor';
  avatar: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  handRaised?: boolean;
  joinedAt?: string;
}

export interface MeetingItem {
  id: string;
  internalReference: string; // e.g. MTG-2026-8812
  title: string;
  description: string;
  agenda: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  rmId: string;
  rmName: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationSeconds?: number;
  chimeMeetingId?: string;
  invitationUrl: string;
  attendees: MeetingAttendee[];
  reminderPreferences: {
    email: boolean;
    sms: boolean;
    timeBeforeMinutes: number;
  };
  hasRecording?: boolean;
  hasTranscript?: boolean;
  hasAiAnalysis?: boolean;
  associatedTicketId?: string;
  notes?: string;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  rmId: string;
  rmName: string;
  direction: 'inbound' | 'outbound';
  mode: CallMode;
  telephonyProvider: 'Amazon Chime SDK Meetings' | 'Amazon Connect Customer';
  status: CallOutcome;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  recordingUrl?: string;
  associatedTicketId?: string;
  notes: string;
  followUpCreated?: boolean;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  task: string;
  assignedTo: string;
  responsiblePerson: string;
  deadline: string;
  priority: PriorityLevel;
  status: 'Pending' | 'Completed';
}

export interface FollowUpItem {
  id: string;
  meetingId?: string;
  customerId: string;
  customerName: string;
  rmId: string;
  rmName: string;
  title: string;
  description: string;
  dueDate: string;
  priority: PriorityLevel;
  status: FollowUpStatus;
  channel: 'Email' | 'Phone Call' | 'Video Meeting' | 'DocuSign Document';
  completedAt?: string;
}

export interface MeetingTranscriptEntry {
  id: string;
  speaker: string;
  role: string;
  text: string;
  timestamp: string; // mm:ss
  containsSensitivePII?: boolean;
  redactedText?: string;
}

export interface MeetingAnalysisData {
  meetingId: string;
  analyzedAt: string;
  modelUsed: 'Amazon Bedrock (Claude 3.5 Sonnet)' | 'Amazon Bedrock (Titan Express)';
  executiveSummary: string;
  detailedSummary: string;
  importantPoints: string[];
  customerExpectations: string[];
  customerIntent: {
    reasonForContact: string;
    requirements: string[];
    objections: string[];
    unresolvedConcerns: string[];
    productInterests: string[];
  };
  sentiment: {
    overall: 'Positive' | 'Neutral' | 'Attention Needed';
    score: number; // 0 - 100
    progression: { time: string; score: number }[];
    dissatisfactionFlags: string[];
  };
  actionItems: ActionItem[];
  followUpEmail: {
    subject: string;
    greeting: string;
    body: string;
    agreedNextSteps: string[];
    requiredDocuments: string[];
    status: 'draft' | 'approved' | 'sent';
  };
  crmUpdateSuggestions: {
    field: string;
    proposedValue: string;
    reason: string;
    approved: boolean;
  }[];
  qualityAnalysis: {
    durationMinutes: number;
    talkRatioRM: number; // e.g. 45%
    talkRatioCustomer: number; // e.g. 55%
    unansweredQuestions: string[];
    qualityScore: number; // 0 - 100
    suggestedImprovements: string[];
  };
}

export interface MeetingRecordingItem {
  id: string;
  meetingId: string;
  title: string;
  customerId: string;
  customerName: string;
  date: string;
  durationFormatted: string;
  durationSeconds: number;
  fileSizeBytes: number;
  s3Uri: string;
  presignedUrl: string;
  expiresInMinutes: number;
  storageTier: 'S3 Standard' | 'S3 Glacier Flexible' | 'Vault Deep Archive';
  consentGiven: boolean;
  piiRedacted: boolean;
  transcriptionStatus: 'Complete' | 'Processing';
}

export interface DashboardMetrics {
  totalMeetingsThisMonth: number;
  upcomingMeetingsCount: number;
  completedMeetingsCount: number;
  missedMeetingsCount: number;
  totalCallDurationMinutes: number;
  averageMeetingDurationMinutes: number;
  pendingFollowUpsCount: number;
  sentimentAverageScore: number;
}

export interface AwsConfig {
  chimeRegion: string;
  chimeMessagingArn: string;
  mediaPipelinesS3Bucket: string;
  s3KmsKeyArn: string;
  amazonConnectInstanceArn: string;
  amazonConnectContactFlowId: string;
  amazonConnectSourcePhone: string;
  bedrockModelId: string;
  transcribeLanguage: string;
  retentionYears: number;
  isConnectProvisioned: boolean;
  isBedrockEnabled: boolean;
}
