import {
  RelationshipManager,
  CustomerRecord,
  MeetingItem,
  CallRecord,
  FollowUpItem,
  MeetingRecordingItem,
  MeetingTranscriptEntry,
  MeetingAnalysisData,
  DashboardMetrics,
  AwsConfig,
} from '../types/crm';

export const INITIAL_RM_USERS: RelationshipManager[] = [
  {
    id: 'rm_sarah_lin',
    name: 'Sarthak Jain, CFA',
    email: 'sarthak.jain@businessnext.com',
    phone: '+91 9518833885',
    department: 'Private Wealth Management',
    title: 'Senior Relationship Manager',
    avatar: 'SL',
    availabilitySchedule: {
      workDays: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 18,
    },
  },
  {
    id: 'rm_marcus_vance',
    name: 'Marcus Vance',
    email: 'm.vance@apexvaultbank.com',
    phone: '+1 (415) 890-1205',
    department: 'Structured Equity & Derivatives',
    title: 'Principal Wealth Strategist',
    avatar: 'MV',
    availabilitySchedule: {
      workDays: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 17,
    },
  },
  {
    id: 'rm_elena_rostova',
    name: 'Elena Rostova',
    email: 'e.rostova@apexvaultbank.com',
    phone: '+1 (212) 555-0194',
    department: 'Regulatory Compliance & Lending',
    title: 'Chief Compliance Auditor',
    avatar: 'ER',
    availabilitySchedule: {
      workDays: [1, 2, 3, 4, 5],
      startHour: 8,
      endHour: 17,
    },
  },
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust_david_sterling',
    customerId: 'CUST-883921',
    name: 'David Sterling',
    email: 'david.sterling@auroraventures.io',
    mobile: '+1 (415) 890-4412',
    avatar: 'DS',
    accountType: 'Private Wealth',
    accountNumber: '•••• •••• 9410',
    portfolioValue: '$2,485,000.00',
    kycStatus: 'Verified',
    assignedRMId: 'rm_sarah_lin',
    assignedRMName: 'Sarah Lin, CFA',
    company: 'Aurora Ventures LP',
    notes: 'Managing Partner at Aurora Ventures. Seeking $1.8M commercial jumbo loan rate-lock at 5.15% fixed and €320k foreign exchange wire authorization.',
    createdAt: '2025-04-12',
    openTickets: [
      {
        id: 'TCK-2024-88',
        title: 'Commercial Jumbo Mortgage Refinance ($1.8M)',
        category: 'Lending',
        status: 'In Progress',
        priority: 'High',
        updatedAt: '15 mins ago',
        amount: '$1,800,000',
      },
      {
        id: 'TCK-2024-41',
        title: 'International Wire Transfer Pre-Authorization (€320,000)',
        category: 'Wire Transfer',
        status: 'Pending Approval',
        priority: 'High',
        updatedAt: '2 hours ago',
        amount: '€320,000',
      },
    ],
  },
  {
    id: 'cust_sophia_chen',
    customerId: 'CUST-902144',
    name: 'Sophia Chen',
    email: 'sophia.chen@nexusbiotech.com',
    mobile: '+1 (650) 412-8890',
    avatar: 'SC',
    accountType: 'Commercial Banking',
    accountNumber: '•••• •••• 3128',
    portfolioValue: '$6,150,000.00',
    kycStatus: 'Verified',
    assignedRMId: 'rm_sarah_lin',
    assignedRMName: 'Sarah Lin, CFA',
    company: 'Nexus Biotech Inc',
    notes: 'Biotech CFO managing treasury sweep accounts and series C IPO escrow reserves.',
    createdAt: '2025-08-20',
    openTickets: [
      {
        id: 'TCK-2024-94',
        title: 'Treasury Automated Yield Sweeps Optimization',
        category: 'Wealth Advisory',
        status: 'In Progress',
        priority: 'Medium',
        updatedAt: 'Yesterday',
        amount: '$4,000,000',
      },
    ],
  },
  {
    id: 'cust_robert_tanaka',
    customerId: 'CUST-774910',
    name: 'Robert Tanaka',
    email: 'r.tanaka@tanakacapital.jp',
    mobile: '+1 (212) 555-8910',
    avatar: 'RT',
    accountType: 'Private Wealth',
    accountNumber: '•••• •••• 7712',
    portfolioValue: '$4,800,000.00',
    kycStatus: 'Tier-3 VIP',
    assignedRMId: 'rm_marcus_vance',
    assignedRMName: 'Marcus Vance',
    company: 'Tanaka Capital Global',
    notes: 'Family office director focusing on tax-efficient municipal bond ladders and private equity capital calls.',
    createdAt: '2024-11-05',
    openTickets: [
      {
        id: 'TCK-2024-65',
        title: 'Cross-Border Yen/USD Currency Swap Hedge',
        category: 'Wealth Advisory',
        status: 'Pending Approval',
        priority: 'High',
        updatedAt: '3 days ago',
        amount: '$2,500,000',
      },
    ],
  },
];

