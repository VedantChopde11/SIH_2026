import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Settings as SettingsIcon, Save, Loader2, User, Building, MapPin, AlignLeft, Info } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getProject, updateProject } from '../api/projects';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { activeProject, setActiveProject } = useProject();
  
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    location: '',
    description: '',
    status: ''
  });

  const { data: currentProject, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getProject(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name || '',
        client: currentProject.client || '',
        location: currentProject.location || '',
        description: currentProject.description || '',
        status: currentProject.status || 'Planning'
      });
    }
  }, [currentProject]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return updateProject(token, { id: activeProject.id, ...data });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['project', activeProject.id]);
      setActiveProject(data);
    },
    onError: (err) => {
      alert('Error saving settings: ' + err.message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeProject) return;
    updateMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <SettingsIcon className="w-8 h-8 mr-3 text-blue-600" />
            Settings
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">Manage project details and your personal preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center">
                <User className="w-5 h-5 text-blue-600 mr-3" />
                <h3 className="text-lg font-bold text-slate-900">Your Profile</h3>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-blue-100 rounded-full blur-md opacity-50"></div>
                   <img 
                     src={user?.imageUrl} 
                     alt="Profile" 
                     className="relative w-28 h-28 rounded-full border-4 border-white shadow-md object-cover z-10"
                   />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-1">{user?.fullName}</h4>
                <p className="text-slate-500 font-medium mb-6">{user?.primaryEmailAddress?.emailAddress}</p>
                
                <div className="w-full text-left bg-blue-50/50 border border-blue-100 p-5 rounded-xl text-sm text-slate-600 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">Profile information and authentication are managed securely by Clerk. You can update your details in the Clerk user portal.</p>
                </div>
              </div>
            </div>
          </div>
  
          {/* Project Settings */}
          <div className="lg:col-span-2">
            {!activeProject ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Building className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to edit its settings.</p>
                <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
                  Select a Project
                </Link>
              </div>
            ) : isProjectLoading ? (
              <div className="flex flex-col justify-center items-center h-full min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading project settings...</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center">
                  <Building className="w-5 h-5 text-blue-600 mr-3" />
                  <h3 className="text-lg font-bold text-slate-900">Project Configuration</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8">
                  <div className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                          Project Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 bg-white"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                           <User className="w-4 h-4 mr-1 text-slate-400" />
                           Client / Owner
                        </label>
                        <input
                          type="text"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                        />
                      </div>
                    </div>
  
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                         <AlignLeft className="w-4 h-4 mr-1 text-slate-400" />
                         Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 resize-y"
                        placeholder="Provide a detailed description of the project scope and objectives..."
                      />
                    </div>
                  </div>
  
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    {updateMutation.isSuccess && (
                       <div className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center">
                         <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                         Changes saved successfully
                       </div>
                    )}
                    <div className={updateMutation.isSuccess ? "" : "ml-auto"}>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center shadow-md shadow-blue-500/20 transition-all active:scale-95"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5 mr-2" />
                        )}
                        {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
  
        </div>
      </div>
    </DashboardLayout>
  );
}
