import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  PhoneCall,
  Video,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { CustomerRecord } from '../../types/crm';

interface CustomerDirectoryViewProps {
  customers: CustomerRecord[];
  onSelectCustomer: (customer: CustomerRecord) => void;
  onCallCustomer: (customer: CustomerRecord) => void;
  onStartVideoMeeting: (customer: CustomerRecord) => void;
  onScheduleMeeting: (customer: CustomerRecord) => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  customers,
  onSelectCustomer,
  onCallCustomer,
  onStartVideoMeeting,
  onScheduleMeeting,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Private Wealth' | 'Commercial Banking'>('All');

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'All' || c.accountType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Customer Directory & 360 Profiles
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise customer repository with integrated one-click Chime video, voice telephony,
              and AI interaction histories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
              {(['All', 'Private Wealth', 'Commercial Banking'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded transition-colors ${
                    filterType === t
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, ID, email, or company..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Customer Directory Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">Customer Name & ID</th>
                  <th className="py-3 px-4">Account Type & AUM</th>
                  <th className="py-3 px-4">KYC Compliance</th>
                  <th className="py-3 px-4">Assigned Relationship Manager</th>
                  <th className="py-3 px-4">Active Lending Tickets</th>
                  <th className="py-3 px-4 text-right">Direct Communication Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                          {c.avatar}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectCustomer(c)}
                            className="font-semibold text-white hover:text-blue-400 transition-colors text-left text-sm"
                          >
                            {c.name}
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {c.customerId} · {c.company}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Account Type & Portfolio */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{c.accountType}</div>
                      <div className="font-mono text-emerald-400 font-semibold text-xs">
                        {c.portfolioValue}
                      </div>
                    </td>

                    {/* KYC */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                        {c.kycStatus}
                      </span>
                    </td>

                    {/* Assigned RM */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{c.assignedRMName}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>

                    {/* Active Tickets */}
                    <td className="py-3.5 px-4">
                      {c.openTickets.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-blue-400">
                            {c.openTickets[0].id}: {c.openTickets[0].title.slice(0, 28)}...
                          </span>
                          {c.openTickets.length > 1 && (
                            <span className="text-[10px] text-slate-500 block">
                              +{c.openTickets.length - 1} more ticket
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">None open</span>
                      )}
                    </td>

                    {/* Direct Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onStartVideoMeeting(c)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                          title="Start HD Video Meeting"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onCallCustomer(c)}
                          className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded transition-colors"
                          title="Call Customer (In-App or PSTN)"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onScheduleMeeting(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                          title="Schedule Future Meeting"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectCustomer(c)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-[11px] transition-colors"
                        >
                          360 Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
