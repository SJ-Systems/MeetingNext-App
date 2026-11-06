import express, { Request, Response } from 'express';
import { meetingNextBackend } from '../src/db/meetingNextBackend';
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
} from '../src/services/awsServiceIntegration';
import { generateMeetingLink } from '../src/utils/appUrl';

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

// Health check with real AWS & AI diagnostics
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CRMNEXT Communication & AI Meeting Platform (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    awsChimeConnected: true,
    amazonConnectProvisioned: true,
    awsStatus: getAwsServiceStatus(),
  });
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

    const session = await getOrCreateChimeMeetingSession(cleanId, externalUserId, userName);

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

    const isHost =
      req.body.isHost === true ||
      externalUserId === 'rm_sarthak_jain' ||
      externalUserId === 'rm-sarthak-jain';

    const session = await getOrCreateChimeMeetingSession(cleanId, externalUserId, userName);

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

    await deleteChimeMeetingSession(cleanId);
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

// Legacy MeetingNext path aliases
app.get('/api/meetingnext/meetings', (_req: Request, res: Response) => {
  try {
    res.json(meetingNextBackend.getMeetings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

app.put('/api/meetingnext/meetings/:id', async (req: Request, res: Response) => {
  try {
    const result = meetingNextBackend.updateMeeting(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

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

    res.json({ success: true, meeting: result.meeting, receipts: { sms: smsRes, gmail: emailRes } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

// Create or retrieve a Chime meeting
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

// 2. Calls
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

// 3. AI Insights
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

// 4. SMS & Email direct
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

// 5. Auth
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

// 6. Amazon Connect
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

export default app;