export const INITIAL_MEETINGS: MeetingItem[] = [
  {
    id: 'mtg_001',
    internalReference: 'MTG-2026-8812',
    title: 'Commercial Jumbo Mortgage Refinance ($1.8M Rate Lock)',
    description: 'Review finalized term sheet for 5.15% 7-year rate lock on commercial real estate facility.',
    agenda: '1. Review appraisal and title search\n2. Confirm 5.15% fixed rate lock\n3. Execute DocuSign promissory note\n4. Wire transfer instructions',
    meetingType: 'video',
    status: 'in_progress',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    customerEmail: 'david.sterling@auroraventures.io',
    customerPhone: '+1 (415) 890-4412',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    scheduledDate: '2026-11-03',
    startTime: '10:00',
    endTime: '10:45',
    durationMinutes: 45,
    actualStartTime: '10:02',
    chimeMeetingId: 'meet-chime-apex-9082',
    invitationUrl: 'https://crmnext.apexvaultbank.com/meet/mtg_001?auth=token_e891b29',
    attendees: [
      {
        id: 'att_1',
        name: 'Sarah Lin, CFA',
        email: 's.lin@apexvaultbank.com',
        role: 'organizer',
        avatar: 'SL',
        isSpeaking: true,
      },
      {
        id: 'att_2',
        name: 'David Sterling',
        email: 'david.sterling@auroraventures.io',
        role: 'customer',
        avatar: 'DS',
        isSpeaking: false,
      },
      {
        id: 'att_3',
        name: 'Marcus Vance',
        email: 'm.vance@apexvaultbank.com',
        role: 'attendee',
        avatar: 'MV',
        isMuted: true,
      },
      {
        id: 'att_4',
        name: 'Elena Rostova',
        email: 'e.rostova@apexvaultbank.com',
        role: 'compliance_auditor',
        avatar: 'ER',
        isVideoOff: true,
      },
    ],
    reminderPreferences: {
      email: true,
      sms: true,
      timeBeforeMinutes: 15,
    },
    hasRecording: true,
    hasTranscript: true,
    hasAiAnalysis: true,
    associatedTicketId: 'TCK-2024-88',
    notes: 'Client confirmed receipt of the preliminary disclosure statement. Escalated to underwriting for final signoff.',
    createdAt: '2026-10-30',
  },
  {
    id: 'mtg_002',
    internalReference: 'MTG-2026-8815',
    title: 'Nexus Biotech Treasury Yield Optimization Consultation',
    description: 'Quarterly review of liquid sweep deposits and short-term corporate paper allocation.',
    agenda: '1. Review current yield (4.85% vs benchmark)\n2. Propose automated sweep mechanism\n3. Set up dual-authorization limits',
    meetingType: 'video',
    status: 'scheduled',
    customerId: 'cust_sophia_chen',
    customerName: 'Sophia Chen',
    customerEmail: 'sophia.chen@nexusbiotech.com',
    customerPhone: '+1 (650) 412-8890',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    scheduledDate: '2026-11-04',
    startTime: '14:00',
    endTime: '14:30',
    durationMinutes: 30,
    chimeMeetingId: 'meet-chime-apex-9140',
    invitationUrl: 'https://crmnext.apexvaultbank.com/meet/mtg_002?auth=token_a92841f',
    attendees: [
      {
        id: 'att_21',
        name: 'Sarah Lin, CFA',
        email: 's.lin@apexvaultbank.com',
        role: 'organizer',
        avatar: 'SL',
      },
      {
        id: 'att_22',
        name: 'Sophia Chen',
        email: 'sophia.chen@nexusbiotech.com',
        role: 'customer',
        avatar: 'SC',
      },
    ],
    reminderPreferences: {
      email: true,
      sms: true,
      timeBeforeMinutes: 30,
    },
    associatedTicketId: 'TCK-2024-94',
    createdAt: '2026-11-01',
  },
  {
    id: 'mtg_003',
    internalReference: 'MTG-2026-8790',
    title: 'Tanaka Capital Cross-Border Currency Swap Risk Review',
    description: 'Strategic advisory session regarding Japanese Yen interest rate policy shift impact.',
    agenda: '1. Bank of Japan rate path assessment\n2. Swap collateral obligations\n3. Hedge restructuring alternatives',
    meetingType: 'audio',
    status: 'completed',
    customerId: 'cust_robert_tanaka',
    customerName: 'Robert Tanaka',
    customerEmail: 'r.tanaka@tanakacapital.jp',
    customerPhone: '+1 (212) 555-8910',
    rmId: 'rm_marcus_vance',
    rmName: 'Marcus Vance',
    scheduledDate: '2026-11-02',
    startTime: '11:00',
    endTime: '11:35',
    durationMinutes: 35,
    actualStartTime: '11:01',
    actualEndTime: '11:36',
    actualDurationSeconds: 2100,
    chimeMeetingId: 'meet-chime-apex-8790',
    invitationUrl: 'https://crmnext.apexvaultbank.com/meet/mtg_003?auth=token_b771092',
    attendees: [
      {
        id: 'att_31',
        name: 'Marcus Vance',
        email: 'm.vance@apexvaultbank.com',
        role: 'organizer',
        avatar: 'MV',
      },
      {
        id: 'att_32',
        name: 'Robert Tanaka',
        email: 'r.tanaka@tanakacapital.jp',
        role: 'customer',
        avatar: 'RT',
      },
    ],
    reminderPreferences: {
      email: true,
      sms: false,
      timeBeforeMinutes: 15,
    },
    hasRecording: true,
    hasTranscript: true,
    hasAiAnalysis: true,
    associatedTicketId: 'TCK-2024-65',
    createdAt: '2026-10-28',
  },
];

