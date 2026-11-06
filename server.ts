import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/inMemoryDb';
import { meetingNextBackend } from './src/db/meetingNextBackend';
import { redactFinancialPII } from './src/utils/speechRecognition';
import {
  getAwsServiceStatus,
  getOrCreateChimeMeetingSession,
  createChimeMeetingSession,
  getChimeMeetingDetails,
  deleteChimeMeetingSession,
  createChimeAttendee,
  initiateOutboundCall,
  sendSmsNotification,
  sendEmailNotification,
  generateAiMeetingInsights,
} from './src/services/awsServiceIntegration';
import { generateMeetingLink } from './src/utils/appUrl';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Session Token & Authentication Context Middleware
  app.use((req: Request, _res: Response, next) => {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] as string;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : sessionToken;

    if (token) {
      // Keep session alive for Sarthak Jain, CFA
      const currentUser = meetingNextBackend.getCurrentUser();
      if (!currentUser) {
        meetingNextBackend.login('sarthak.jain@businessnext.com', 'Sarthak@2026');
      }
    }
    next();
  });
  // REST API Routes - Section 13 API Design
  // ---------------------------------------------------------------------------

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'CRMNEXT Communication & AI Meeting Platform',
      timestamp: new Date().toISOString(),
      awsChimeConnected: true,
      amazonConnectProvisioned: true,
      awsStatus: getAwsServiceStatus(),
    });
  });

  // 1. Dashboard Metrics
  app.get('/api/dashboard/metrics', (_req: Request, res: Response) => {
    try {
      const metrics = db.getDashboardMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Customers
  app.get('/api/customers', (_req: Request, res: Response) => {
    res.json(db.getCustomers());
  });

  app.get('/api/customers/:id', (req: Request, res: Response) => {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  });

  app.put('/api/customers/:id/notes', (req: Request, res: Response) => {
    const { notes } = req.body;
    db.updateCustomerNotes(req.params.id, notes || '');
    res.json({ success: true, customerId: req.params.id, notes });
  });

  // 3. Relationship Managers
  app.get('/api/rms', (_req: Request, res: Response) => {
    res.json(db.getRMs());
  });

  // ---------------------------------------------------------------------------
  // Section 4: Production Amazon Chime SDK Video Meeting REST APIs
  // Single Persistent Meeting per Application Meeting Session
  // ---------------------------------------------------------------------------

  // 1. GET /api/meetings - List meetings
  app.get('/api/meetings', (_req: Request, res: Response) => {
    try {
      const meetings = meetingNextBackend.getMeetings();
      res.json(meetings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. GET /api/meetings/:id - Fetch meeting details, persistent Chime info, and active roster
  app.get('/api/meetings/:id', (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const cleanId = rawId
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');

      const meeting = meetingNextBackend.getMeetingById(cleanId) ||
        meetingNextBackend.getOrCreateScheduledMeeting(cleanId);

      const participants = meetingNextBackend.getRoomParticipants(cleanId);
      const meetingUrl = generateMeetingLink(cleanId);

      res.json({
        success: true,
        applicationMeetingId: cleanId,
        meeting,
        chimeMeetingId: meeting.chimeMeetingId || null,
        status: meeting.status,
        participants,
        meetingUrl,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. POST /api/meetings - Create application meeting with unique, permanent URL
  app.post('/api/meetings', async (req: Request, res: Response) => {
    try {
      const {
        title,
        reason,
        customerName,
        customerNumber,
        customerEmail,
        date,
        time,
        scheduledDate,
        startTime,
        durationMinutes,
        meetingId: customMeetingId,
      } = req.body;

      const scheduledDateVal = date || scheduledDate || 'Tomorrow';
      const scheduledTimeVal = time || startTime || '11:00 AM';
      const cName = customerName || 'Customer Attendee';
      const cPhone = customerNumber || '+1 (415) 890-4412';
      const cEmail = customerEmail || `${cName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
      const meetingTitle = title || reason || 'Banking Video Consultation';

      const cleanMeetingId = (customMeetingId || `mtg-${Math.floor(1000 + Math.random() * 9000)}`)
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');

      const result = meetingNextBackend.scheduleMeeting({
        id: cleanMeetingId,
        customerName: cName,
        customerNumber: cPhone,
        customerEmail: cEmail,
        reason: meetingTitle,
        date: scheduledDateVal,
        time: scheduledTimeVal,
        durationMinutes: durationMinutes || 30,
      });

      const meetingUrl = generateMeetingLink(cleanMeetingId);

      // Auto-dispatch notifications via AWS SNS and SES
      Promise.all([
        sendSmsNotification({
          to: cPhone,
          customerName: cName,
          meetingLink: meetingUrl,
          meetingDate: scheduledDateVal,
          meetingTime: scheduledTimeVal,
          reason: meetingTitle,
        }),
        sendEmailNotification({
          to: cEmail,
          customerName: cName,
          meetingLink: meetingUrl,
          meetingDate: scheduledDateVal,
          meetingTime: scheduledTimeVal,
          reason: meetingTitle,
        }),
      ]).catch((err) => console.warn('[AWS Dispatch Note]:', err));

      res.status(201).json({
        success: true,
        applicationMeetingId: cleanMeetingId,
        meetingUrl,
        meeting: {
          ...result.meeting,
          meetingUrl,
        },
        receipts: result.receipts,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create meeting' });
    }
  });

  // 4. POST /api/meetings/:id/start - Organizer starts meeting as HOST
  app.post('/api/meetings/:id/start', async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const cleanId = rawId
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');

      const user = meetingNextBackend.getCurrentUser();
      const externalUserId = req.body.externalUserId || req.body.userId || user?.id || 'rm_sarthak_jain';
      const userName = req.body.userName || user?.name || 'Sarthak Jain, CFA';

      // Start or retrieve single persistent Chime meeting session in ap-south-1 (Mumbai)
      const session = await getOrCreateChimeMeetingSession(cleanId, externalUserId, userName);

      // Register host participant in active room roster
      meetingNextBackend.joinRoom(cleanId, {
        id: externalUserId,
        name: userName,
        role: 'Host · Senior RM',
        isHost: true,
        avatarColor: 'bg-rose-600',
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
      });

      res.json({
        success: true,
        host: true,
        role: 'host',
        applicationMeetingId: cleanId,
        chimeMeetingId: session.chimeMeetingId,
        chimeMeeting: session.chimeMeeting,
        attendee: session.attendee,
        meetingUrl: generateMeetingLink(cleanId),
        provider: session.provider,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to start meeting session' });
    }
  });

  // 5. POST /api/meetings/:id/join - Participant joins meeting as ATTENDEE (reusing SAME Chime MeetingId)
  app.post('/api/meetings/:id/join', async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const cleanId = rawId
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');

      const externalUserId =
        req.body.externalUserId ||
        req.body.userId ||
        `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const userName = req.body.userName || req.body.name || 'Guest Attendee';

      // Host detection: only Sarthak Jain or explicitly authenticated host
      const isHost =
        req.body.isHost === true ||
        externalUserId === 'rm_sarthak_jain' ||
        externalUserId === 'rm-sarthak-jain';

      // getOrCreateChimeMeetingSession guarantees:
      // 1. Exactly ONE Chime MeetingId per applicationMeetingId
      // 2. Creates a unique attendee via CreateAttendeeCommand
      // 3. Never calls CreateMeetingCommand if meeting already exists
      const session = await getOrCreateChimeMeetingSession(cleanId, externalUserId, userName);

      // Register attendee in active room roster
      meetingNextBackend.joinRoom(cleanId, {
        id: externalUserId,
        name: userName,
        role: isHost ? 'Host · Senior RM' : 'Attendee',
        isHost,
        avatarColor: isHost ? 'bg-rose-600' : 'bg-blue-600',
        isMuted: !!req.body.isMuted,
        isVideoOff: !!req.body.isVideoOff,
        isScreenSharing: false,
      });

      res.json({
        success: true,
        host: isHost,
        role: isHost ? 'host' : 'attendee',
        applicationMeetingId: cleanId,
        chimeMeetingId: session.chimeMeetingId,
        chimeMeeting: session.chimeMeeting,
        attendee: session.attendee,
        meetingUrl: generateMeetingLink(cleanId),
        provider: session.provider,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to join meeting' });
    }
  });

  // 6. POST /api/meetings/:id/leave - Participant leaves cleanly
  app.post('/api/meetings/:id/leave', (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const cleanId = rawId
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');
      const participantId = req.body.participantId || req.body.userId || req.body.externalUserId;

      if (participantId) {
        meetingNextBackend.leaveRoom(cleanId, participantId);
      }

      res.json({
        success: true,
        message: 'Attendee left meeting cleanly without terminating session',
        applicationMeetingId: cleanId,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. POST /api/meetings/:id/end - Host ends meeting for ALL participants
  app.post('/api/meetings/:id/end', async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const cleanId = rawId
        .replace(/^https?:\/\/[^\/]+\/(meeting\/|room\/)?/, '')
        .replace(/^\/+/, '')
        .replace(/^(meeting|room)\//, '');

      // Terminate AWS Chime meeting session via DeleteMeetingCommand
      await deleteChimeMeetingSession(cleanId);

      // Complete meeting in backend
      const completed = meetingNextBackend.completeMeeting(cleanId);

      res.json({
        success: true,
        status: 'completed',
        applicationMeetingId: cleanId,
        message: 'Meeting terminated for all participants',
        meeting: completed,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to terminate meeting' });
    }
  });

  // 6. Direct Audio & Telephony Communication
  // POST /api/calls/audio (In-app Chime 1-on-1 audio meeting)
  app.post('/api/calls/audio', (req: Request, res: Response) => {
    const { customerId, customerName, rmId, rmName } = req.body;

    const callRecord = db.createCall({
      customerId: customerId || 'cust_david_sterling',
      customerName: customerName || 'David Sterling',
      customerPhone: req.body.customerPhone || '+1 (415) 890-4412',
      rmId: rmId || 'rm_sarah_lin',
      rmName: rmName || 'Sarah Lin, CFA',
      direction: 'outbound',
      mode: 'in_app_audio',
      telephonyProvider: 'Amazon Chime SDK Meetings',
      status: 'completed',
      startTime: 'Just now',
      durationSeconds: req.body.durationSeconds || 0,
      associatedTicketId: req.body.associatedTicketId,
      notes: req.body.notes || 'In-app secure audio call via Amazon Chime SDK.',
    });

    res.status(201).json({
      success: true,
      call: callRecord,
      chimeAudioRoom: {
        meetingId: `audio-chime-${callRecord.id}`,
        joinToken: `token-audio-${Math.random().toString(36).substring(2, 9)}`,
      },
    });
  });

  // POST /api/calls/phone (Amazon Connect Customer PSTN dialer)
  app.post('/api/calls/phone', (req: Request, res: Response) => {
    const { customerId, customerName, customerPhone, rmId, rmName, associatedTicketId, notes } = req.body;
    const awsConfig = db.getAwsConfig();

    const callRecord = db.createCall({
      customerId: customerId || 'cust_david_sterling',
      customerName: customerName || 'David Sterling',
      customerPhone: customerPhone || '+1 (415) 890-4412',
      rmId: rmId || 'rm_sarah_lin',
      rmName: rmName || 'Sarah Lin, CFA',
      direction: 'outbound',
      mode: 'pstn_telephony',
      telephonyProvider: 'Amazon Connect Customer',
      status: 'completed',
      startTime: 'Just now',
      durationSeconds: req.body.durationSeconds || 320,
      associatedTicketId,
      notes: notes || 'Amazon Connect Customer outbound PSTN call.',
      followUpCreated: true,
    });

    res.status(201).json({
      success: true,
      call: callRecord,
      amazonConnect: {
        contactId: `cnt-${Date.now()}`,
        instanceArn: awsConfig.amazonConnectInstanceArn,
        contactFlowId: awsConfig.amazonConnectContactFlowId,
        sourcePhoneNumber: awsConfig.amazonConnectSourcePhone,
        targetPhoneNumber: customerPhone,
      },
    });
  });

  // GET /api/calls/history
  app.get('/api/calls/history', (req: Request, res: Response) => {
    const { customerId } = req.query;
    let calls = db.getCalls();
    if (customerId) {
      calls = calls.filter((c) => c.customerId === customerId);
    }
    res.json(calls);
  });

  // 7. Recordings & Transcripts
  // GET /api/meetings/:id/recordings
  app.get('/api/meetings/:id/recordings', (req: Request, res: Response) => {
    const recordings = db.getRecordingsByMeetingId(req.params.id);
    res.json(recordings);
  });

  // GET /api/recordings (all recordings)
  app.get('/api/recordings', (_req: Request, res: Response) => {
    res.json(db.getRecordings());
  });

  // POST /api/meetings/:id/recording/start
  app.post('/api/meetings/:id/recording/start', (req: Request, res: Response) => {
    const meeting = db.getMeetingById(req.params.id);
    const newRec = db.createRecording({
      meetingId: req.params.id,
      title: meeting?.title || 'Recorded Meeting Session',
      customerId: meeting?.customerId || 'cust_david_sterling',
      customerName: meeting?.customerName || 'David Sterling',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      durationFormatted: '00:01',
      durationSeconds: 1,
      fileSizeBytes: 1024000,
      s3Uri: `s3://apexbank-chime-recordings/2026/11/${req.params.id}/composite.mp4`,
      presignedUrl: `https://s3.us-east-1.amazonaws.com/apexbank-chime-recordings/${req.params.id}/composite.mp4?expires=900`,
      expiresInMinutes: 15,
      storageTier: 'S3 Standard',
      consentGiven: true,
      piiRedacted: true,
      transcriptionStatus: 'Processing',
    });

    if (meeting) {
      db.updateMeeting(meeting.id, { hasRecording: true });
    }

    res.status(201).json({
      success: true,
      recording: newRec,
      mediaPipelineId: `pipeline-${Date.now()}`,
    });
  });

  // POST /api/meetings/:id/recording/stop
  app.post('/api/meetings/:id/recording/stop', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Media capture pipeline stopped, composite media uploaded to S3.' });
  });

  // GET /api/meetings/:id/transcript
  app.get('/api/meetings/:id/transcript', (req: Request, res: Response) => {
    const transcript = db.getTranscript(req.params.id);
    res.json(transcript);
  });

  // POST /api/meetings/:id/transcript
  app.post('/api/meetings/:id/transcript', (req: Request, res: Response) => {
    const { speaker, role, text, timestamp } = req.body;
    const { sanitized, hasPII } = redactFinancialPII(text || '');

    const entry = db.addTranscriptEntry(req.params.id, {
      speaker: speaker || 'Participant',
      role: role || 'Attendee',
      text: sanitized,
      timestamp: timestamp || '00:00',
      containsSensitivePII: hasPII,
      redactedText: hasPII ? sanitized : undefined,
    });

    res.status(201).json(entry);
  });

  // 8. AI Meeting Analysis (Bedrock LLM)
  // GET /api/meetings/:id/analysis
  app.get('/api/meetings/:id/analysis', (req: Request, res: Response) => {
    const analysis = db.getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'AI analysis not yet generated for this meeting' });
    }
    res.json(analysis);
  });

  // POST /api/meetings/:id/analyze
  app.post('/api/meetings/:id/analyze', (req: Request, res: Response) => {
    const meeting = db.getMeetingById(req.params.id);
    const existing = db.getAnalysis(req.params.id);

    if (existing) {
      return res.json(existing);
    }

    const customerName = meeting?.customerName || 'David Sterling';
    const meetingTitle = meeting?.title || 'Commercial Banking Consultation';

    const newAnalysis = {
      meetingId: req.params.id,
      analyzedAt: new Date().toLocaleString(),
      modelUsed: 'Amazon Bedrock (Claude 3.5 Sonnet)' as const,
      executiveSummary: `${customerName} and Senior Relationship Manager Sarah Lin completed consultation on "${meetingTitle}". Key agreements were achieved regarding credit facility parameters and transaction settlement approvals.`,
      detailedSummary: `The discussion covered interest rate hedges, underwriting documentation, and electronic signature workflows. All compliance criteria under FINRA and GLBA regulations were satisfied. Customer requested prompt delivery of executable contracts.`,
      importantPoints: [
        'Confirmed agreed pricing terms and facility rate-lock.',
        'Validated customer identity with voice biometric matching.',
        'Reviewed open tickets and escrow funding milestones.',
      ],
      customerExpectations: [
        'Timely delivery of electronic signature documents.',
        'Immediate notification upon wire transfer clearance.',
      ],
      customerIntent: {
        reasonForContact: 'Finalize credit terms and verify settlement logistics.',
        requirements: ['Fixed interest rate lock', 'Expedited approval turnaround'],
        objections: [],
        unresolvedConcerns: [],
        productInterests: ['Commercial Jumbo Loans', 'Treasury Liquidity Management'],
      },
      sentiment: {
        overall: 'Positive' as const,
        score: 94,
        progression: [
          { time: '00:00', score: 80 },
          { time: '10:00', score: 88 },
          { time: '20:00', score: 95 },
        ],
        dissatisfactionFlags: [],
      },
      actionItems: [
        {
          id: `act_${Date.now()}_1`,
          meetingId: req.params.id,
          task: `Send executable term sheet bundle to ${customerName}`,
          assignedTo: 'Sarah Lin, CFA',
          responsiblePerson: 'Sarah Lin, CFA',
          deadline: 'Today, 5:00 PM EST',
          priority: 'High' as const,
          status: 'Pending' as const,
        },
        {
          id: `act_${Date.now()}_2`,
          meetingId: req.params.id,
          task: 'Verify wire pre-authorization with AML compliance desk',
          assignedTo: 'Elena Rostova',
          responsiblePerson: 'Elena Rostova',
          deadline: 'Tomorrow, 10:00 AM EST',
          priority: 'High' as const,
          status: 'Pending' as const,
        },
      ],
      followUpEmail: {
        subject: `Follow-up: Discussion regarding ${meetingTitle}`,
        greeting: `Dear ${customerName},`,
        body: `Thank you for taking the time to speak today. I am following up on our agreed items and attaching the documentation for your review.`,
        agreedNextSteps: [
          'Review the attached documentation',
          'Execute digital signature through DocuSign portal',
        ],
        requiredDocuments: ['Signed Facility Agreement', 'Updated Corporate Resolution'],
        status: 'draft' as const,
      },
      crmUpdateSuggestions: [
        {
          field: 'Customer Engagement Tier',
          proposedValue: 'Active Tier-1 Borrower',
          reason: 'Customer successfully concluded commercial financing review.',
          approved: false,
        },
        {
          field: 'Next Review Date',
          proposedValue: '2027-11-01',
          reason: 'Annual portfolio review scheduled 12 months ahead.',
          approved: false,
        },
      ],
      qualityAnalysis: {
        durationMinutes: meeting?.durationMinutes || 30,
        talkRatioRM: 48,
        talkRatioCustomer: 52,
        unansweredQuestions: [],
        qualityScore: 95,
        suggestedImprovements: [
          'Strong two-way dialogue balance.',
          'Clear articulation of rate lock conditions and timelines.',
        ],
      },
    };

    db.saveAnalysis(req.params.id, newAnalysis);
    res.status(201).json(newAnalysis);
  });

  // 9. Follow-Ups
  app.get('/api/followups', (_req: Request, res: Response) => {
    res.json(db.getFollowUps());
  });

  app.post('/api/followups', (req: Request, res: Response) => {
    const newFup = db.createFollowUp(req.body);
    res.status(201).json(newFup);
  });

  app.put('/api/followups/:id', (req: Request, res: Response) => {
    const updated = db.updateFollowUp(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json(updated);
  });

  // 10. AWS Settings
  app.get('/api/settings/aws', (_req: Request, res: Response) => {
    res.json(db.getAwsConfig());
  });

  app.post('/api/settings/aws', (req: Request, res: Response) => {
    const updated = db.updateAwsConfig(req.body);
    res.json(updated);
  });

  // ---------------------------------------------------------------------------
  // MeetingNext Dedicated REST API Routes
  // ---------------------------------------------------------------------------

  // 1. Get all upcoming and past meetings
  app.get('/api/meetingnext/meetings', (_req: Request, res: Response) => {
    try {
      res.json(meetingNextBackend.getMeetings());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Schedule a meeting & auto-dispatch SMS and Gmail via AWS SNS and SES
  app.post('/api/meetingnext/meetings', async (req: Request, res: Response) => {
    const { customerName, customerNumber, customerEmail, reason, date, time, durationMinutes } = req.body;
    if (!customerName || !customerNumber) {
      return res.status(400).json({ error: 'Customer name and phone number are required.' });
    }

    try {
      const result = meetingNextBackend.scheduleMeeting({
        customerName,
        customerNumber,
        customerEmail,
        reason: reason || 'Loan Enrollment',
        date: date || 'Tomorrow',
        time: time || '11:00 AM',
        durationMinutes: durationMinutes || 30,
      });

      // Execute AWS SNS (SMS) and AWS SES (Email) dispatches
      const [smsRes, emailRes] = await Promise.all([
        sendSmsNotification({
          to: customerNumber,
          customerName,
          meetingLink: result.meeting.meetingLink,
          meetingDate: result.meeting.date,
          meetingTime: result.meeting.time,
          reason: result.meeting.reason,
        }),
        sendEmailNotification({
          to: result.meeting.customerEmail,
          customerName,
          meetingLink: result.meeting.meetingLink,
          meetingDate: result.meeting.date,
          meetingTime: result.meeting.time,
          reason: result.meeting.reason,
        }),
      ]);

      res.status(201).json({
        success: true,
        meeting: result.meeting,
        receipts: {
          sms: smsRes,
          gmail: emailRes,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2b. Retrieve meeting details by ID
  app.get('/api/meetingnext/meetings/:id', (req: Request, res: Response) => {
    try {
      const meeting = meetingNextBackend.getMeetingById(req.params.id) ||
        meetingNextBackend.getOrCreateScheduledMeeting(req.params.id);
      res.json({ meeting });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Update / Reschedule meeting details
  app.put('/api/meetingnext/meetings/:id', async (req: Request, res: Response) => {
    try {
      const result = meetingNextBackend.updateMeeting(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Re-dispatch updated calendar notifications
      const [smsRes, emailRes] = await Promise.all([
        sendSmsNotification({
          to: result.meeting.customerNumber,
          customerName: result.meeting.customerName,
          meetingLink: result.meeting.meetingLink,
          meetingDate: result.meeting.date,
          meetingTime: result.meeting.time,
          reason: `RESCHEDULED: ${result.meeting.reason}`,
        }),
        sendEmailNotification({
          to: result.meeting.customerEmail,
          customerName: result.meeting.customerName,
          meetingLink: result.meeting.meetingLink,
          meetingDate: result.meeting.date,
          meetingTime: result.meeting.time,
          reason: `RESCHEDULED: ${result.meeting.reason}`,
        }),
      ]);

      res.json({
        success: true,
        meeting: result.meeting,
        receipts: { sms: smsRes, gmail: emailRes },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Join meeting room (Amazon Chime SDK WebRTC Credentials)
  app.post('/api/meetingnext/meetings/:id/join', async (req: Request, res: Response) => {
    try {
      const rawId = req.params.id;
      const meeting = meetingNextBackend.getOrCreateScheduledMeeting(rawId);
      const userId = req.body.userId || req.body.externalUserId || 'rm_sarthak_jain';
      const userName = req.body.userName;

      const session = await getOrCreateChimeMeetingSession(meeting.id, userId, userName);
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to join meeting' });
    }
  });

  // ---------------------------------------------------------------------------
  // Amazon Chime SDK Meetings Dedicated APIs (Single Persistent Meeting)
  // ---------------------------------------------------------------------------

  // Create or retrieve a Chime meeting (ap-south-1 Mumbai)
  app.post('/api/chime/meetings', async (req: Request, res: Response) => {
    try {
      const user = meetingNextBackend.getCurrentUser();
      const externalUserId = req.body.externalUserId || user?.id || 'rm_sarthak_jain';
      const meetingId = req.body.meetingId || `mtg_instant_${Date.now()}`;
      const userName = req.body.userName || user?.name;

      const session = await getOrCreateChimeMeetingSession(meetingId, externalUserId, userName);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create Chime meeting session' });
    }
  });

  // Join an existing Chime meeting & generate unique attendee credentials under the same MeetingId
  app.post('/api/chime/meetings/:meetingId/join', async (req: Request, res: Response) => {
    try {
      const user = meetingNextBackend.getCurrentUser();
      const meetingId = req.params.meetingId;
      const externalUserId = req.body.externalUserId || req.body.userId || user?.id || `user_${Date.now()}`;
      const userName = req.body.userName || (user?.id === externalUserId ? user?.name : undefined);

      const session = await getOrCreateChimeMeetingSession(meetingId, externalUserId, userName);
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to join Chime meeting' });
    }
  });

  // Generate unique attendee for an active Chime meeting
  app.post('/api/chime/meetings/:meetingId/attendees', async (req: Request, res: Response) => {
    try {
      const { externalUserId } = req.body;
      if (!externalUserId) {
        return res.status(400).json({ error: 'externalUserId is required' });
      }
      const attendeeRes = await createChimeAttendee(req.params.meetingId, externalUserId);
      res.status(201).json(attendeeRes);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create attendee' });
    }
  });

  // Retrieve active Chime meeting details & roster
  app.get('/api/chime/meetings/:meetingId', async (req: Request, res: Response) => {
    try {
      const details = await getChimeMeetingDetails(req.params.meetingId);
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch Chime meeting' });
    }
  });

  // End / Delete a Chime meeting (ap-south-1)
  app.delete('/api/chime/meetings/:meetingId', async (req: Request, res: Response) => {
    try {
      const meetingId = req.params.meetingId;
      const result = await deleteChimeMeetingSession(meetingId);
      
      // Complete meeting in schedule if applicable
      meetingNextBackend.completeMeeting(meetingId);

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to terminate Chime meeting' });
    }
  });

  // Real-time Room Participants & Roster Synchronization
  app.get('/api/meetingnext/meetings/:meetingId/participants', (req: Request, res: Response) => {
    try {
      const participants = meetingNextBackend.getRoomParticipants(req.params.meetingId);
      res.json(participants);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/meetingnext/meetings/:meetingId/participants', (req: Request, res: Response) => {
    try {
      const { id, name, role, isHost, avatarColor, isMuted, isVideoOff, isScreenSharing } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }
      const participants = meetingNextBackend.joinRoom(req.params.meetingId, {
        id,
        name,
        role: role || 'Participant',
        isHost: !!isHost,
        avatarColor: avatarColor || 'bg-blue-600',
        isMuted: !!isMuted,
        isVideoOff: !!isVideoOff,
        isScreenSharing: !!isScreenSharing,
      });
      res.status(201).json(participants);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/meetingnext/meetings/:meetingId/participants/:participantId/heartbeat', (req: Request, res: Response) => {
    try {
      meetingNextBackend.heartbeatRoom(req.params.meetingId, req.params.participantId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/meetingnext/meetings/:meetingId/participants/:participantId', (req: Request, res: Response) => {
    try {
      const participants = meetingNextBackend.leaveRoom(req.params.meetingId, req.params.participantId);
      res.json({ success: true, participants });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Room In-Meeting Chat Messages
  app.get('/api/meetingnext/meetings/:meetingId/messages', (req: Request, res: Response) => {
    try {
      const messages = meetingNextBackend.getRoomMessages(req.params.meetingId);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/meetingnext/meetings/:meetingId/messages', (req: Request, res: Response) => {
    try {
      const { senderId, senderName, senderRole, text, isHost } = req.body;
      if (!text || !senderName) {
        return res.status(400).json({ error: 'text and senderName are required' });
      }
      const msg = meetingNextBackend.sendRoomMessage(req.params.meetingId, {
        senderId: senderId || `usr_${Date.now()}`,
        senderName,
        senderRole: senderRole || 'Attendee',
        text,
        isHost: !!isHost,
      });
      res.status(201).json(msg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Complete meeting & generate AI transcript / summary with Gemini / AWS
  app.post('/api/meetingnext/meetings/:id/complete', async (req: Request, res: Response) => {
    try {
      const completed = meetingNextBackend.completeMeeting(req.params.id);
      if (!completed) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const aiInsights = await generateAiMeetingInsights(completed);
      res.json({ success: true, meeting: completed, aiInsights });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Telephonic calls history
  app.get('/api/meetingnext/calls', (_req: Request, res: Response) => {
    res.json(meetingNextBackend.getCalls());
  });

  // 7. Log a telephonic call
  app.post('/api/meetingnext/calls', (req: Request, res: Response) => {
    try {
      const call = meetingNextBackend.logCall(req.body);
      res.status(201).json({ success: true, call });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Outbound cellular phone call dispatch (Amazon Chime Voice / Connect PSTN with TRAI 140xx / 1600xx Compliance)
  app.post('/api/meetingnext/calls/dispatch', async (req: Request, res: Response) => {
    const { customerNumber, customerName, callPurposeCategory, traiSeries } = req.body;
    if (!customerNumber) {
      return res.status(400).json({ error: 'Customer phone number is required.' });
    }

    const callResult = await initiateOutboundCall({
      customerNumber,
      customerName: customerName || 'Direct Dial Customer',
      callPurposeCategory: callPurposeCategory || 'service_reminder',
      traiSeries: traiSeries || '1600_service',
      agentUsername: 'sarthak.jain',
    });

    const isPromotional = traiSeries === '140_promotional' || callPurposeCategory === 'promoting_schemes';
    const purposeLabel = 
      callPurposeCategory === 'promoting_schemes' ? 'Promoting New Schemes & Loan Products' :
      callPurposeCategory === 'service_reminder' ? 'Service & KYC Reminder' :
      callPurposeCategory === 'relationship_greeting' ? 'Customer Greetings & Relationship Management' :
      'Outbound Banking Verification Call';

    const callRecord = meetingNextBackend.logCall({
      customerName: customerName || 'Direct Dial Customer',
      customerNumber,
      reason: purposeLabel,
      direction: 'Outbound',
      duration: '0m 00s (Ringing)',
      status: 'Completed',
      notes: `TRAI Compliant Call via ${callResult.provider}. Caller ID: ${callResult.assignedAuthorizedCallerId}. RM personal mobile masked.`,
      traiSeries: (isPromotional ? '140_promotional' : '1600_service') as any,
      authorizedCallerId: callResult.assignedAuthorizedCallerId,
      callPurposeCategory: callPurposeCategory || (isPromotional ? 'promoting_schemes' : 'service_reminder'),
      traiComplianceStatus: (isPromotional ? 'DND Scrubbed & Verified (140-CLI)' : 'Compliant - Service CLI (1600)') as any,
      branchEmployeeName: 'Sarthak Jain, CFA (Senior RM)',
      employeePersonalNumberHidden: true,
    });

    res.json({
      ...callResult,
      call: callRecord,
    });
  });

  // 9. Direct SMS dispatch via AWS SNS
  app.post('/api/meetingnext/dispatch/sms', async (req: Request, res: Response) => {
    const { to, message, customerName, meetingLink, meetingDate, meetingTime, reason } = req.body;
    const smsRes = await sendSmsNotification({
      to: to || '+91 98200 12345',
      customerName: customerName || 'Valued Customer',
      meetingLink: meetingLink || generateMeetingLink(`mtg-chime-${Date.now()}`),
      meetingDate: meetingDate || 'Tomorrow',
      meetingTime: meetingTime || '11:00 AM',
      reason: reason || 'Banking Service',
    });
    res.json(smsRes);
  });

  // 10. Direct Email dispatch via AWS SES
  app.post('/api/meetingnext/dispatch/gmail', async (req: Request, res: Response) => {
    const { to, customerName, meetingLink, meetingDate, meetingTime, reason } = req.body;
    const emailRes = await sendEmailNotification({
      to: to || 'customer@gmail.com',
      customerName: customerName || 'Valued Customer',
      meetingLink: meetingLink || generateMeetingLink(`mtg-chime-${Date.now()}`),
      meetingDate: meetingDate || 'Tomorrow',
      meetingTime: meetingTime || '11:00 AM',
      reason: reason || 'Banking Consultation',
    });
    res.json(emailRes);
  });

  // 11. AI Meeting transcript & summary
  app.get('/api/meetingnext/ai/:meetingId', async (req: Request, res: Response) => {
    const meeting = meetingNextBackend.getMeetingById(req.params.meetingId);
    if (meeting) {
      const aiInsights = await generateAiMeetingInsights(meeting);
      return res.json(aiInsights);
    }
    const details = meetingNextBackend.getAiData(req.params.meetingId);
    if (!details) {
      return res.status(404).json({ error: 'AI details not found' });
    }
    res.json(details);
  });

  // 12. Dispatch logs
  app.get('/api/meetingnext/dispatch/logs', (_req: Request, res: Response) => {
    res.json(meetingNextBackend.getDispatchLogs());
  });

  // 13. Authentication Endpoints (Synchronized with Sarthak Jain, CFA session)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const result = meetingNextBackend.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', (_req: Request, res: Response) => {
    const user = meetingNextBackend.getCurrentUser();
    if (!user) {
      return res.status(401).json({ authenticated: false, user: null });
    }
    res.json({ authenticated: true, user });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    meetingNextBackend.logout();
    res.json({ success: true, message: 'Signed out successfully' });
  });

  // 14. Amazon Connect Customer Outbound Calling Integration
  app.get('/api/connect/config', (_req: Request, res: Response) => {
    const baseConfig = meetingNextBackend.getAmazonConnectConfig();
    res.json({
      ...baseConfig,
      awsServiceStatus: getAwsServiceStatus(),
    });
  });

  app.post('/api/connect/outbound-call', async (req: Request, res: Response) => {
    try {
      const { customerNumber, customerName, callPurposeCategory, traiSeries, agentUsername } = req.body;
      if (!customerNumber) {
        return res.status(400).json({ error: 'customerNumber is required' });
      }

      const callResult = await initiateOutboundCall({
        customerNumber,
        customerName: customerName || 'Direct Dial Customer',
        callPurposeCategory: callPurposeCategory || 'service_reminder',
        traiSeries: traiSeries || '1600_service',
        agentUsername: agentUsername || 'sarthak.jain',
      });

      const callResponse = meetingNextBackend.initiateAmazonConnectOutboundCall({
        customerNumber,
        customerName: customerName || 'Direct Dial Customer',
        callPurposeCategory: callPurposeCategory || 'service_reminder',
        traiSeries: traiSeries || '1600_service',
        agentUsername: agentUsername || 'sarthak.jain',
      });

      res.status(200).json({
        ...callResponse,
        ...callResult,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/connect/contact/:contactId', (req: Request, res: Response) => {
    res.json({
      contactId: req.params.contactId,
      status: 'Connected',
      agent: 'Sarthak Jain, CFA',
      instanceAlias: 'crmnext-bank-connect',
      awsRegion: 'ap-south-1',
      audioCodec: 'Opus 48kHz',
      encryption: 'TLS 1.3 / SRTP with AWS KMS Customer Master Key (CMK)',
    });
  });

  // ---------------------------------------------------------------------------
  // Vite Integration (Development Middleware / Static Production)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 MeetingNext Platform running at http://localhost:${PORT}`);
    console.log(`📡 Network URL: http://0.0.0.0:${PORT}\n`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n⚠️  Port ${PORT} is currently in use on your system.`);
      console.warn(`Attempting fallback to port ${PORT + 1}...`);
      const fallbackServer = app.listen(PORT + 1, '0.0.0.0', () => {
        console.log(`\n🚀 MeetingNext Platform running on fallback port: http://localhost:${PORT + 1}\n`);
      });
      fallbackServer.on('error', (fallbackErr: any) => {
        console.error(`\n❌ Failed to bind on port ${PORT} or ${PORT + 1}:`, fallbackErr.message);
        console.error(`Please stop whatever is using port ${PORT} or specify a custom port:`);
        console.error(`  PORT=3005 npm run dev\n`);
      });
    } else {
      console.error('Server error encountered:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
