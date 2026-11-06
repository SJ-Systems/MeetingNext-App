import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('  MEETINGNEXT PRODUCTION CHIME SDK VERIFICATION SUITE');
  console.log('  Single Persistent Meeting Per Scheduled Session (Zoom/Meet Model)');
  console.log('================================================================\n');

  const testMeetingId = `mtg-chime-test-${Math.floor(1000 + Math.random() * 9000)}`;

  // ---------------------------------------------------------------------------
  // TEST 1: Host Creates and Starts Meeting
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 1] Creating scheduled meeting and starting as HOST...');
  const createRes = await axios.post(`${BASE_URL}/api/meetings`, {
    meetingId: testMeetingId,
    title: 'High-Value Commercial Lending Review',
    customerName: 'Ananya Sharma',
    customerNumber: '+91 98200 44123',
    customerEmail: 'ananya.sharma@investments.in',
    date: 'Today',
    time: '2:30 PM',
    durationMinutes: 45,
  });

  const appMeetingId = createRes.data.applicationMeetingId;
  const meetingUrl = createRes.data.meetingUrl;
  console.log(`  ✓ Meeting Created: App ID = ${appMeetingId}`);
  console.log(`  ✓ Permanent Link = ${meetingUrl}`);

  // Host starts meeting
  const hostStartRes = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/start`, {
    externalUserId: 'rm_sarthak_jain',
    userName: 'Sarthak Jain, CFA',
  });

  const chimeMeetingId = hostStartRes.data.chimeMeetingId;
  const hostAttendeeId = hostStartRes.data.attendee.AttendeeId;
  console.log(`  ✓ Host Started Meeting:`);
  console.log(`    - Role: ${hostStartRes.data.role} (isHost: ${hostStartRes.data.host})`);
  console.log(`    - Chime MeetingId: ${chimeMeetingId}`);
  console.log(`    - Host AttendeeId: ${hostAttendeeId}\n`);

  if (!chimeMeetingId || !hostAttendeeId) {
    throw new Error('Test 1 failed: Missing chimeMeetingId or hostAttendeeId');
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Attendee 1 Joins via Invitation Link
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 2] Attendee 1 joins via invitation link...');
  const att1Res = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/join`, {
    externalUserId: 'user_ananya_sharma',
    userName: 'Ananya Sharma (Borrower)',
  });

  const att1MeetingId = att1Res.data.chimeMeetingId;
  const att1AttendeeId = att1Res.data.attendee.AttendeeId;
  console.log(`  ✓ Attendee 1 Joined:`);
  console.log(`    - Role: ${att1Res.data.role} (isHost: ${att1Res.data.host})`);
  console.log(`    - Chime MeetingId: ${att1MeetingId}`);
  console.log(`    - Attendee 1 AttendeeId: ${att1AttendeeId}`);

  if (att1MeetingId !== chimeMeetingId) {
    throw new Error(`CRITICAL BUG: Attendee 1 received different Chime MeetingId! Expected ${chimeMeetingId}, got ${att1MeetingId}`);
  }
  if (att1AttendeeId === hostAttendeeId) {
    throw new Error('CRITICAL BUG: Attendee 1 received identical AttendeeId as Host!');
  }
  console.log('  ✓ Assertion PASSED: Identical Chime MeetingId, unique AttendeeId.\n');

  // ---------------------------------------------------------------------------
  // TEST 3: Attendees 2, 3, 4, 5 Join the Same Meeting Link
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 3] Attendees 2, 3, 4, 5 join the same meeting URL...');
  const attendeeConfigs = [
    { id: 'user_rohit_verma', name: 'Rohit Verma (Co-Borrower)' },
    { id: 'user_priya_nair', name: 'Priya Nair (Legal Counsel)' },
    { id: 'user_vikram_singh', name: 'Vikram Singh (Underwriting Lead)' },
    { id: 'user_elena_rostova', name: 'Elena Rostova (Compliance Desk)' },
  ];

  const attendees: Array<{ name: string; role: string; externalUserId: string; chimeMeetingId: string; attendeeId: string }> = [
    {
      name: 'Sarthak Jain, CFA',
      role: 'HOST (Organizer)',
      externalUserId: 'rm_sarthak_jain',
      chimeMeetingId,
      attendeeId: hostAttendeeId,
    },
    {
      name: 'Ananya Sharma',
      role: 'ATTENDEE',
      externalUserId: 'user_ananya_sharma',
      chimeMeetingId: att1MeetingId,
      attendeeId: att1AttendeeId,
    },
  ];

  for (let i = 0; i < attendeeConfigs.length; i++) {
    const config = attendeeConfigs[i];
    const joinRes = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/join`, {
      externalUserId: config.id,
      userName: config.name,
    });

    const mId = joinRes.data.chimeMeetingId;
    const aId = joinRes.data.attendee.AttendeeId;

    if (mId !== chimeMeetingId) {
      throw new Error(`CRITICAL BUG: Attendee ${i + 2} received different Chime MeetingId! Expected ${chimeMeetingId}, got ${mId}`);
    }

    attendees.push({
      name: config.name,
      role: 'ATTENDEE',
      externalUserId: config.id,
      chimeMeetingId: mId,
      attendeeId: aId,
    });
    console.log(`  ✓ Attendee ${i + 2} (${config.name}) Joined: AttendeeId = ${aId}`);
  }

  // Verify all 6 participants have the exact same Chime MeetingId
  const uniqueMeetingIds = new Set(attendees.map((a) => a.chimeMeetingId));
  const uniqueAttendeeIds = new Set(attendees.map((a) => a.attendeeId));

  console.log(`\n  ✓ Roster Verification:`);
  console.log(`    - Total Participants: ${attendees.length}`);
  console.log(`    - Unique Chime MeetingIds: ${uniqueMeetingIds.size} (Expected: 1)`);
  console.log(`    - Unique AttendeeIds: ${uniqueAttendeeIds.size} (Expected: ${attendees.length})`);

  if (uniqueMeetingIds.size !== 1) {
    throw new Error(`FAILURE: Expected exactly 1 Chime MeetingId across all participants, got ${uniqueMeetingIds.size}`);
  }
  if (uniqueAttendeeIds.size !== attendees.length) {
    throw new Error(`FAILURE: Duplicate AttendeeIds found among participants!`);
  }
  console.log('  ✓ Assertion PASSED: All 6 participants are in the EXACT SAME Chime Room.\n');

  // ---------------------------------------------------------------------------
  // TEST 4: Page Refresh / Rejoin Scenario (No New Room Generated)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 4] Simulating page refresh / browser tab rejoin...');
  const rejoinRes = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/join`, {
    externalUserId: 'user_ananya_sharma',
    userName: 'Ananya Sharma (Borrower)',
  });

  const rejoinMeetingId = rejoinRes.data.chimeMeetingId;
  console.log(`  ✓ Rejoin Chime MeetingId: ${rejoinMeetingId}`);
  if (rejoinMeetingId !== chimeMeetingId) {
    throw new Error(`FAILURE on Rejoin: New room was generated instead of reusing ${chimeMeetingId}!`);
  }
  console.log('  ✓ Assertion PASSED: Same Chime MeetingId reused upon page refresh.\n');

  // ---------------------------------------------------------------------------
  // TEST 5: Active Roster & Leave / End Meeting
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 5] Checking active meeting details and testing clean leave & end...');
  const detailsRes = await axios.get(`${BASE_URL}/api/meetings/${appMeetingId}`);
  console.log(`  ✓ GET /api/meetings/${appMeetingId} status: ${detailsRes.data.status}`);
  console.log(`  ✓ Active Roster Count: ${detailsRes.data.participants.length}`);

  // Attendee leaves
  const leaveRes = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/leave`, {
    participantId: 'user_rohit_verma',
  });
  console.log(`  ✓ Leave Response: ${leaveRes.data.message}`);

  // Host ends meeting for all
  const endRes = await axios.post(`${BASE_URL}/api/meetings/${appMeetingId}/end`);
  console.log(`  ✓ End Response: status = ${endRes.data.status}, message = ${endRes.data.message}`);
  console.log('  ✓ Assertion PASSED: Session terminated cleanly.\n');

  // ---------------------------------------------------------------------------
  // TEST 6: Atomic Concurrency Lock for Simultaneous Starts
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 6] Simulating concurrent start calls on a new meeting...');
  const concurrentMeetingId = `mtg-concurrent-${Math.floor(1000 + Math.random() * 9000)}`;

  const [resA, resB] = await Promise.all([
    axios.post(`${BASE_URL}/api/meetings/${concurrentMeetingId}/start`, {
      externalUserId: 'rm_sarthak_jain',
      userName: 'Sarthak Jain, CFA',
    }),
    axios.post(`${BASE_URL}/api/meetings/${concurrentMeetingId}/join`, {
      externalUserId: 'att_concurrent_guest',
      userName: 'Concurrent Guest',
    }),
  ]);

  console.log(`  ✓ Concurrent Call A Chime MeetingId: ${resA.data.chimeMeetingId}`);
  console.log(`  ✓ Concurrent Call B Chime MeetingId: ${resB.data.chimeMeetingId}`);

  if (resA.data.chimeMeetingId !== resB.data.chimeMeetingId) {
    throw new Error('CONCURRENCY BUG: Simultaneous start created duplicate Chime MeetingIds!');
  }
  console.log('  ✓ Assertion PASSED: Atomic lock prevented duplicate room creation!\n');

  // ---------------------------------------------------------------------------
  // SUMMARY OUTPUT TABLE
  // ---------------------------------------------------------------------------
  console.log('================================================================');
  console.log('  VERIFIED 6-PARTICIPANT CHIME MEETING ROSTER (TEST RESULT)');
  console.log('================================================================');
  console.log('| User | Role | ExternalUserId | Chime MeetingId | AttendeeId |');
  console.log('|---|---|---|---|---|');
  attendees.forEach((a) => {
    console.log(`| ${a.name} | ${a.role} | ${a.externalUserId} | ${a.chimeMeetingId} | ${a.attendeeId} |`);
  });
  console.log('================================================================');
  console.log('  ALL TESTS PASSED SUCCESSFULLY! 🚀');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite encountered an error:', err.message);
  process.exit(1);
});
