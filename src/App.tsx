/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MeetingNextHeader,
  MeetingNextPage,
} from './components/meetingnext/MeetingNextHeader';
import { HomePage } from './components/meetingnext/HomePage';
import { MyMeetingsPage } from './components/meetingnext/MyMeetingsPage';
import { ScheduleMeetingPage } from './components/meetingnext/ScheduleMeetingPage';
import { TelephonicCallPage } from './components/meetingnext/TelephonicCallPage';
import { SettingsPage } from './components/meetingnext/SettingsPage';
import { MeetingRoomModal } from './components/meetingnext/MeetingRoomModal';
import { PreJoinLobby } from './components/meetingnext/PreJoinLobby';
import { RescheduleModal } from './components/meetingnext/RescheduleModal';
import { LoginPage } from './components/meetingnext/LoginPage';

import { ScheduledMeeting, TelephonicCall, AuthUser } from './types/meetingnext';
import {
  INITIAL_UPCOMING_MEETINGS,
  INITIAL_PAST_MEETINGS,
  INITIAL_CALL_HISTORY,
} from './db/meetingNextStore';
import { meetingNextApi, setApiCurrentUser, onUnauthorized } from './services/meetingNextApi';
import { CheckCircle2, AlertCircle, Video, Users } from 'lucide-react';

