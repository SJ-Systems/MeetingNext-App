/**
 * MeetingNext - Domain Models
 * Clean, Google Workspace-style architecture with Amazon Chime SDK & TRAI Compliance Telephony
 */

export type MeetingReason = 
  | 'Loan Enrollment'
  | 'Bank Account Verification'
  | 'Account Opening'
  | 'Commercial Mortgage Consultation'
  | 'Wealth Advisory';

export type TraiCallerIdSeries = '1600_service' | '140_promotional';

export type CallPurposeCategory = 
  | 'promoting_schemes'
  | 'service_reminder'
  | 'relationship_greeting'
  | 'loan_verification';

export interface CustomerInfo {
  id: string;
  name: string;
  number: string;
  email: string;
}

export interface ScheduledMeeting {
  id: string;
  customerName: string;
  customerNumber: string;
  customerEmail: string;
  reason: MeetingReason | string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  meetingLink: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  sentViaMessage: boolean;
  sentViaGmail: boolean;
  
  // For past meetings
  actualDuration?: string; // e.g. "24 mins"
  completedDate?: string;
  hasAiInsights?: boolean;
}

export interface MeetingAiDetails {
  meetingId: string;
  customerName: string;
  reason: string;
  date: string;
  transcription: {
    speaker: string;
    time: string;
    text: string;
  }[];
  aiSummary: {
    overview: string;
    keyPoints: string[];
    customerIntent: string;
    actionItems: {
      task: string;
      assignedTo: string;
      dueDate: string;
    }[];
    sentimentScore: string;
  };
}

export interface TelephonicCall {
  id: string;
  customerName: string;
  customerNumber: string;
  reason?: string;
  dateTime: string;
  duration: string;
  direction: 'Outbound' | 'Inbound';
  status: 'Completed' | 'Missed' | 'Busy';
  notes?: string;

  // TRAI Regulatory & AWS Telephony compliance fields
  traiSeries?: TraiCallerIdSeries;
  authorizedCallerId?: string; // e.g. "1600-200-4810" or "140-910-8820"
  callPurposeCategory?: CallPurposeCategory;
  traiComplianceStatus?: string;
  branchEmployeeName?: string;
  employeePersonalNumberHidden?: boolean; // Always true as per TRAI mandate
}

export interface HomeInsights {
  totalMeetingsThisMonth: number;
  upcomingCount: number;
  completedCount: number;
  totalCallMinutes: number;
  customerSatisfactionRate: string;
  loanEnrollmentsCount: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  title: string;
  avatar: string;
  employeeId?: string;
  branchName?: string;
  token?: string;
}

export interface AmazonConnectCallRequest {
  customerNumber: string;
  customerName: string;
  callPurposeCategory: CallPurposeCategory;
  traiSeries: TraiCallerIdSeries;
  agentUsername?: string;
  rmId?: string;
}

export interface AmazonConnectCallResponse {
  success: boolean;
  contactId: string;
  contactFlowId: string;
  instanceId: string;
  queueId: string;
  sourcePhoneNumber: string;
  destinationPhoneNumber: string;
  status: 'Initiated' | 'Ringing' | 'Connected' | 'Queued' | 'Completed';
  timestamp: string;
  agentUsername: string;
  traiCompliance: {
    cliSeries: string;
    callerIdPresented: string;
    dndScrubbed: boolean;
    employeeMasked: boolean;
    allowedHoursNotice: string;
  };
  callRecord: TelephonicCall;
  ccpSoftphoneUrl?: string;
}

export interface AmazonConnectInstanceConfig {
  instanceId: string;
  instanceAlias: string;
  awsRegion: string;
  status: 'Active' | 'Configured';
  contactFlowId: string;
  queueId: string;
  authorizedClis: {
    promotional140: string;
    service1600: string;
  };
  ccpUrl: string;
  agentSoftphoneStatus: 'Available' | 'OnCall' | 'Offline';
}
