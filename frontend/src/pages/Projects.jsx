import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Plus, Search, Loader2, Building2, Calendar as CalendarIcon, ArrowRight, Activity, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../api/projects';
import { useProject } from '../context/ProjectContext';
import DashboardLayout from '../layouts/DashboardLayout';

export default function Projects() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeProject, setActiveProject } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    client: '',
    location: '',
    description: '',
    planned_start: '',
    planned_finish: ''
  });

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken();
      return getProjects(token);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return createProject(token, data);
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setFormData({
        project_code: '', name: '', client: '', location: '',
        description: '', planned_start: '', planned_finish: ''
      });
      // Automatically set the new project as active and route to dashboard
      if (newProject) {
        setActiveProject(newProject);
      }
      navigate('/dashboard');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, clerk_user_id: user.id });
  };

  const handleSelectProject = (project) => {
    setActiveProject(project);
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Portfolio</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all your construction projects across the organization.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-500 font-medium">Loading portfolio...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow-sm flex items-start gap-4">
          <div className="bg-red-100 p-2 rounded-lg"><Activity className="w-6 h-6 text-red-600"/></div>
          <div>
            <h3 className="font-semibold text-lg">Failed to load projects</h3>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        </div>
      ) : projects?.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ConstructIQ</h3>
          <p className="text-slate-500 mb-8 max-w-md text-lg">You don't have any projects yet. Create your first project to start extracting execution intelligence from your field data.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => handleSelectProject(project)}
              className={`group bg-white border rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col cursor-pointer overflow-hidden relative ${activeProject?.id === project.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 hover:border-blue-300"}`}
            >
              {activeProject?.id === project.id && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                  ACTIVE
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                    {project.project_code}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    project.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                    project.status === 'Planning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                
                <div className="space-y-2 mb-4">
                  {project.client && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="truncate">{project.client}</span>
                    </div>
                  )}
                  {project.location && (
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{project.description}</p>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 group-hover:bg-blue-50/50 transition-colors flex justify-between items-center">
                <div className="flex items-center text-xs font-medium text-slate-500">
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(project.planned_start).toLocaleDateString(undefined, {month:'short', year:'numeric'})} 
                  {' - '} 
                  {new Date(project.planned_finish).toLocaleDateString(undefined, {month:'short', year:'numeric'})}
                </div>
                <div className="text-blue-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                  Open <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New Project</h2>
                <p className="text-sm text-slate-500 mt-1">Set up the foundation for your new construction project.</p>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Code <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="e.g. PRJ-2024" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white" value={formData.project_code} onChange={e => setFormData({...formData, project_code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Name <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="e.g. Greenfield Petrochemical Expansion" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                  <input type="text" placeholder="Client organization name" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input type="text" placeholder="City, State, or Address" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Description</label>
                <textarea rows="3" placeholder="Briefly describe the scope and objectives of this project..." className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Planned Start <span className="text-red-500">*</span></label>
                  <input required type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white" value={formData.planned_start} onChange={e => setFormData({...formData, planned_start: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Planned Finish <span className="text-red-500">*</span></label>
                  <input required type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white" value={formData.planned_finish} onChange={e => setFormData({...formData, planned_finish: e.target.value})} />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center shadow-md shadow-blue-500/20 disabled:opacity-70">
                  {createMutation.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {createMutation.isPending ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
