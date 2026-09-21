import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchEvents, runMatchingEngine } from '../api/events';
import { useProject } from '../context/ProjectContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { BrainCircuit, Link2, MapPin, Calendar, Activity, CheckCircle2, AlertCircle, Building2, ChevronRight } from 'lucide-react';

function Matching() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const [isMatching, setIsMatching] = useState(false);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return fetchEvents(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const matchMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return runMatchingEngine(token, activeProject.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', activeProject?.id] });
      alert(`Matching complete! Processed ${data.eventsProcessed} events and created ${data.totalMatchesCreated} matches.`);
      navigate(`/review-center`);
    },
    onError: (err) => {
      alert(`Error running matching engine: ${err.message}`);
    },
    onSettled: () => {
      setIsMatching(false);
    }
  });

  const handleRunMatching = () => {
    setIsMatching(true);
    matchMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
              <BrainCircuit className="h-8 w-8 mr-3 text-pink-600" />
              Activity Matching Engine
            </h1>
            <p className="mt-2 text-slate-500 max-w-2xl">
              Semantically link AI-extracted field events to P6 schedule activities using vector embeddings and similarity search.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRunMatching}
              disabled={isMatching || events?.length === 0 || !activeProject}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                isMatching || events?.length === 0 || !activeProject
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'
              }`}
            >
              {isMatching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Running Engine...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Run AI Matching Engine
                </>
              )}
            </button>
          </div>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view extracted events and run matching.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading events...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Events</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                  {events?.length || 0}
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pending Extracted Events</h2>
              </div>
              {events?.length > 0 && (
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  Ready for matching <ChevronRight className="w-4 h-4" />
                </p>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action / Object</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location & Date</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Discipline</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events?.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="py-16 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Activity className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">No pending events</h3>
                          <p className="text-slate-500">There are no un-matched events to process. Upload a new field report.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    events?.map(event => (
                      <tr key={event.id} className="hover:bg-pink-50/30 transition-colors group cursor-default">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                                {event.action}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-pink-700 transition-colors">{event.object}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-medium text-slate-900 mb-1.5">
                            <MapPin size={16} className="text-slate-400 mr-2" />
                            {event.location || '-'}
                          </div>
                          {event.actual_start && (
                            <div className="flex items-center text-sm font-medium text-slate-500">
                              <Calendar size={16} className="text-slate-400 mr-2" />
                              {new Date(event.actual_start).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {event.discipline ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {event.discipline}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {event.status ? (
                            <div className="flex items-center text-xs font-bold text-emerald-600">
                              <CheckCircle2 size={14} className="mr-1.5" />
                              {event.status}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {event.source_report}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Matching;
