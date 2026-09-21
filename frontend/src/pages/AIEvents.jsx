import { useState, useEffect } from 'react';
import { fetchEvents } from '../api/events';
import { Sparkles, MapPin, Calendar, Activity, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

const AIEvents = () => {
  const { getToken } = useAuth();
  const { activeProject } = useProject();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeProject?.id) {
      loadEvents(activeProject.id);
    } else {
      setEvents([]);
    }
  }, [activeProject]);

  const loadEvents = async (projectId) => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchEvents(token, projectId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <Sparkles className="h-8 w-8 mr-3 text-purple-600" />
            AI Extracted Events
          </h1>
          <p className="mt-2 text-slate-500">
            Structured semantic events extracted from raw field reports by ConstructIQ's AI engine.
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view extracted AI events.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading AI events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="bg-purple-50 w-20 h-20 border border-purple-100 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Events Found</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">We haven't extracted any events for this project yet. Upload a field report first.</p>
            <Link to="/ingestion" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md shadow-purple-500/20 text-lg">
              Go to Data Ingestion
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Event / Object
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Location & Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Extracted Context (Proof)
                    </th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-white transition-colors">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{event.action}</div>
                            <div className="text-sm font-medium text-slate-600">{event.object}</div>
                            {event.discipline && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-1.5">
                                {event.discipline}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-slate-900 mb-1.5">
                          <MapPin size={16} className="text-slate-400 mr-2" />
                          {event.location || 'Unknown'}
                        </div>
                        {event.actual_start && (
                          <div className="flex items-center text-sm font-medium text-slate-500">
                            <Calendar size={16} className="text-slate-400 mr-2" />
                            {new Date(event.actual_start).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {event.quantity ? `${event.quantity} ${event.unit || ''}` : '-'}
                        </div>
                        {event.status && (
                          <div className="flex items-center text-xs font-bold text-emerald-600 mt-1.5">
                            <CheckCircle2 size={14} className="mr-1" />
                            {event.status}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic font-medium">
                        "{event.source_text}"
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {event.source_report}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIEvents;
