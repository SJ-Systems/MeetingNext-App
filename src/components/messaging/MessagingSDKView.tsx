import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Search,
  Send,
  Paperclip,
  Video,
  Phone,
  FileCheck,
  CheckCheck,
  ShieldCheck,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import { ChatChannel, ChannelMessage, UserProfile } from '../../types';
import { redactFinancialPII } from '../../utils/speechRecognition';

interface MessagingSDKViewProps {
  currentUser: UserProfile;
  channels: ChatChannel[];
  channelMessages: Record<string, ChannelMessage[]>;
  onSendMessage: (channelId: string, text: string, attachmentName?: string) => void;
  onLaunchMeetingFromChat: (participantName?: string) => void;
  onLaunchVoiceFromChat: (phoneNumber?: string) => void;
}

export const MessagingSDKView: React.FC<MessagingSDKViewProps> = ({
  currentUser,
  channels,
  channelMessages,
  onSendMessage,
  onLaunchMeetingFromChat,
  onLaunchVoiceFromChat,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'ch_wealth_strategy');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [piiAlert, setPiiAlert] = useState<string | null>(null);

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const messages = channelMessages[selectedChannelId] || [];

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const { sanitized, hasPII } = redactFinancialPII(inputText);

    if (hasPII) {
      setPiiAlert('Sensitive financial digits (credit card / SSN) detected and automatically masked for PCI-DSS compliance.');
      setTimeout(() => setPiiAlert(null), 4000);
    }

    onSendMessage(selectedChannelId, sanitized);
    setInputText('');
  };

  const handleQuickAttach = () => {
    const docNames = [
      'Mortgage_PreApproval_Letter_Apex.pdf',
      'Accredited_Investor_Verification.pdf',
      'Escrow_Settlement_Schedule.xlsx',
    ];
    const picked = docNames[Math.floor(Math.random() * docNames.length)];
    onSendMessage(selectedChannelId, `Shared verified banking document: ${picked}`, picked);
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar: Channel & DM Navigation */}
      <div className="w-72 lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Channel Search & AppInstance Info */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              Amazon Chime Messaging
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
              AWS KMS E2EE
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations & files..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Department Channels */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Department Channels</span>
              <span className="text-[10px] text-slate-500">Chime SDK</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {filteredChannels
                .filter((c) => c.category === 'channel')
                .map((ch) => {
                  const isSelected = ch.id === selectedChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannelId(ch.id)}
                      className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {ch.unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                          {ch.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Direct Client & RM Conversations */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Direct Client Chats</span>
              <span className="text-[10px] text-slate-500">1-on-1 CRM</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {filteredChannels
                .filter((c) => c.category === 'direct')
                .map((dm) => {
                  const isSelected = dm.id === selectedChannelId;
                  return (
                    <button
                      key={dm.id}
                      onClick={() => setSelectedChannelId(dm.id)}
                      className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="relative shrink-0">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-200">
                            {dm.participantName?.[0] || 'C'}
                          </div>
                          {dm.participantOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
                          )}
                        </div>
                        <span className="truncate">{dm.participantName || dm.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dm.lastMessageTime}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Identity Token Stamp */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Identity: {currentUser.name.split(',')[0]}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            {currentUser.appInstanceUserArn.split('/').slice(-2).join('/')}
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {activeChannel.category === 'channel' ? `#${activeChannel.name}` : activeChannel.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 border-l border-slate-700 pl-2">
                {activeChannel.description}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Amazon Chime AppInstanceChannel · End-to-End Encrypted</span>
            </div>
          </div>

          {/* Quick Real-Time Action Triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLaunchMeetingFromChat(activeChannel.participantName || activeChannel.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
              title="Escalate chat to secure Chime video call"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Start Video Call</span>
            </button>

            <button
              onClick={() => onLaunchVoiceFromChat('+1 (415) 890-4412')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
              title="Launch SIP Telephone Dialer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">PSTN Call</span>
            </button>
          </div>
        </div>

        {/* PII Alert Banner */}
        {piiAlert && (
          <div className="bg-amber-950/80 border-b border-amber-800 px-6 py-2 text-xs text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{piiAlert}</span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isLocal = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isLocal ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLocal ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {msg.avatarText}
                </div>

                <div className={`space-y-1 ${isLocal ? 'items-end' : ''}`}>
                  <div className={`flex items-center gap-2 text-xs ${isLocal ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-200">{msg.senderName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                    <span title="KMS Encrypted">
                      <Lock className="w-3 h-3 text-slate-500" />
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isLocal
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Attachment preview */}
                    {msg.attachment && (
                      <div
                        className={`mt-2 p-2.5 rounded border flex items-center justify-between gap-3 ${
                          isLocal
                            ? 'bg-blue-700/60 border-blue-500/60'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                          <div className="truncate">
                            <div className="font-medium truncate">{msg.attachment.name}</div>
                            <div className="text-[10px] opacity-80 font-mono">{msg.attachment.size}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => alert(`Downloading document: ${msg.attachment?.name}`)}
                          className="p-1 hover:bg-black/20 rounded transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isLocal && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <span>Delivered</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Composer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSend} className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickAttach}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Attach Verified Financial Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeChannel.name}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Automatic PCI-DSS tokenization & GLBA compliance active.</span>
              <button
                type="button"
                onClick={handleQuickAttach}
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Quick Share Loan Doc</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
