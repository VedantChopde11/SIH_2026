import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Search, Loader2, FolderTree, AlignLeft, MapPin, Building2, Calendar, Activity } from 'lucide-react';
import { getSchedule } from '../api/schedule';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

export default function WBS() {
  const { getToken } = useAuth();
  const { activeProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch Schedule for selected project
  const { data: scheduleData, isLoading: scheduleLoading, error: scheduleError } = useQuery({
    queryKey: ['schedule', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getSchedule(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const hasData = scheduleData && (scheduleData.wbsNodes?.length > 0 || scheduleData.activities?.length > 0);

  // Filter activities based on search
  const filteredActivities = useMemo(() => {
    if (!scheduleData || !scheduleData.activities) return [];
    if (!searchQuery) return scheduleData.activities;
    
    const query = searchQuery.toLowerCase();
    return scheduleData.activities.filter(a => 
      a.activity_name?.toLowerCase().includes(query) ||
      a.activity_id_original?.toLowerCase().includes(query) ||
      a.location?.toLowerCase().includes(query) ||
      a.discipline?.toLowerCase().includes(query)
    );
  }, [scheduleData, searchQuery]);

  // Check if a WBS node has any matching activities (directly or nested)
  const wbsHasMatch = (wbsId, nodes, activities) => {
    if (activities.some(a => a.wbs_id === wbsId)) return true;
    const children = nodes.filter(n => n.parent_id === wbsId);
    return children.some(c => wbsHasMatch(c.id, nodes, activities));
  };

  const renderWbsTree = (nodes, filteredActs, parentId = null) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    
    // Only render children that have matches (if searching)
    const validChildren = searchQuery 
      ? children.filter(c => wbsHasMatch(c.id, nodes, filteredActs))
      : children;

    const nodeActivities = filteredActs.filter(a => a.wbs_id === parentId);

    if (validChildren.length === 0 && nodeActivities.length === 0) {
      return null;
    }

    return (
      <div className="w-full">
        {validChildren.map(node => (
          <div key={`wbs-${node.id}`} className="mt-3">
            <div className="flex items-center py-2 px-3 bg-blue-50/50 border border-blue-100/50 rounded-lg mb-1 shadow-sm">
              <FolderTree className="w-4 h-4 text-blue-500 mr-2" />
              <span className="font-bold text-slate-800 mr-2">{node.wbs_code}</span>
              <span className="text-slate-600 text-sm font-medium">{node.name}</span>
            </div>
            <div className="pl-6 border-l-2 border-blue-100 ml-3">
              {renderWbsTree(nodes, filteredActs, node.id)}
            </div>
          </div>
        ))}
        
        {nodeActivities.length > 0 && (
          <div className="mt-3 space-y-2">
            {nodeActivities.map(act => (
              <div key={`act-${act.id}`} className="flex items-center justify-between py-3 px-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all shadow-sm group">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mr-4 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors shrink-0">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {act.activity_id_original}
                      </span>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{act.activity_name}</span>
                    </div>
                    {(act.location || act.discipline) && (
                      <div className="flex items-center mt-1 text-xs text-slate-500 space-x-3">
                        {act.location && (
                          <span className="flex items-center font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><MapPin className="w-3 h-3 mr-1 text-slate-400" />{act.location}</span>
                        )}
                        {act.discipline && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold rounded">{act.discipline}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-slate-500 space-x-6 shrink-0 ml-4">
                  <div className="text-right">
                    <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Start</div>
                    <div className="font-medium text-slate-700">{act.planned_start ? new Date(act.planned_start).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Finish</div>
                    <div className="font-medium text-slate-700">{act.planned_finish ? new Date(act.planned_finish).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="text-right w-14">
                    <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Dur</div>
                    <div className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block font-mono font-bold text-slate-700">{act.duration}d</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <FolderTree className="h-8 w-8 mr-3 text-blue-600" />
            WBS & Activities
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Browse the Work Breakdown Structure and explore project activities.
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view its WBS and schedule.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : scheduleLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading schedule...</p>
          </div>
        ) : scheduleError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <div>
              <h3 className="font-semibold text-lg">Error Loading Schedule</h3>
              <p className="text-sm mt-1 opacity-90">{scheduleError.message}</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
             <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10" />
             </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Schedule Data</h3>
            <p className="text-slate-500 mb-8 text-lg">
              This project does not have a schedule imported yet. Go to the Schedule page to import one.
            </p>
             <Link to="/schedule" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Go to Schedule
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Toolbar */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search activities by ID, name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
                  <FolderTree className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">{scheduleData.wbsNodes.length}</span>
                  <span className="text-slate-500 font-medium">Nodes</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">{filteredActivities.length} / {scheduleData.activities.length}</span>
                  <span className="text-slate-500 font-medium">Activities</span>
                </div>
              </div>
            </div>
            
            {/* Tree View */}
            <div className="flex-1 overflow-x-auto p-6 bg-slate-50/30">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No matches found</h3>
                  <p className="text-slate-500">No activities match your current search criteria.</p>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto">
                  {renderWbsTree(scheduleData.wbsNodes, filteredActivities)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
