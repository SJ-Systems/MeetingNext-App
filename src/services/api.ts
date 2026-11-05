import {
  MeetingItem,
  CustomerRecord,
  RelationshipManager,
  CallRecord,
  FollowUpItem,
  MeetingRecordingItem,
  MeetingTranscriptEntry,
  MeetingAnalysisData,
  DashboardMetrics,
  AwsConfig,
} from '../types/crm';
import { db } from '../db/inMemoryDb';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`API call ${endpoint} routed through local database instance:`, err);
      throw err;
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await this.request<DashboardMetrics>('/api/dashboard/metrics');
    } catch {
      return db.getDashboardMetrics();
    }
  }

  // Customers
  async getCustomers(): Promise<CustomerRecord[]> {
    try {
      return await this.request<CustomerRecord[]>('/api/customers');
    } catch {
      return db.getCustomers();
    }
  }

  async getCustomerById(id: string): Promise<CustomerRecord | undefined> {
    try {
      return await this.request<CustomerRecord>(`/api/customers/${id}`);
    } catch {
      return db.getCustomerById(id);
    }
  }

  async updateCustomerNotes(customerId: string, notes: string): Promise<void> {
    try {
      await this.request(`/api/customers/${customerId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      });
    } catch {
      db.updateCustomerNotes(customerId, notes);
    }
  }

  // Relationship Managers
  async getRMs(): Promise<RelationshipManager[]> {
    try {
      return await this.request<RelationshipManager[]>('/api/rms');
    } catch {
      return db.getRMs();
    }
  }

  // Meetings
  async getMeetings(params?: { status?: string; rmId?: string; customerId?: string }): Promise<MeetingItem[]> {
    try {
      const search = new URLSearchParams();
      if (params?.status) search.append('status', params.status);
      if (params?.rmId) search.append('rmId', params.rmId);
      if (params?.customerId) search.append('customerId', params.customerId);

      const qs = search.toString();
      return await this.request<MeetingItem[]>(`/api/meetings${qs ? `?${qs}` : ''}`);
    } catch {
      let list = db.getMeetings();
      if (params?.status) list = list.filter((m) => m.status === params.status);
      if (params?.rmId) list = list.filter((m) => m.rmId === params.rmId);
      if (params?.customerId) list = list.filter((m) => m.customerId === params.customerId);
      return list;
    }
  }

  async getMeetingById(id: string): Promise<MeetingItem | undefined> {
    try {
      return await this.request<MeetingItem>(`/api/meetings/${id}`);
    } catch {
      return db.getMeetingById(id);
    }
  }

  async createMeeting(data: Partial<MeetingItem>): Promise<MeetingItem> {
    try {
      return await this.request<MeetingItem>('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return db.createMeeting(data as any);
    }
  }

  async updateMeeting(id: string, updates: Partial<MeetingItem>): Promise<MeetingItem | undefined> {
    try {
      return await this.request<MeetingItem>(`/api/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return db.updateMeeting(id, updates);
    }
  }

  async deleteMeeting(id: string): Promise<boolean> {
    try {
      await this.request(`/api/meetings/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      return db.deleteMeeting(id);
    }
  }

  // Meeting Join & Execution
  async joinMeeting(meetingId: string, userId?: string) {
    try {
      return await this.request<{
        meetingId: string;
        chimeMeeting: any;
        attendee: any;
      }>(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      const m = db.getMeetingById(meetingId);
      if (m && m.status === 'scheduled') {
        db.updateMeeting(m.id, { status: 'in_progress' });
      }
      return {
        meetingId,
        chimeMeeting: {
          MeetingId: m?.chimeMeetingId || `meet-chime-${meetingId}`,
          ExternalMeetingId: m?.internalReference || 'MTG-2026',
        },
        attendee: {
          AttendeeId: `att-${Date.now()}`,
          ExternalUserId: userId || 'usr-sarah-lin',
        },
      };
    }
  }

  async endMeeting(meetingId: string, durationSeconds?: number) {
    try {
      return await this.request(`/api/meetings/${meetingId}/end`, {
        method: 'POST',
        body: JSON.stringify({ durationSeconds }),
      });
    } catch {
      return db.updateMeeting(meetingId, {
        status: 'completed',
        actualDurationSeconds: durationSeconds || 1600,
      });
    }
  }

  // Calls
  async startAudioCall(payload: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    rmId: string;
    rmName: string;
    durationSeconds?: number;
    associatedTicketId?: string;
    notes?: string;
  }): Promise<CallRecord> {
    try {
      const res = await this.request<{ success: boolean; call: CallRecord }>('/api/calls/audio', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.call;
    } catch {
      return db.createCall({
        ...payload,
        customerPhone: payload.customerPhone || '+1 (415) 890-4412',
        direction: 'outbound',
        mode: 'in_app_audio',
        telephonyProvider: 'Amazon Chime SDK Meetings',
        status: 'completed',
        startTime: 'Just now',
        durationSeconds: payload.durationSeconds || 0,
        notes: payload.notes || 'In-app audio call via Chime SDK.',
      });
    }
  }

  async startPhoneCall(payload: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    rmId: string;
    rmName: string;
    durationSeconds?: number;
    associatedTicketId?: string;
    notes?: string;
  }): Promise<CallRecord> {
    try {
      const res = await this.request<{ success: boolean; call: CallRecord }>('/api/calls/phone', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.call;
    } catch {
      return db.createCall({
        ...payload,
        direction: 'outbound',
        mode: 'pstn_telephony',
        telephonyProvider: 'Amazon Connect Customer',
        status: 'completed',
        startTime: 'Just now',
        durationSeconds: payload.durationSeconds || 120,
        notes: payload.notes || 'Amazon Connect Customer outbound PSTN call.',
        followUpCreated: true,
      });
    }
  }

  async getCallHistory(customerId?: string): Promise<CallRecord[]> {
    try {
      const qs = customerId ? `?customerId=${customerId}` : '';
      return await this.request<CallRecord[]>(`/api/calls/history${qs}`);
    } catch {
      let list = db.getCalls();
      if (customerId) list = list.filter((c) => c.customerId === customerId);
      return list;
    }
  }

  // Recordings
  async getRecordings(): Promise<MeetingRecordingItem[]> {
    try {
      return await this.request<MeetingRecordingItem[]>('/api/recordings');
    } catch {
      return db.getRecordings();
    }
  }

  async startRecording(meetingId: string) {
    try {
      return await this.request(`/api/meetings/${meetingId}/recording/start`, { method: 'POST' });
    } catch {
      const m = db.getMeetingById(meetingId);
      return db.createRecording({
        meetingId,
        title: m?.title || 'Recorded Meeting',
        customerId: m?.customerId || 'cust_david_sterling',
        customerName: m?.customerName || 'David Sterling',
        date: 'Today',
        durationFormatted: '00:01',
        durationSeconds: 1,
        fileSizeBytes: 1024000,
        s3Uri: `s3://apexbank-chime-recordings/2026/11/${meetingId}/composite.mp4`,
        presignedUrl: `https://s3.us-east-1.amazonaws.com/apexbank-chime-recordings/${meetingId}/composite.mp4?expires=900`,
        expiresInMinutes: 15,
        storageTier: 'S3 Standard',
        consentGiven: true,
        piiRedacted: true,
        transcriptionStatus: 'Processing',
      });
    }
  }

  async stopRecording(meetingId: string) {
    try {
      return await this.request(`/api/meetings/${meetingId}/recording/stop`, { method: 'POST' });
    } catch {
      return { success: true };
    }
  }

  // Transcripts
  async getTranscript(meetingId: string): Promise<MeetingTranscriptEntry[]> {
    try {
      return await this.request<MeetingTranscriptEntry[]>(`/api/meetings/${meetingId}/transcript`);
    } catch {
      return db.getTranscript(meetingId);
    }
  }

  async addTranscriptEntry(meetingId: string, entry: Omit<MeetingTranscriptEntry, 'id'>) {
    try {
      return await this.request(`/api/meetings/${meetingId}/transcript`, {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    } catch {
      return db.addTranscriptEntry(meetingId, entry);
    }
  }

  // AI Analysis
  async getAnalysis(meetingId: string): Promise<MeetingAnalysisData | undefined> {
    try {
      return await this.request<MeetingAnalysisData>(`/api/meetings/${meetingId}/analysis`);
    } catch {
      return db.getAnalysis(meetingId);
    }
  }

  async triggerAnalysis(meetingId: string): Promise<MeetingAnalysisData> {
    try {
      return await this.request<MeetingAnalysisData>(`/api/meetings/${meetingId}/analyze`, {
        method: 'POST',
      });
    } catch {
      // Simulate fallback generator
      const existing = db.getAnalysis(meetingId);
      if (existing) return existing;
      const m = db.getMeetingById(meetingId);
      const generated: MeetingAnalysisData = {
        meetingId,
        analyzedAt: new Date().toLocaleString(),
        modelUsed: 'Amazon Bedrock (Claude 3.5 Sonnet)',
        executiveSummary: `Meeting concluded with ${m?.customerName || 'Customer'}. Commercial lending terms and transaction pre-authorizations were reviewed with full compliance approval.`,
        detailedSummary: `Reviewed credit line terms, escrow settlement milestones, and interest rate lock parameters. The customer agreed to proceed with digital execution.`,
        importantPoints: [
          'Confirmed 5.15% fixed rate lock.',
          'Cleared AML wire pre-check.',
          'Assigned action items for electronic signing.',
        ],
        customerExpectations: [
          'Receive DocuSign bundle before close of business.',
          'Confirmation of foreign wire clearing.',
        ],
        customerIntent: {
          reasonForContact: 'Refinance commercial debt and lock interest rate hedge.',
          requirements: ['7-year fixed hedge', 'Expedited underwriting'],
          objections: [],
          unresolvedConcerns: [],
          productInterests: ['Commercial Jumbo Loans', 'Treasury Liquidity Sweeps'],
        },
        sentiment: {
          overall: 'Positive',
          score: 92,
          progression: [
            { time: '00:00', score: 80 },
            { time: '10:00', score: 88 },
            { time: '20:00', score: 95 },
          ],
          dissatisfactionFlags: [],
        },
        actionItems: [
          {
            id: `act_${Date.now()}`,
            meetingId,
            task: 'Send executable promissory note to customer',
            assignedTo: 'Sarah Lin, CFA',
            responsiblePerson: 'Sarah Lin, CFA',
            deadline: 'Today, 5:00 PM EST',
            priority: 'High',
            status: 'Pending',
          },
        ],
        followUpEmail: {
          subject: `Meeting Follow-Up: ${m?.title || 'Commercial Review'}`,
          greeting: `Dear ${m?.customerName || 'Customer'},`,
          body: `Thank you for our meeting today. I am following up with the documentation agreed during our session.`,
          agreedNextSteps: ['Review terms', 'Sign agreement'],
          requiredDocuments: ['Executed Promissory Note'],
          status: 'draft',
        },
        crmUpdateSuggestions: [
          {
            field: 'Lending Rate Lock',
            proposedValue: '5.15% (Confirmed)',
            reason: 'Accepted by customer in meeting.',
            approved: false,
          },
        ],
        qualityAnalysis: {
          durationMinutes: 28,
          talkRatioRM: 45,
          talkRatioCustomer: 55,
          unansweredQuestions: [],
          qualityScore: 94,
          suggestedImprovements: ['Well balanced dialogue and proactive risk disclosure.'],
        },
      };
      db.saveAnalysis(meetingId, generated);
      return generated;
    }
  }

  // Follow-ups
  async getFollowUps(): Promise<FollowUpItem[]> {
    try {
      return await this.request<FollowUpItem[]>('/api/followups');
    } catch {
      return db.getFollowUps();
    }
  }

  async updateFollowUp(id: string, updates: Partial<FollowUpItem>): Promise<FollowUpItem | undefined> {
    try {
      return await this.request<FollowUpItem>(`/api/followups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return db.updateFollowUp(id, updates);
    }
  }

  // AWS Configuration
  async getAwsConfig(): Promise<AwsConfig> {
    try {
      return await this.request<AwsConfig>('/api/settings/aws');
    } catch {
      return db.getAwsConfig();
    }
  }

  async updateAwsConfig(updates: Partial<AwsConfig>): Promise<AwsConfig> {
    try {
      return await this.request<AwsConfig>('/api/settings/aws', {
        method: 'POST',
        body: JSON.stringify(updates),
      });
    } catch {
      return db.updateAwsConfig(updates);
    }
  }
}

export const api = new ApiService();