export const INITIAL_CALL_RECORDS: CallRecord[] = [
  {
    id: 'call_001',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    customerPhone: '+1 (415) 890-4412',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    direction: 'outbound',
    mode: 'in_app_audio',
    telephonyProvider: 'Amazon Chime SDK Meetings',
    status: 'completed',
    startTime: 'Today, 09:15 AM',
    durationSeconds: 742,
    associatedTicketId: 'TCK-2024-88',
    notes: 'Discussed rate lock timing ahead of video conference. Customer confirmed preference for 7-year fixed hedge.',
    followUpCreated: true,
  },
  {
    id: 'call_002',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    customerPhone: '+1 (415) 890-4412',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    direction: 'inbound',
    mode: 'pstn_telephony',
    telephonyProvider: 'Amazon Connect Customer',
    status: 'completed',
    startTime: 'Yesterday, 03:40 PM',
    durationSeconds: 418,
    associatedTicketId: 'TCK-2024-41',
    notes: 'Inbound PSTN call routed through Amazon Connect Voice Connector. Verified caller voice biometric identity and confirmed foreign exchange wire cutoff.',
    followUpCreated: false,
  },
  {
    id: 'call_003',
    customerId: 'cust_sophia_chen',
    customerName: 'Sophia Chen',
    customerPhone: '+1 (650) 412-8890',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    direction: 'outbound',
    mode: 'pstn_telephony',
    telephonyProvider: 'Amazon Connect Customer',
    status: 'completed',
    startTime: 'Nov 01, 2026 · 11:20 AM',
    durationSeconds: 520,
    associatedTicketId: 'TCK-2024-94',
    notes: 'Called CFO to confirm treasury sweep agreement parameters. Left callback instructions on secure line.',
    followUpCreated: true,
  },
  {
    id: 'call_004',
    customerId: 'cust_robert_tanaka',
    customerName: 'Robert Tanaka',
    customerPhone: '+1 (212) 555-8910',
    rmId: 'rm_marcus_vance',
    rmName: 'Marcus Vance',
    direction: 'inbound',
    mode: 'pstn_telephony',
    telephonyProvider: 'Amazon Connect Customer',
    status: 'missed',
    startTime: 'Oct 31, 2026 · 04:15 PM',
    durationSeconds: 0,
    associatedTicketId: 'TCK-2024-65',
    notes: 'Customer called after trading hours. Automated Amazon Connect IVR logged callback ticket.',
    followUpCreated: true,
  },
];

