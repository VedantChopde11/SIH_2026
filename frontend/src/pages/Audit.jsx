import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import { History, Search, Loader2, Building2, AlertTriangle, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAuditLogs } from '../api/audit';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

export default function Audit() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { activeProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');

  const formatAuditDate = (dateStr) => {
    const d = new Date(dateStr);
    const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
    return utcDate.toLocaleString();
  };

  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['audit', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getAuditLogs(token, activeProject.id);
    },
    enabled: !!activeProject?.id,
    refetchInterval: 30000 // Refresh every 30s
  });

  const filteredLogs = auditLogs?.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.user_id?.toLowerCase().includes(q) ||
      log.entity_type?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <History className="w-8 h-8 mr-3 text-blue-600" />
            Audit Trail
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">Track all system events and user actions across the project.</p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view its audit logs.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Audit Logs</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by action, user, or entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                />
              </div>
              <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center">
                 <ShieldCheck className="w-4 h-4 mr-2 text-slate-400" />
                Showing {filteredLogs.length} logs
              </div>
            </div>
  
            <div className="flex-1 overflow-x-auto">
              {filteredLogs.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Logs Found</h3>
                  <p className="text-slate-500 font-medium">No matching audit logs were found for your search.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b-2 border-slate-200 font-bold">
                      <th className="px-6 py-4 w-48">Timestamp</th>
                      <th className="px-6 py-4">User / System</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Entity Type</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                          {formatAuditDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold">
                          {log.user_id === user?.id ? (user?.fullName || user?.primaryEmailAddress?.emailAddress || 'You') : 'Team Member'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                          {log.entity_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs max-w-md truncate group-hover:text-slate-700 transition-colors">
                          {JSON.stringify(log.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
