import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Video,
  PhoneCall,
  BarChart2,
  Radio,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { OverviewView } from './OverviewView';
import { MyMeetingsView } from './MyMeetingsView';
import { VideoMeetingView } from './VideoMeetingView';
import { CallHistoryView } from './CallHistoryView';
import { MeetingInsightsView } from './MeetingInsightsView';
import { RecordingsView } from './RecordingsView';
import { AwsSettingsView } from './AwsSettingsView';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { DirectAudioCallModal } from './DirectAudioCallModal';
import { AiMeetingAnalysisModal } from './AiMeetingAnalysisModal';

import {
  DashboardMetrics,
  MeetingItem,
  CallRecord,
  FollowUpItem,
  MeetingRecordingItem,
  CustomerRecord,
  RelationshipManager,
  AwsConfig,
  MeetingAnalysisData
} from '../../types/crm';
import { api } from '../../services/api';

export type CommHubSubTab =
  | 'overview'
  | 'my_meetings'
  | 'schedule'
  | 'video_meetings'
  | 'call_history'
  | 'insights'
  | 'recordings'
  | 'settings';

interface CommunicationHubProps {
  currentRM: RelationshipManager;
  allRMs: RelationshipManager[];
  customers: CustomerRecord[];
  meetings: MeetingItem[];
  calls: CallRecord[];
  followUps: FollowUpItem[];
  recordings: MeetingRecordingItem[];
  metrics: DashboardMetrics;
  awsConfig: AwsConfig;
  onRefreshData: () => void;
  onSelectCustomerById: (customerId: string) => void;
  initialSubTab?: CommHubSubTab;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  currentRM,
  allRMs,
  customers,
  meetings,
  calls,
  followUps,
  recordings,
  metrics,
  awsConfig,
  onRefreshData,
  onSelectCustomerById,
  initialSubTab = 'overview',
}) => {
  const [subTab, setSubTab] = useState<CommHubSubTab>(initialSubTab);

  // Active meeting for VideoMeetingView
  const [activeMeeting, setActiveMeeting] = useState<MeetingItem | null>(
    meetings.find((m) => m.status === 'in_progress') || meetings[0] || null
  );

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [preSelectedCustForSchedule, setPreSelectedCustForSchedule] = useState<CustomerRecord | null>(null);

  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [activeCallCustomer, setActiveCallCustomer] = useState<CustomerRecord>(customers[0]);

  const [showAiModal, setShowAiModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<MeetingAnalysisData | null>(null);

  // Nav items for Section 2:
  // Overview, My Meetings, Schedule Meeting, Video Meetings, Call History, Meeting Insights, Recordings & Transcripts, Settings
  const navItems: { id: CommHubSubTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'my_meetings', label: 'My Meetings', icon: Calendar },
    { id: 'schedule', label: 'Schedule Meeting', icon: PlusCircle },
    { id: 'video_meetings', label: 'Video Meetings', icon: Video },
    { id: 'call_history', label: 'Call History', icon: PhoneCall },
    { id: 'insights', label: 'Meeting Insights', icon: BarChart2 },
    { id: 'recordings', label: 'Recordings & Transcripts', icon: Radio },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleJoinMeeting = (m: MeetingItem) => {
    setActiveMeeting(m);
    setSubTab('video_meetings');
  };

  const handleOpenAiAnalysis = async (meetingId: string) => {
    try {
      const data = await api.getAnalysis(meetingId);
      if (data) {
        setCurrentAnalysis(data);
        setShowAiModal(true);
      } else {
        const generated = await api.triggerAnalysis(meetingId);
        setCurrentAnalysis(generated);
        setShowAiModal(true);
      }
    } catch {
      const generated = await api.triggerAnalysis(meetingId);
      setCurrentAnalysis(generated);
      setShowAiModal(true);
    }
  };

  const handleOpenDirectCall = (cust: CustomerRecord) => {
    setActiveCallCustomer(cust);
    setShowAudioCallModal(true);
  };

  const handleScheduleForCustomer = (cust?: CustomerRecord) => {
    if (cust) {
      setPreSelectedCustForSchedule(cust);
    } else {
      setPreSelectedCustForSchedule(null);
    }
    setShowScheduleModal(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sub-Navigation Bar for Communication Hub */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'schedule') {
                  setShowScheduleModal(true);
                } else {
                  setSubTab(item.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {subTab === 'overview' && (
          <OverviewView
            metrics={metrics}
            meetings={meetings}
            calls={calls}
            followUps={followUps}
            onJoinMeeting={handleJoinMeeting}
            onScheduleMeeting={() => handleScheduleForCustomer()}
            onSelectCustomerById={onSelectCustomerById}
            onViewAiAnalysis={handleOpenAiAnalysis}
            onRescheduleMeeting={(m) => handleScheduleForCustomer()}
            onCancelMeeting={(m) => {
              api.deleteMeeting(m.id);
              onRefreshData();
            }}
          />
        )}

        {subTab === 'my_meetings' && (
          <MyMeetingsView
            meetings={meetings}
            customers={customers}
            allRMs={allRMs}
            onJoinMeeting={handleJoinMeeting}
            onScheduleMeeting={() => handleScheduleForCustomer()}
            onViewAiAnalysis={handleOpenAiAnalysis}
            onRescheduleMeeting={(m) => handleScheduleForCustomer()}
            onCancelMeeting={(m) => {
              api.deleteMeeting(m.id);
              onRefreshData();
            }}
            onSelectCustomerById={onSelectCustomerById}
          />
        )}

        {subTab === 'video_meetings' && activeMeeting && (
          <VideoMeetingView
            meeting={activeMeeting}
            customer={customers.find((c) => c.id === activeMeeting.customerId)}
            currentRM={currentRM}
            onLeaveMeeting={() => setSubTab('overview')}
            onEndMeeting={(id, duration) => {
              api.endMeeting(id, duration);
              onRefreshData();
              handleOpenAiAnalysis(id);
            }}
            onViewAiAnalysis={handleOpenAiAnalysis}
          />
        )}

        {subTab === 'call_history' && (
          <CallHistoryView
            calls={calls}
            customers={customers}
            onSelectCustomerById={onSelectCustomerById}
            onRedialCall={(phone, name) => {
              const matched = customers.find((c) => c.mobile === phone) || customers[0];
              handleOpenDirectCall(matched);
            }}
          />
        )}

        {subTab === 'insights' && (
          <MeetingInsightsView
            meetings={meetings}
            calls={calls}
            allRMs={allRMs}
            customers={customers}
          />
        )}

        {subTab === 'recordings' && (
          <RecordingsView
            recordings={recordings}
            onSelectCustomerById={onSelectCustomerById}
          />
        )}

        {subTab === 'settings' && (
          <AwsSettingsView
            config={awsConfig}
            onUpdateConfig={() => onRefreshData()}
          />
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <ScheduleMeetingModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          customers={customers}
          allRMs={allRMs}
          currentRM={currentRM}
          preSelectedCustomer={preSelectedCustForSchedule}
          onMeetingScheduled={(newMtg) => {
            onRefreshData();
            handleJoinMeeting(newMtg);
          }}
        />
      )}

      {/* Direct Audio Call Modal */}
      {showAudioCallModal && (
        <DirectAudioCallModal
          isOpen={showAudioCallModal}
          onClose={() => setShowAudioCallModal(false)}
          customer={activeCallCustomer}
          currentRM={currentRM}
          onCallLogged={() => onRefreshData()}
        />
      )}

      {/* AI Meeting Analysis Modal */}
      {showAiModal && currentAnalysis && (
        <AiMeetingAnalysisModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          analysis={currentAnalysis}
          onApplyCrmUpdates={(updates) => {
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