export const INITIAL_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 'fup_001',
    meetingId: 'mtg_001',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    title: 'Send Promissory Note for 5.15% Jumbo Refinance',
    description: 'Dispatch finalized DocuSign execution bundle for $1.8M loan with 5.15% 7-year rate lock before 5:00 PM EST.',
    dueDate: '2026-11-03',
    priority: 'High',
    status: 'In Progress',
    channel: 'DocuSign Document',
  },
  {
    id: 'fup_002',
    meetingId: 'mtg_001',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    rmId: 'rm_sarah_lin',
    rmName: 'Sarah Lin, CFA',
    title: 'Process €320k International Wire Clearance',
    description: 'Verify AML compliance ticket TCK-2024-41 with Elena Rostova and issue Fedwire authorization code.',
    dueDate: '2026-11-04',
    priority: 'High',
    status: 'Pending',
    channel: 'Email',
  },
  {
    id: 'fup_003',
    meetingId: 'mtg_003',
    customerId: 'cust_robert_tanaka',
    customerName: 'Robert Tanaka',
    rmId: 'rm_marcus_vance',
    rmName: 'Marcus Vance',
    title: 'Dispatch Currency Swap Sensitivity Matrix',
    description: 'Provide 100bps Yen yield curve shock model requested during currency swap consultation.',
    dueDate: '2026-11-05',
    priority: 'Medium',
    status: 'Completed',
    channel: 'Email',
    completedAt: '2026-11-02 14:30',
  },
];

export const INITIAL_RECORDINGS: MeetingRecordingItem[] = [
  {
    id: 'rec_001',
    meetingId: 'mtg_001',
    title: 'David Sterling - Jumbo Mortgage & Wire Consultation',
    customerId: 'cust_david_sterling',
    customerName: 'David Sterling',
    date: 'Nov 03, 2026 · 10:02 AM',
    durationFormatted: '28m 14s',
    durationSeconds: 1694,
    fileSizeBytes: 184500000,
    s3Uri: 's3://apexbank-chime-recordings/2026/11/mtg_001/composite_1080p.mp4',
    presignedUrl: 'https://s3.us-east-1.amazonaws.com/apexbank-chime-recordings/mtg_001/composite_1080p.mp4?X-Amz-Expires=900&X-Amz-Signature=e9b891',
    expiresInMinutes: 15,
    storageTier: 'S3 Standard',
    consentGiven: true,
    piiRedacted: true,
    transcriptionStatus: 'Complete',
  },
  {
    id: 'rec_002',
    meetingId: 'mtg_003',
    title: 'Tanaka Capital - Currency Swap Strategic Review',
    customerId: 'cust_robert_tanaka',
    customerName: 'Robert Tanaka',
    date: 'Nov 02, 2026 · 11:01 AM',
    durationFormatted: '35m 22s',
    durationSeconds: 2122,
    fileSizeBytes: 245000000,
    s3Uri: 's3://apexbank-chime-recordings/2026/11/mtg_003/audio_multi_channel.wav',
    presignedUrl: 'https://s3.us-east-1.amazonaws.com/apexbank-chime-recordings/mtg_003/audio_multi_channel.wav?X-Amz-Expires=900&X-Amz-Signature=c88210',
    expiresInMinutes: 15,
    storageTier: 'S3 Glacier Flexible',
    consentGiven: true,
    piiRedacted: true,
    transcriptionStatus: 'Complete',
  },
];

