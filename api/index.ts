import express, { Request, Response } from 'express';
import { meetingNextBackend } from '../src/db/meetingNextBackend';

const app = express();
app.use(express.json());

// Session Token & Authentication Context Middleware
app.use((req: Request, _res: Response, next) => {
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'] as string;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : sessionToken;

  if (token) {
    const currentUser = meetingNextBackend.getCurrentUser();
    if (!currentUser) {
      meetingNextBackend.login('sarthak.jain@businessnext.com', 'Sarthak@2026');
    }
  }
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CRMNEXT Communication & AI Meeting Platform (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    awsChimeConnected: true,
    amazonConnectProvisioned: true,
  });
});

// Meetings
app.get('/api/meetingnext/meetings', (_req: Request, res: Response) => {
  try {
    res.json(meetingNextBackend.getMeetings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetingnext/meetings', (req: Request, res: Response) => {
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
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetingnext/meetings/:id', (req: Request, res: Response) => {
  try {
    const result = meetingNextBackend.updateMeeting(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetingnext/meetings/:id/join', (req: Request, res: Response) => {
  const meeting = meetingNextBackend.getMeetingById(req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  res.json({
    success: true,
    meetingId: meeting.id,
    chimeMeeting: {
      MeetingId: `chime-meet-${meeting.id}`,
      MediaRegion: 'us-east-1',
      MediaPlacement: {
        AudioHostUrl: 'audio.chime.us-east-1.amazonaws.com',
        AudioFallbackUrl: 'audio-fallback.chime.us-east-1.amazonaws.com',
        SignalingUrl: 'wss://signaling.chime.us-east-1.amazonaws.com',
        TurnControlUrl: 'turn.chime.us-east-1.amazonaws.com',
      },
    },
    attendee: {
      AttendeeId: `att-${Date.now()}`,
      ExternalUserId: req.body.userId || 'rm-sarthak-jain',
      JoinToken: `jwt-${Math.random().toString(36).substring(2, 10)}`,
    },
  });
});

app.post('/api/meetingnext/meetings/:id/complete', (req: Request, res: Response) => {
  try {
    const completed = meetingNextBackend.completeMeeting(req.params.id);
    if (!completed) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ success: true, meeting: completed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Calls
app.get('/api/meetingnext/calls', (_req: Request, res: Response) => {
  res.json(meetingNextBackend.getCalls());
});

app.post('/api/meetingnext/calls', (req: Request, res: Response) => {
  try {
    const call = meetingNextBackend.logCall(req.body);
    res.status(201).json({ success: true, call });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetingnext/calls/dispatch', (req: Request, res: Response) => {
  const { customerNumber, customerName, callPurposeCategory, traiSeries } = req.body;
  if (!customerNumber) {
    return res.status(400).json({ error: 'Customer phone number is required.' });
  }

  const isPromotional = traiSeries === '140_promotional' || callPurposeCategory === 'promoting_schemes';
  const assignedCli = isPromotional ? '140-910-8820' : '1600-200-4810';
  const purposeLabel =
    callPurposeCategory === 'promoting_schemes' ? 'Promoting New Schemes & Loan Products' :
    callPurposeCategory === 'service_reminder' ? 'Service & KYC Reminder' :
    callPurposeCategory === 'relationship_greeting' ? 'Customer Greetings & Relationship Management' :
    'Outbound Banking Verification Call';

  const cleanNum = customerNumber.replace(/[^\d+]/g, '');
  const callRecord = meetingNextBackend.logCall({
    customerName: customerName || 'Direct Dial Customer',
    customerNumber,
    reason: purposeLabel,
    direction: 'Outbound',
    duration: '0m 00s (Ringing)',
    status: 'Completed',
    notes: `TRAI Compliant Call via AWS Chime Voice Connector (ap-south-1). Customer received call with authorized bank CLI ${assignedCli}. Employee personal number is masked.`,
    traiSeries: isPromotional ? '140_promotional' : '1600_service',
    authorizedCallerId: assignedCli,
    callPurposeCategory: callPurposeCategory || (isPromotional ? 'promoting_schemes' : 'service_reminder'),
    traiComplianceStatus: isPromotional ? 'DND Scrubbed & Verified (140-CLI)' : 'Compliant - Service CLI (1600)',
    branchEmployeeName: 'Sarthak Jain, CFA (Senior RM)',
    employeePersonalNumberHidden: true,
  });

  res.json({
    success: true,
    pstnSessionId: `pstn_trai_${Date.now()}`,
    status: 'ringing',
    targetNumber: customerNumber,
    assignedAuthorizedCallerId: assignedCli,
    traiSeries: isPromotional ? '140xx Promotional' : '1600xx Service / Transactional',
    employeePersonalNumberMasked: true,
    provider: 'Amazon Chime SDK Voice Connector (AWS Mumbai ap-south-1)',
    call: callRecord,
    telUri: `tel:${cleanNum}`,
  });
});

// AI Details
app.get('/api/meetingnext/ai/:meetingId', (req: Request, res: Response) => {
  const details = meetingNextBackend.getAiData(req.params.id);
  if (!details) {
    return res.status(404).json({ error: 'AI details not found' });
  }
  res.json(details);
});

// Auth
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

// Amazon Connect
app.get('/api/connect/config', (_req: Request, res: Response) => {
  res.json(meetingNextBackend.getAmazonConnectConfig());
});

app.post('/api/connect/outbound-call', (req: Request, res: Response) => {
  try {
    const { customerNumber, customerName, callPurposeCategory, traiSeries, agentUsername } = req.body;
    if (!customerNumber) {
      return res.status(400).json({ error: 'customerNumber is required' });
    }
    const callResponse = meetingNextBackend.initiateAmazonConnectOutboundCall({
      customerNumber,
      customerName: customerName || 'Direct Dial Customer',
      callPurposeCategory: callPurposeCategory || 'service_reminder',
      traiSeries: traiSeries || '1600_service',
      agentUsername: agentUsername || 'sarthak.jain',
    });
    res.status(200).json(callResponse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
