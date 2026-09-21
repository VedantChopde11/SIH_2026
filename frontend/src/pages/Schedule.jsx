import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, Loader2, FolderTree, FileSpreadsheet, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Building2, Upload, Activity } from 'lucide-react';
import { getSchedule, uploadSchedule } from '../api/schedule';
import { useAuth } from '@clerk/clerk-react';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

export default function Schedule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  // Fetch Schedule for selected project
  const { data: scheduleData, isLoading: scheduleLoading, error: scheduleError } = useQuery({
    queryKey: ['schedule', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getSchedule(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload) => {
      const token = await getToken();
      return uploadSchedule(token, activeProject.id, fileToUpload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', activeProject?.id] });
      setFile(null);
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file || !activeProject) return;
    uploadMutation.mutate(file);
  };

  const hasSchedule = scheduleData && (scheduleData.wbsNodes?.length > 0 || scheduleData.activities?.length > 0);

  // Helper to render hierarchical WBS
  const renderWbsTree = (nodes, activities, parentId = null) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    if (children.length === 0) {
      // return activities for this parentId
      const nodeActivities = activities.filter(a => a.wbs_id === parentId);
      return nodeActivities.map(act => (
        <div key={`act-${act.id}`} className="pl-6 py-2.5 border-b border-slate-100 flex items-center text-sm hover:bg-slate-50 transition-colors group">
          <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 mr-3 transition-colors" />
          <div className="flex-1">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mr-3">{act.activity_id_original}</span>
            <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{act.activity_name}</span>
          </div>
          <div className="text-slate-500 text-xs font-medium w-48 flex justify-end gap-4">
            <span>{act.planned_start ? new Date(act.planned_start).toLocaleDateString() : '-'}</span>
            <span>{act.planned_finish ? new Date(act.planned_finish).toLocaleDateString() : '-'}</span>
            <span className="w-10 text-right font-bold text-slate-700">{act.duration}d</span>
          </div>
        </div>
      ));
    }

    return children.map(node => (
      <div key={`wbs-${node.id}`} className="mt-3">
        <div className="flex items-center py-2 px-3 bg-blue-50/50 border border-blue-100/50 rounded-lg mb-1">
          <FolderTree className="w-4 h-4 text-blue-500 mr-2" />
          <span className="font-bold text-slate-800">{node.wbs_code}</span>
          <span className="ml-2 text-slate-500 text-sm font-medium">- {node.name}</span>
        </div>
        <div className="pl-4 border-l-2 border-slate-100 ml-2.5 mt-2">
          {renderWbsTree(nodes, activities, node.id)}
          {/* Also render activities attached directly to this WBS node, if any */}
          {activities.filter(a => a.wbs_id === node.id).map(act => (
            <div key={`act-${act.id}`} className="pl-2 py-2.5 border-b border-slate-100 flex items-center text-sm hover:bg-slate-50 transition-colors group">
              <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 mr-3 transition-colors" />
              <div className="flex-1">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mr-3">{act.activity_id_original}</span>
                <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{act.activity_name}</span>
              </div>
              <div className="text-slate-500 text-xs font-medium w-48 flex justify-end gap-4">
                <span>{act.planned_start ? new Date(act.planned_start).toLocaleDateString() : '-'}</span>
                <span>{act.planned_finish ? new Date(act.planned_finish).toLocaleDateString() : '-'}</span>
                <span className="w-10 text-right font-bold text-slate-700">{act.duration}d</span>
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
            <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
            Schedule Management
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Import, view, and manage your project's schedule and Work Breakdown Structure (WBS).
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view or import its schedule.</p>
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
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Schedule</h3>
              <p className="text-sm mt-1 opacity-90">{scheduleError.message}</p>
            </div>
          </div>
        ) : !hasSchedule ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Schedule Found</h2>
            <p className="text-slate-500 mb-10 text-lg">
              This project doesn't have a schedule yet. Upload a Primavera P6 or MS Project export (.xlsx, .csv) to generate the Work Breakdown Structure.
            </p>
            
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 transition-colors cursor-pointer ${
                file ? 'border-green-300 bg-green-50/30' : 'border-slate-300 hover:bg-slate-50 hover:border-blue-300'
              }`}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-lg mb-6">{file.name}</span>
                  <div className="flex items-center gap-3 w-full max-w-xs">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                      className="flex-1 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
                      disabled={uploadMutation.isPending} 
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {uploadMutation.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-slate-900 font-bold mb-1">Click to upload or drag and drop</p>
                  <p className="text-slate-500 font-medium text-sm">XLSX, XLS, or CSV files supported</p>
                </div>
              )}
            </div>
            {uploadMutation.isError && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uploadMutation.error.message}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-slate-900 flex items-center text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-2.5" />
                Schedule Imported Successfully
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
                  <FolderTree className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">{scheduleData.wbsNodes.length}</span>
                  <span className="text-slate-500 font-medium">WBS Nodes</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">{scheduleData.activities.length}</span>
                  <span className="text-slate-500 font-medium">Activities</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
               <div className="flex text-xs font-bold text-slate-400 uppercase tracking-wider border-b-2 border-slate-100 pb-3 mb-4 pr-4 sticky top-0 bg-white z-10">
                 <div className="flex-1">Hierarchy / Activity</div>
                 <div className="w-48 flex justify-end gap-4">
                   <span>Start</span>
                   <span>Finish</span>
                   <span className="w-10 text-right">Dur</span>
                 </div>
               </div>
               
               <div className="pb-10">
                 {renderWbsTree(scheduleData.wbsNodes, scheduleData.activities)}
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