export const INITIAL_TRANSCRIPTS: Record<string, MeetingTranscriptEntry[]> = {
  mtg_001: [
    {
      id: 't_1',
      speaker: 'Sarah Lin, CFA',
      role: 'Senior Relationship Manager',
      text: 'Good morning David, thank you for joining our authenticated video meeting on ChimeVault. Can you hear and see my shared term sheet clearly?',
      timestamp: '00:05',
    },
    {
      id: 't_2',
      speaker: 'David Sterling',
      role: 'Managing Partner, Aurora Ventures',
      text: 'Good morning Sarah. Yes, crystal clear. I appreciate the swift turnaround on our jumbo mortgage refinance.',
      timestamp: '00:14',
    },
    {
      id: 't_3',
      speaker: 'Sarah Lin, CFA',
      role: 'Senior Relationship Manager',
      text: 'Our credit committee reviewed your liquidity reserves across Aurora Ventures and approved the 5.15% fixed rate lock for 7 years on CRMNEXT ticket #TCK-2024-88.',
      timestamp: '00:26',
    },
    {
      id: 't_4',
      speaker: 'David Sterling',
      role: 'Managing Partner, Aurora Ventures',
      text: 'That meets our cost-of-capital target nicely. Regarding the settlement deposit, should I wire it from account number 4920-1182-9901 or our holding entity account?',
      timestamp: '00:41',
      containsSensitivePII: true,
      redactedText: 'That meets our cost-of-capital target nicely. Regarding the settlement deposit, should I wire it from account number ••••-••••-9901 or our holding entity account?',
    },
    {
      id: 't_5',
      speaker: 'Elena Rostova',
      role: 'Chief Compliance Auditor',
      text: 'Compliance note: The customer account number was masked in real time pursuant to PCI-DSS Level 1. The official wiring instructions will be securely transmitted inside the portal.',
      timestamp: '00:58',
    },
    {
      id: 't_6',
      speaker: 'David Sterling',
      role: 'Managing Partner, Aurora Ventures',
      text: 'Understood. Also, regarding the separate €320,000 international transfer for our Munich vendor, can we ensure that clears today?',
      timestamp: '01:15',
    },
    {
      id: 't_7',
      speaker: 'Sarah Lin, CFA',
      role: 'Senior Relationship Manager',
      text: 'Yes David. Elena has pre-authorized the currency conversion at market mid-rate. I will dispatch the promissory note right after this call for your electronic signature.',
      timestamp: '01:30',
    },
  ],
};

