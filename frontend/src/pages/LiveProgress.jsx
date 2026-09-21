import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Calendar as CalendarIcon, FolderTree, AlertCircle, CheckCircle2, Activity, Building2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getProgress } from '../api/analytics';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

export default function LiveProgress() {
  const { getToken } = useAuth();
  const { activeProject } = useProject();

  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ['progress', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getProgress(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  // Helper to render hierarchical WBS with progress
  const renderWbsTree = (nodes, activities, parentId = null) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    
    // Base Case: No WBS children, render activities
    if (children.length === 0) {
      const nodeActivities = activities.filter(a => a.wbs_id === parentId);
      return nodeActivities.map(act => (
        <div key={`act-${act.id}`} className="pl-6 py-4 border-b border-slate-100 flex items-center hover:bg-slate-50 transition-colors group">
          <CalendarIcon className="w-5 h-5 text-slate-400 mr-4 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
          
          <div className="w-1/3 min-w-[200px] pr-4">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 mr-2">{act.activity_id_original}</span>
            <span className="text-slate-900 font-bold text-sm block mt-2 group-hover:text-blue-700 transition-colors">{act.activity_name}</span>
          </div>
          
          {/* Planned vs Actual Timeline */}
          <div className="flex-1 px-4 grid grid-cols-2 gap-4 text-sm">
            {/* Planned */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Planned</div>
              <div className="font-medium text-slate-700">{new Date(act.planned_start).toLocaleDateString()} - {new Date(act.planned_finish).toLocaleDateString()}</div>
              <div className="text-slate-500 font-bold text-xs mt-1">{act.duration} days</div>
            </div>
            
            {/* Actual */}
            <div className={`p-3 rounded-xl border shadow-sm ${!act.actual_start ? 'bg-slate-50 border-slate-200 border-dashed' : act.varianceDays > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`font-bold text-[10px] uppercase tracking-wider mb-1 flex justify-between ${!act.actual_start ? 'text-slate-400' : act.varianceDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>Actual</span>
                {act.varianceDays > 0 && <span className="bg-red-100/80 text-red-700 px-1.5 py-0.5 rounded flex items-center shadow-sm"><AlertCircle className="w-3 h-3 mr-1"/>+{act.varianceDays}d DELAY</span>}
                {act.varianceDays <= 0 && act.actual_start && <span className="bg-green-100/80 text-green-700 px-1.5 py-0.5 rounded flex items-center shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1"/>ON TIME</span>}
              </div>
              <div className={!act.actual_start ? 'text-slate-400 font-medium' : 'text-slate-900 font-bold'}>
                {act.actual_start ? new Date(act.actual_start).toLocaleDateString() : 'Not Started'}
              </div>
            </div>
          </div>

          {/* Latest AI Update */}
          <div className="w-1/4 pl-6 text-sm">
            {act.latestProgress ? (
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                <span className="font-bold text-[10px] text-blue-600 uppercase tracking-wider block mb-1">Updated {new Date(act.latestProgress.reported_date).toLocaleDateString()}</span>
                <span className="text-slate-700 font-medium line-clamp-2" title={act.latestProgress.notes}>{act.latestProgress.notes}</span>
                <div className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-wider flex justify-between">
                  <span>Source: {act.latestProgress.source_report}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 border-dashed p-3 rounded-xl flex items-center justify-center text-slate-400 italic text-xs h-full">
                No updates yet
              </div>
            )}
          </div>
        </div>
      ));
    }

    return children.map(node => (
      <div key={`wbs-${node.id}`} className="mt-4">
        <div className="flex items-center py-3 px-4 bg-blue-50/50 border border-blue-100/50 rounded-xl mb-2 shadow-sm">
          <FolderTree className="w-5 h-5 text-blue-500 mr-3" />
          <span className="font-bold text-slate-800">{node.wbs_code}</span>
          <span className="ml-3 text-slate-600 font-medium">- {node.name}</span>
        </div>
        <div className="pl-6 border-l-2 border-blue-100 ml-3">
          {renderWbsTree(nodes, activities, node.id)}
          
          {/* Also render direct activities under this WBS */}
          {activities.filter(a => a.wbs_id === node.id).map(act => (
            <div key={`act-${act.id}`} className="pl-2 py-4 border-b border-slate-100 flex items-center hover:bg-slate-50 transition-colors group">
              <CalendarIcon className="w-5 h-5 text-slate-400 mr-4 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
              
              <div className="w-1/3 min-w-[200px] pr-4">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 mr-2">{act.activity_id_original}</span>
                <span className="text-slate-900 font-bold text-sm block mt-2 group-hover:text-blue-700 transition-colors">{act.activity_name}</span>
              </div>
              
              {/* Planned vs Actual Timeline */}
              <div className="flex-1 px-4 grid grid-cols-2 gap-4 text-sm">
                {/* Planned */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Planned</div>
                  <div className="font-medium text-slate-700">{new Date(act.planned_start).toLocaleDateString()} - {new Date(act.planned_finish).toLocaleDateString()}</div>
                  <div className="text-slate-500 font-bold text-xs mt-1">{act.duration} days</div>
                </div>
                
                {/* Actual */}
                <div className={`p-3 rounded-xl border shadow-sm ${!act.actual_start ? 'bg-slate-50 border-slate-200 border-dashed' : act.varianceDays > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className={`font-bold text-[10px] uppercase tracking-wider mb-1 flex justify-between ${!act.actual_start ? 'text-slate-400' : act.varianceDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Actual</span>
                    {act.varianceDays > 0 && <span className="bg-red-100/80 text-red-700 px-1.5 py-0.5 rounded flex items-center shadow-sm"><AlertCircle className="w-3 h-3 mr-1"/>+{act.varianceDays}d DELAY</span>}
                    {act.varianceDays <= 0 && act.actual_start && <span className="bg-green-100/80 text-green-700 px-1.5 py-0.5 rounded flex items-center shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1"/>ON TIME</span>}
                  </div>
                  <div className={!act.actual_start ? 'text-slate-400 font-medium' : 'text-slate-900 font-bold'}>
                    {act.actual_start ? new Date(act.actual_start).toLocaleDateString() : 'Not Started'}
                  </div>
                </div>
              </div>

              {/* Latest AI Update */}
              <div className="w-1/4 pl-6 text-sm">
                {act.latestProgress ? (
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-blue-600 uppercase tracking-wider block mb-1">Updated {new Date(act.latestProgress.reported_date).toLocaleDateString()}</span>
                    <span className="text-slate-700 font-medium line-clamp-2" title={act.latestProgress.notes}>{act.latestProgress.notes}</span>
                    <div className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-wider flex justify-between">
                      <span>Source: {act.latestProgress.source_report}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 border-dashed p-3 rounded-xl flex items-center justify-center text-slate-400 italic text-xs h-full">
                    No updates yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <Activity className="h-8 w-8 mr-3 text-blue-600" />
            Live Progress Tracking
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">Compare planned baseline schedules against AI-derived actuals in real-time.</p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to visualize schedule variances and recent field updates.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading progress data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Progress</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-slate-900 flex items-center text-lg">
                <CalendarIcon className="w-5 h-5 text-blue-500 mr-2" />
                Schedule Variance View
              </h3>
              <div className="flex flex-wrap gap-4 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center text-green-700"><div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 shadow-sm"></div> On Time</div>
                <div className="flex items-center text-red-700"><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm"></div> Delayed</div>
                <div className="flex items-center text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-2 shadow-sm"></div> Not Started</div>
              </div>
            </div>
            
            {/* Table Headers */}
            <div className="flex px-6 py-3 bg-white border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <div className="w-1/3 min-w-[200px]">WBS / Activity Name</div>
              <div className="flex-1 px-4 text-center">Planned vs Actual Timeline</div>
              <div className="w-1/4 pl-6">Latest AI Field Update</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
               {progressData?.wbsNodes?.length > 0 
                 ? (
                   <div className="max-w-7xl mx-auto pb-10">
                     {renderWbsTree(progressData.wbsNodes, progressData.activities)}
                   </div>
                 )
                 : (
                   <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                     <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderTree className="w-8 h-8 text-slate-400" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">No Schedule Data</h3>
                     <p className="text-slate-500 mb-6 max-w-sm mx-auto">No schedule data found for this project. Import a schedule first to track progress.</p>
                     <Link to="/schedule" className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors">
                        Go to Schedule
                     </Link>
                   </div>
                 )
               }
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