export const SARTHAK_JAIN_HOST_USER: AuthUser = {
  id: 'rm_sarthak_jain',
  name: 'Sarthak Jain, CFA',
  email: 'sarthak.jain@businessnext.com',
  phone: '+91 9518833885',
  role: 'Senior Relationship Manager',
  department: 'Private Wealth Management & Lending',
  title: 'Senior Relationship Manager (CFA)',
  avatar: 'SJ',
  employeeId: 'CRMNEXT-EMP-9821',
  branchName: 'Mumbai Central Wealth & Lending Hub',
  token: 'session_sarthak_jain_cfa_jwt_token_2026',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<MeetingNextPage>('home');

  // Currently logged-in user: Defaults to Sarthak Jain, CFA for dashboard sessions
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(SARTHAK_JAIN_HOST_USER);

  // Core Data Collections synced with Backend
  const [upcomingMeetings, setUpcomingMeetings] = useState<ScheduledMeeting[]>(
    INITIAL_UPCOMING_MEETINGS
  );
  const [pastMeetings, setPastMeetings] = useState<ScheduledMeeting[]>(
    INITIAL_PAST_MEETINGS
  );
  const [callHistory, setCallHistory] = useState<TelephonicCall[]>(
    INITIAL_CALL_HISTORY
  );

  // Active Live Video Room
  const [activeMeetingRoom, setActiveMeetingRoom] = useState<ScheduledMeeting | null>(null);

  // Guest Join State for Link Visitors
  const [guestJoinProfile, setGuestJoinProfile] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isGuestJoining, setIsGuestJoining] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [isDirectGuestRoute, setIsDirectGuestRoute] = useState(false);

  // Reschedule Target Modal
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledMeeting | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Keep Axios Request Interceptor synchronized with the React currentUser state
  useEffect(() => {
    setApiCurrentUser(currentUser);
  }, [currentUser]);

  // Setup Global Error Handler to redirect user to login if a 401 response is received
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setCurrentUser(null);
      setApiCurrentUser(null);
      showToast('Session expired or unauthorized. Please sign in again.');
    });

    const handleWindowUnauthorized = () => {
      setCurrentUser(null);
      setApiCurrentUser(null);
      showToast('Session expired or unauthorized. Please sign in again.');
    };

    window.addEventListener('meetingnext:unauthorized', handleWindowUnauthorized);

    // Initial load sync
    refreshBackendData();

    return () => {
      unsubscribe();
      window.removeEventListener('meetingnext:unauthorized', handleWindowUnauthorized);
    };
  }, []);

  // Detect direct room URL access e.g. /room/mtg-chime-7165 or ?room=mtg-chime-7165
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlForMeetingRoom = () => {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      let targetRoomId: string | null = searchParams.get('room') || searchParams.get('meeting');

      if (!targetRoomId && pathname.startsWith('/room/')) {
        targetRoomId = pathname.substring(6).replace(/\/$/, '');
      } else if (!targetRoomId && pathname.startsWith('/meeting/')) {
        targetRoomId = pathname.substring(9).replace(/\/$/, '');
      }

      if (targetRoomId) {
        setIsDirectGuestRoute(true);
        // Find existing scheduled meeting
        const existing =
          upcomingMeetings.find((m) => m.id === targetRoomId || m.meetingLink.includes(targetRoomId!)) ||
          pastMeetings.find((m) => m.id === targetRoomId || m.meetingLink.includes(targetRoomId!));

        if (existing) {
          setActiveMeetingRoom(existing);
          setGuestNameInput(existing.customerName || '');
        } else {
          // Construct live attendee meeting session for direct room URL
          const directMeeting: ScheduledMeeting = {
            id: targetRoomId,
            customerName: 'Customer Attendee',
            customerNumber: '+1 (415) 890-4412',
            customerEmail: 'customer@client.com',
            reason: 'Banking Video Consultation',
            date: 'Today',
            time: 'Now',
            durationMinutes: 30,
            meetingLink: window.location.href,
            status: 'upcoming',
            sentViaMessage: true,
            sentViaGmail: true,
          };
          setActiveMeetingRoom(directMeeting);
          setGuestNameInput('');
        }
      }
    };

    checkUrlForMeetingRoom();
    window.addEventListener('popstate', checkUrlForMeetingRoom);
    return () => window.removeEventListener('popstate', checkUrlForMeetingRoom);
  }, [upcomingMeetings, pastMeetings]);

  // Sync data with backend on load
  const refreshBackendData = async () => {
    try {
      const [mtgs, calls, authRes] = await Promise.all([
        meetingNextApi.getMeetings(),
        meetingNextApi.getCalls(),
        meetingNextApi.getAuthMe().catch(() => null),
      ]);
      if (mtgs && mtgs.upcoming) {
        setUpcomingMeetings(mtgs.upcoming);
      }
      if (mtgs && mtgs.past) {
        setPastMeetings(mtgs.past);
      }
      if (calls && Array.isArray(calls)) {
        setCallHistory(calls);
      }
      if (authRes && authRes.authenticated && authRes.user) {
        setCurrentUser(authRes.user);
        setApiCurrentUser(authRes.user);
      }
    } catch (e) {
      console.warn('Initial backend sync error (using local data):', e);
    }
  };

  const handleLogout = async () => {
    await meetingNextApi.logout();
    setCurrentUser(null);
    setApiCurrentUser(null);
    showToast('Signed out of MeetingNext session.');
  };

  // Handlers
  const handleJoinMeeting = (meeting: ScheduledMeeting) => {
    setIsDirectGuestRoute(false);
    setIsGuestJoining(true);
    setGuestJoinProfile(currentUser || SARTHAK_JAIN_HOST_USER);
    setActiveMeetingRoom(meeting);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/room/${meeting.id}`);
    }
  };

  const handleLeaveMeetingRoom = () => {
    setActiveMeetingRoom(null);
    setIsGuestJoining(false);
    setIsDirectGuestRoute(false);
    setGuestJoinProfile(null);
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/room/') || window.location.search.includes('room='))) {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleOpenReschedule = (meeting: ScheduledMeeting) => {
    setRescheduleTarget(meeting);
  };

  const handleConfirmReschedule = async (
    meetingId: string,
    updates: {
      customerName: string;
      customerNumber: string;
      customerEmail: string;
      newDate: string;
      newTime: string;
      newReason: string;
      durationMinutes: number;
    }
  ) => {
    try {
      // 1. Send update to Backend API
      const res = await meetingNextApi.updateMeeting(meetingId, {
        customerName: updates.customerName,
        customerNumber: updates.customerNumber,
        customerEmail: updates.customerEmail,
        date: updates.newDate,
        time: updates.newTime,
        reason: updates.newReason,
        durationMinutes: updates.durationMinutes,
      });

      // 2. Refresh lists
      await refreshBackendData();
      showToast(
        `Meeting rescheduled & details updated for ${updates.customerName}. Refreshed SMS & Gmail dispatched!`
      );
    } catch (err) {
      console.warn('Backend update note:', err);
      // Fallback local update
      setUpcomingMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                customerName: updates.customerName,
                customerNumber: updates.customerNumber,
                customerEmail: updates.customerEmail,
                date: updates.newDate,
                time: updates.newTime,
                reason: updates.newReason,
                durationMinutes: updates.durationMinutes,
              }
            : m
        )
      );
      showToast('Meeting updated in schedule!');
    }
  };

  const handleScheduleNewMeeting = async (newMeeting: ScheduledMeeting) => {
    setUpcomingMeetings((prev) => [newMeeting, ...prev]);
    showToast(`New meeting scheduled for ${newMeeting.customerName}! Link dispatched to customer.`);
    await refreshBackendData();
  };

  const handleLogNewCall = async (newCall: TelephonicCall) => {
    setCallHistory((prev) => [newCall, ...prev]);
    showToast(`Call logged with ${newCall.customerName} (${newCall.duration})`);
    await refreshBackendData();
  };

  const handleCompleteActiveMeeting = async (meetingId: string) => {
    try {
      await meetingNextApi.completeMeeting(meetingId);
      await refreshBackendData();
      showToast('Meeting completed. AI transcription & insights generated!');
    } catch (e) {
      console.warn('completeMeeting fallback note:', e);
      // Local fallback
      const found = upcomingMeetings.find((m) => m.id === meetingId);
      if (found) {
        setUpcomingMeetings((prev) => prev.filter((m) => m.id !== meetingId));
        setPastMeetings((prev) => [
          { ...found, status: 'completed', actualDuration: '28 mins' },
          ...prev,
        ]);
      }
    }
  };

  // Direct access for participants joining via a meeting link (e.g. from SMS, Gmail, or shared URL)
  if (activeMeetingRoom && (!currentUser || isDirectGuestRoute)) {
    if (!isGuestJoining) {
      return (
        <PreJoinLobby
          meeting={activeMeetingRoom}
          onJoinAsAttendee={(displayName) => {
            const guestSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) || 'guest';
            const guestId = `att_${guestSlug}_${Math.random().toString(36).substring(2, 7)}`;
            const guestUser: AuthUser = {
              id: guestId,
              name: displayName,
              role: 'Attendee',
              email: `${guestSlug}@guest.client`,
              phone: '+1 (555) 000-0000',
              department: 'Client Attendee',
              title: 'Customer Attendee',
              avatar: displayName.slice(0, 2).toUpperCase(),
            };
            setGuestJoinProfile(guestUser);
            setIsGuestJoining(true);
          }}
          onJoinAsHost={() => {
            setCurrentUser(SARTHAK_JAIN_HOST_USER);
            setApiCurrentUser(SARTHAK_JAIN_HOST_USER);
            setGuestJoinProfile(SARTHAK_JAIN_HOST_USER);
            setIsDirectGuestRoute(false);
            setIsGuestJoining(true);
          }}
        />
      );
    }

    return (
      <MeetingRoomModal
        meeting={activeMeetingRoom}
        isOpen={true}
        currentUser={guestJoinProfile}
        onLeaveMeeting={handleLeaveMeetingRoom}
        onCompleteMeeting={handleCompleteActiveMeeting}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={async (user) => {
          setCurrentUser(user);
          setApiCurrentUser(user);
          showToast(`Welcome back, ${user.name}`);
          await refreshBackendData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans transition-colors antialiased selection:bg-rose-100 selection:text-rose-900">
      {/* 
        Single Logo "MeetingNext" Header with 5 Pages:
        Home, My Meetings, Schedule meeting, Telephonic call, Settings 
      */}
      <MeetingNextHeader
        activePage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Floating Global Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs max-w-md animate-in slide-in-from-top-4 duration-200 border border-slate-800">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Pages Container */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {currentPage === 'home' && (
          <HomePage
            upcomingMeetings={upcomingMeetings}
            onJoinMeeting={handleJoinMeeting}
            onOpenReschedule={handleOpenReschedule}
            onNavigateToSchedule={() => setCurrentPage('schedule')}
            onNavigateToMeetings={() => setCurrentPage('my_meetings')}
          />
        )}

        {currentPage === 'my_meetings' && (
          <MyMeetingsPage
            upcomingMeetings={upcomingMeetings}
            pastMeetings={pastMeetings}
            onJoinMeeting={handleJoinMeeting}
            onOpenReschedule={handleOpenReschedule}
          />
        )}

        {currentPage === 'schedule' && (
          <ScheduleMeetingPage
            onMeetingScheduled={handleScheduleNewMeeting}
            onNavigateToMeetings={() => setCurrentPage('my_meetings')}
            onJoinMeeting={handleJoinMeeting}
          />
        )}

        {currentPage === 'telephonic' && (
          <TelephonicCallPage
            callHistory={callHistory}
            onLogNewCall={handleLogNewCall}
          />
        )}

        {currentPage === 'settings' && <SettingsPage />}
      </main>

      {/* Reschedule & Details Updation Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          meeting={rescheduleTarget}
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onConfirmReschedule={handleConfirmReschedule}
        />
      )}

      {/* Live Video Meeting Room Modal (Chime WebRTC) */}
      {activeMeetingRoom && (
        <MeetingRoomModal
          meeting={activeMeetingRoom}
          isOpen={!!activeMeetingRoom}
          currentUser={guestJoinProfile || currentUser}
          onLeaveMeeting={handleLeaveMeetingRoom}
          onCompleteMeeting={handleCompleteActiveMeeting}
        />
      )}
    </div>
  );
}