export const INITIAL_AI_ANALYSIS: Record<string, MeetingAnalysisData> = {
  mtg_001: {
    meetingId: 'mtg_001',
    analyzedAt: 'Nov 03, 2026 · 10:48 AM',
    modelUsed: 'Amazon Bedrock (Claude 3.5 Sonnet)',
    executiveSummary: 'David Sterling met with Senior RM Sarah Lin and Compliance Auditor Elena Rostova to finalize the $1.8M commercial jumbo mortgage refinance. The borrower formally accepted the 5.15% fixed rate lock for 7 years and authorized a concurrent €320,000 international wire transfer.',
    detailedSummary: 'The consultation addressed three key priorities: first, title verification and appraisal for the commercial property was cleared with zero liens. Second, the borrower accepted the terms of CRMNEXT ticket TCK-2024-88 with an agreed 5.15% interest rate lock. Third, account details for settlement funding were validated with real-time DLP redaction. Sarah Lin committed to dispatching the promissory note via DocuSign by 5:00 PM EST.',
    importantPoints: [
      'Approved 5.15% 7-year fixed rate lock on $1,800,000 facility.',
      'International wire transfer of €320,000 cleared preliminary AML screening.',
      'Customer agreed to sign digital promissory note upon delivery today.',
      'Real-time PCI-DSS masking redacted account identifier 4920-1182-9901.',
    ],
    customerExpectations: [
      'Receipt of final DocuSign execution bundle before close of business.',
      'Same-day SWIFT execution for €320k Euro vendor settlement.',
      'Follow-up review of Q4 tax-loss harvesting recommendations with Marcus Vance.',
    ],
    customerIntent: {
      reasonForContact: 'Refinance high-interest commercial debt and secure certainty on commercial mortgage expense.',
      requirements: [
        'Fixed rate protection for minimum 5-7 years',
        'Expedited closing within 14 calendar days',
        'Integration with existing Aurora Ventures operating account',
      ],
      objections: [
        'Initially concerned regarding closing costs and prepayment lockouts; addressed through bank waiver credits.',
      ],
      unresolvedConcerns: [
        'None identified; borrower expressed complete satisfaction with terms.',
      ],
      productInterests: [
        'Commercial Jumbo Lending',
        'Foreign Exchange Forward Contracts',
        'Treasury Liquidity Sweeps',
      ],
    },
    sentiment: {
      overall: 'Positive',
      score: 92,
      progression: [
        { time: '00:00', score: 75 },
        { time: '05:00', score: 85 },
        { time: '15:00', score: 90 },
        { time: '25:00', score: 94 },
      ],
      dissatisfactionFlags: [],
    },
    actionItems: [
      {
        id: 'act_1',
        meetingId: 'mtg_001',
        task: 'Dispatch DocuSign Promissory Note & Rate Lock terms to David Sterling',
        assignedTo: 'Sarah Lin, CFA',
        responsiblePerson: 'Sarah Lin, CFA',
        deadline: 'Today, 5:00 PM EST',
        priority: 'High',
        status: 'Pending',
      },
      {
        id: 'act_2',
        meetingId: 'mtg_001',
        task: 'Execute SWIFT MT103 wire transfer (€320,000) to Munich vendor',
        assignedTo: 'Sarah Lin, CFA',
        responsiblePerson: 'Sarah Lin, CFA',
        deadline: 'Tomorrow, 11:00 AM EST',
        priority: 'High',
        status: 'Pending',
      },
      {
        id: 'act_3',
        meetingId: 'mtg_001',
        task: 'Review DocuSign agreement and return executed countersignature',
        assignedTo: 'David Sterling',
        responsiblePerson: 'David Sterling',
        deadline: 'Today, 7:00 PM EST',
        priority: 'High',
        status: 'Pending',
      },
    ],
    followUpEmail: {
      subject: 'Follow-Up & Executable Term Sheet: $1.8M Commercial Refinance (Rate Lock 5.15%)',
      greeting: 'Dear David,',
      body: 'Thank you for connecting with Elena and me on our secure Chime video conference earlier today. I am pleased to confirm that your 5.15% 7-year fixed rate lock on the $1.8M commercial facility has been officially locked with underwriting.',
      agreedNextSteps: [
        'Review and electronically sign the Promissory Note dispatched to your email.',
        'Deposit settlement funding via the encrypted wire portal instructions.',
        'Our compliance desk will initiate your €320k Euro vendor transfer concurrently.',
      ],
      requiredDocuments: [
        'Executed Promissory Note (DocuSign)',
        'Updated 2026 Insurance Declaration Binder',
      ],
      status: 'draft',
    },
    crmUpdateSuggestions: [
      {
        field: 'Preferred Lending Status',
        proposedValue: 'Rate-Locked (5.15% Fixed)',
        reason: 'Customer agreed to term sheet during video conference on Nov 03, 2026.',
        approved: false,
      },
      {
        field: 'Next Review Date',
        proposedValue: '2027-11-01',
        reason: 'Annual portfolio review scheduled 12 months from refinance execution.',
        approved: false,
      },
      {
        field: 'Cross-Sell Priority',
        proposedValue: 'FX Forward Hedging',
        reason: 'Client expressed recurring cross-border Euro vendor settlement requirements.',
        approved: false,
      },
    ],
    qualityAnalysis: {
      durationMinutes: 28,
      talkRatioRM: 46,
      talkRatioCustomer: 54,
      unansweredQuestions: [],
      qualityScore: 96,
      suggestedImprovements: [
        'Optimal collaborative dialogue balance (54% customer talk-time).',
        'Seamless compliance handover and DLP masking demonstrated zero regulatory friction.',
      ],
    },
  },
};

