import React, { useState } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Filter,
  FileText,
  Clock,
  Radio,
  Server,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CallRecord, CustomerRecord } from '../../types/crm';

interface CallHistoryViewProps {
  calls: CallRecord[];
  customers: CustomerRecord[];
  onSelectCustomerById: (customerId: string) => void;
  onRedialCall: (customerPhone: string, customerName: string) => void;
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  calls,
  customers,
  onSelectCustomerById,
  onRedialCall,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'in_app_audio' | 'pstn_telephony'>('all');
  const [search, setSearch] = useState('');

  const filteredCalls = calls.filter((c) => {
    const matchesMode = filterMode === 'all' || c.mode === filterMode;
    const matchesSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerPhone.includes(search) ||
      c.notes.toLowerCase().includes(search.toLowerCase());
    return matchesMode && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Call History & PBX Logs</h1>
            <p className="text-xs text-slate-400 mt-1">
              Unified audio communication records spanning Amazon Chime SDK in-app browser sessions
              and Amazon Connect Customer PSTN telephony.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded transition-colors ${
                filterMode === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Calls
            </button>
            <button
              onClick={() => setFilterMode('in_app_audio')}
              className={`px-3 py-1 rounded transition-colors ${
                filterMode === 'in_app_audio'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In-App Audio (Chime)
            </button>
            <button
              onClick={() => setFilterMode('pstn_telephony')}
              className={`px-3 py-1 rounded transition-colors ${
                filterMode === 'pstn_telephony'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mobile PSTN (Connect)
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or notes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Call Records Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">Direction & Provider</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4">Start Time & Duration</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Associated CRM Ticket</th>
                  <th className="py-3 px-4">Call Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCalls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Direction */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {c.direction === 'inbound' ? (
                          <PhoneIncoming className="w-4 h-4 text-blue-400" />
                        ) : (
                          <PhoneOutgoing className="w-4 h-4 text-emerald-400" />
                        )}
                        <div>
                          <div className="font-semibold text-white capitalize">
                            {c.direction} Call
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.telephonyProvider}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCustomerById(c.customerId)}
                        className="font-medium text-white hover:text-blue-400 transition-colors text-left"
                      >
                        {c.customerName}
                      </button>
                      <div className="text-[11px] text-slate-400 font-mono">{c.customerPhone}</div>
                    </td>

                    {/* Time & Duration */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{c.startTime}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s
                      </div>
                    </td>

                    {/* Outcome */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          c.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Ticket */}
                    <td className="py-3.5 px-4">
                      {c.associatedTicketId ? (
                        <span className="font-mono text-blue-400 font-medium">
                          #{c.associatedTicketId}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-300 text-[11px]">
                      {c.notes}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onRedialCall(c.customerPhone, c.customerName)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
                      >
                        Call Back
                      </button>
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
