import React, { useState } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  UserPlus,
  Key,
  Users,
  CheckCircle2,
  Lock,
  Copy,
  Server,
  Code
} from 'lucide-react';
import { AppInstanceData, UserProfile, UserRole } from '../../types';

interface IdentitySDKViewProps {
  appInstance: AppInstanceData;
  users: UserProfile[];
  onAddUser: (user: UserProfile) => void;
}

export const IdentitySDKView: React.FC<IdentitySDKViewProps> = ({
  appInstance,
  users,
  onAddUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Commercial Banking');
  const [title, setTitle] = useState('Commercial Client Director');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArn(text);
    setTimeout(() => setCopiedArn(null), 2500);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const idSuffix = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const avatarInitials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newUser: UserProfile = {
      id: `usr_${idSuffix}_${Date.now()}`,
      name,
      role,
      email: email || `${idSuffix}@apexvaultbank.com`,
      avatarText: avatarInitials,
      department,
      title,
      appInstanceUserArn: `${appInstance.appInstanceArn}/user/${idSuffix}`,
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Amazon Chime SDK Identity SDK & AppInstances
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Identity federation and AppInstanceUser ARN provisioning for banking relationship
              managers, clients, and CRM contact center agents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create AppInstanceUser</span>
            </button>
          </div>
        </div>

        {/* AppInstance Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">{appInstance.name}</span>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Region: {appInstance.region}</span>
                  <span>·</span>
                  <span>Created: {appInstance.createdDate}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(appInstance.appInstanceArn)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedArn === appInstance.appInstanceArn ? 'Copied!' : 'Copy ARN'}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active AppInstance Users</span>
              <span className="font-mono text-base font-bold text-white">
                {users.length + 1415}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">E2EE KMS Key</span>
              <span className="font-mono text-[11px] text-emerald-400 truncate block">
                mrk-98319fbc-banking
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">FINRA Data Retention</span>
              <span className="font-mono text-base font-bold text-white">
                {appInstance.dataRetentionDays} Days (7 Yrs)
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Identity Federation</span>
              <span className="font-mono text-[11px] text-blue-400">AWS STS & SAML 2.0</span>
            </div>
          </div>
        </div>

        {/* AppInstance Users Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Provisioned Messaging Identities ({users.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">CRMNEXT Synced</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">User & Persona</th>
                  <th className="pb-2.5">CRM Role</th>
                  <th className="pb-2.5">Department</th>
                  <th className="pb-2.5">Chime AppInstanceUser ARN</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-blue-400">
                          {u.avatarText}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{u.department}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {u.appInstanceUserArn}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Token Generation Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-400" />
            <span>Identity SDK Client-Side Token Handshake Flow</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-2">
            <div className="text-slate-500">// 1. CRM Server exchanges user session for AWS STS Temporary Credentials</div>
            <div>
              <span className="text-blue-400">POST</span> /api/chime/identity/create-session-token
            </div>
            <div className="text-slate-400">
              Payload: &#123; appInstanceUserArn: "{appInstance.appInstanceArn}/user/david-sterling", role: "CLIENT" &#125;
            </div>
            <div className="text-slate-500 pt-1">// 2. Browser connects to Amazon Chime Messaging WebSocket with SigV4 URL</div>
            <div className="text-emerald-400">
              wss://messaging.chime.us-east-1.amazonaws.com/connect?X-Amz-Security-Token=...
            </div>
          </div>
        </div>

        {/* Modal: Create User */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Create AppInstanceUser</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jonathan Wu"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. j.wu@apexvaultbank.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">CRM Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                      <option value="CLIENT">Banking Client</option>
                      <option value="WEALTH_ADVISOR">Wealth Advisor</option>
                      <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                      <option value="CONTACT_CENTER_AGENT">Contact Center Agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Register Identity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