export const INITIAL_AWS_CONFIG: AwsConfig = {
  chimeRegion: 'us-east-1 (N. Virginia)',
  chimeMessagingArn: 'arn:aws:chime:us-east-1:123456789012:app-instance/apex-bank-crmnext-prod-01',
  mediaPipelinesS3Bucket: 's3://apexbank-chime-meeting-media-us-east-1',
  s3KmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mrk-98319fbc-banking-e2ee',
  amazonConnectInstanceArn: 'arn:aws:connect:us-east-1:123456789012:instance/apex-banking-contact-center',
  amazonConnectContactFlowId: '8910bc41-2291-49fa-9810-b98a01f928',
  amazonConnectSourcePhone: '+1 (800) 849-2041',
  bedrockModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  transcribeLanguage: 'en-US (Financial Custom Acoustic Vocabulary)',
  retentionYears: 7,
  isConnectProvisioned: true,
  isBedrockEnabled: true,
};

// Database state store
class DatabaseStore {
  private rms: RelationshipManager[] = [...INITIAL_RM_USERS];
  private customers: CustomerRecord[] = [...INITIAL_CUSTOMERS];
  private meetings: MeetingItem[] = [...INITIAL_MEETINGS];
  private calls: CallRecord[] = [...INITIAL_CALL_RECORDS];
  private followUps: FollowUpItem[] = [...INITIAL_FOLLOW_UPS];
  private recordings: MeetingRecordingItem[] = [...INITIAL_RECORDINGS];
  private transcripts: Record<string, MeetingTranscriptEntry[]> = { ...INITIAL_TRANSCRIPTS };
  private analyses: Record<string, MeetingAnalysisData> = { ...INITIAL_AI_ANALYSIS };
  private awsConfig: AwsConfig = { ...INITIAL_AWS_CONFIG };

  // Relationship Managers
  getRMs(): RelationshipManager[] {
    return this.rms;
  }

  getRMById(id: string): RelationshipManager | undefined {
    return this.rms.find((r) => r.id === id);
  }

  // Customers
  getCustomers(): CustomerRecord[] {
    return this.customers;
  }

  getCustomerById(id: string): CustomerRecord | undefined {
    return this.customers.find((c) => c.id === id);
  }

  updateCustomerNotes(customerId: string, notes: string): void {
    const cust = this.customers.find((c) => c.id === customerId);
    if (cust) {
      cust.notes = notes;
    }
  }

  // Meetings CRUD
  getMeetings(): MeetingItem[] {
    return this.meetings;
  }

  getMeetingById(id: string): MeetingItem | undefined {
    return this.meetings.find((m) => m.id === id);
  }

  checkSchedulingConflict(rmId: string, date: string, startTime: string, endTime: string, excludeMeetingId?: string): boolean {
    const existing = this.meetings.filter(
      (m) =>
        m.rmId === rmId &&
        m.scheduledDate === date &&
        m.status !== 'canceled' &&
        m.id !== excludeMeetingId
    );

    return existing.some((m) => {
      // Overlap condition
      return (
        (startTime >= m.startTime && startTime < m.endTime) ||
        (endTime > m.startTime && endTime <= m.endTime) ||
        (startTime <= m.startTime && endTime >= m.endTime)
      );
    });
  }

  createMeeting(meeting: Omit<MeetingItem, 'id' | 'internalReference' | 'invitationUrl' | 'createdAt'>): MeetingItem {
    const id = `mtg_${Date.now()}`;
    const internalReference = `MTG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const invitationUrl = `https://crmnext.apexvaultbank.com/meet/${id}?token=token_${Math.random().toString(36).substring(2, 9)}`;

    const newMeeting: MeetingItem = {
      ...meeting,
      id,
      internalReference,
      invitationUrl,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.meetings.unshift(newMeeting);
    return newMeeting;
  }

  updateMeeting(id: string, updates: Partial<MeetingItem>): MeetingItem | undefined {
    const index = this.meetings.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    this.meetings[index] = { ...this.meetings[index], ...updates };
    return this.meetings[index];
  }

  deleteMeeting(id: string): boolean {
    const initialLen = this.meetings.length;
    this.meetings = this.meetings.filter((m) => m.id !== id);
    return this.meetings.length < initialLen;
  }

  // Call Records
  getCalls(): CallRecord[] {
    return this.calls;
  }

  createCall(call: Omit<CallRecord, 'id'>): CallRecord {
    const newCall: CallRecord = {
      ...call,
      id: `call_${Date.now()}`,
    };
    this.calls.unshift(newCall);
    return newCall;
  }

  // Follow Ups
  getFollowUps(): FollowUpItem[] {
    return this.followUps;
  }

  createFollowUp(followUp: Omit<FollowUpItem, 'id'>): FollowUpItem {
    const newFup: FollowUpItem = {
      ...followUp,
      id: `fup_${Date.now()}`,
    };
    this.followUps.unshift(newFup);
    return newFup;
  }

  updateFollowUp(id: string, updates: Partial<FollowUpItem>): FollowUpItem | undefined {
    const idx = this.followUps.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    this.followUps[idx] = { ...this.followUps[idx], ...updates };
    return this.followUps[idx];
  }

  // Recordings
  getRecordings(): MeetingRecordingItem[] {
    return this.recordings;
  }

  getRecordingsByMeetingId(meetingId: string): MeetingRecordingItem[] {
    return this.recordings.filter((r) => r.meetingId === meetingId);
  }

  createRecording(rec: Omit<MeetingRecordingItem, 'id'>): MeetingRecordingItem {
    const newRec: MeetingRecordingItem = {
      ...rec,
      id: `rec_${Date.now()}`,
    };
    this.recordings.unshift(newRec);
    return newRec;
  }

  // Transcripts
  getTranscript(meetingId: string): MeetingTranscriptEntry[] {
    return this.transcripts[meetingId] || [];
  }

  addTranscriptEntry(meetingId: string, entry: Omit<MeetingTranscriptEntry, 'id'>): MeetingTranscriptEntry {
    if (!this.transcripts[meetingId]) {
      this.transcripts[meetingId] = [];
    }
    const newEntry: MeetingTranscriptEntry = {
      ...entry,
      id: `tr_${Date.now()}`,
    };
    this.transcripts[meetingId].push(newEntry);
    return newEntry;
  }

  // AI Analysis
  getAnalysis(meetingId: string): MeetingAnalysisData | undefined {
    return this.analyses[meetingId];
  }

  saveAnalysis(meetingId: string, analysis: MeetingAnalysisData): void {
    this.analyses[meetingId] = analysis;
    // Mark meeting as having analysis
    const meeting = this.getMeetingById(meetingId);
    if (meeting) {
      meeting.hasAiAnalysis = true;
    }
  }

  // Dashboard Metrics
  getDashboardMetrics(): DashboardMetrics {
    const totalMeetingsThisMonth = this.meetings.length;
    const upcomingMeetingsCount = this.meetings.filter(
      (m) => m.status === 'scheduled' || m.status === 'connecting'
    ).length;
    const completedMeetingsCount = this.meetings.filter((m) => m.status === 'completed').length;
    const missedMeetingsCount = this.meetings.filter(
      (m) => m.status === 'missed' || m.status === 'canceled'
    ).length;

    const totalCallDurationSeconds = this.calls.reduce((acc, c) => acc + c.durationSeconds, 0);
    const completedMeetings = this.meetings.filter((m) => m.actualDurationSeconds);
    const avgDurationSeconds =
      completedMeetings.length > 0
        ? completedMeetings.reduce((acc, m) => acc + (m.actualDurationSeconds || 0), 0) /
          completedMeetings.length
        : 1800;

    const pendingFollowUpsCount = this.followUps.filter((f) => f.status === 'Pending').length;

    return {
      totalMeetingsThisMonth,
      upcomingMeetingsCount,
      completedMeetingsCount,
      missedMeetingsCount,
      totalCallDurationMinutes: Math.round(totalCallDurationSeconds / 60),
      averageMeetingDurationMinutes: Math.round(avgDurationSeconds / 60),
      pendingFollowUpsCount,
      sentimentAverageScore: 92,
    };
  }

  // AWS Config
  getAwsConfig(): AwsConfig {
    return this.awsConfig;
  }

  updateAwsConfig(updates: Partial<AwsConfig>): AwsConfig {
    this.awsConfig = { ...this.awsConfig, ...updates };
    return this.awsConfig;
  }
}

export const db = new DatabaseStore();
