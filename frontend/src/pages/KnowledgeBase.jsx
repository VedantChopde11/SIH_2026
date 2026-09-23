import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { BookOpen, UploadCloud, Search, FileText, Download, Loader2, Building2, X } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getDocuments, uploadDocument } from '../api/documents';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

export default function KnowledgeBase() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newDocCategory, setNewDocCategory] = useState('Standard Operating Procedure');

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getDocuments(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const uploadMutation = useMutation({
    mutationFn: async (docData) => {
      const token = await getToken();
      return uploadDocument(token, activeProject.id, docData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', activeProject.id]);
      setShowUploadModal(false);
      setSelectedFile(null);
    },
    onError: (err) => {
      alert('Error uploading document: ' + err.message);
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', newDocCategory);

    uploadMutation.mutate(formData);
  };

  const filteredDocs = documents?.filter(doc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.file_name?.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
            Knowledge Base
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">Manage project standards, SOPs, and reference documents.</p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to access its knowledge base.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <div className="mt-0.5">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Error Loading Documents</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 flex items-center shadow-md shadow-blue-500/20 w-full sm:w-auto justify-center transition-all"
              >
                <UploadCloud className="w-5 h-5 mr-2" />
                Upload Document
              </button>
            </div>
  
            <div className="flex-1 overflow-x-auto p-6 bg-slate-50/30">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                   </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Documents Found</h3>
                  <p className="text-slate-500 font-medium">Try adjusting your search or click 'Upload Document' to add one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between hover:border-blue-200">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                            {doc.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors" title={doc.file_name}>
                          {doc.file_name}
                        </h4>
                        <div className="text-sm text-slate-500 font-medium mb-6">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <a 
                        href={`http://localhost:5000${doc.file_path}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all flex items-center justify-center shadow-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
  
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                   <UploadCloud className="w-5 h-5 mr-2 text-blue-600" />
                   Upload Document
                </h3>
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors bg-slate-50">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                        <div className="flex text-sm text-slate-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              required
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                           {selectedFile ? selectedFile.name : "PDF, DOCX, XLSX up to 10MB"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-slate-700 shadow-sm transition-all"
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                    >
                      <option>Standard Operating Procedure</option>
                      <option>Design Drawing</option>
                      <option>Technical Specification</option>
                      <option>Safety Guidelines</option>
                      <option>General</option>
                    </select>
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowUploadModal(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadMutation.isPending || !selectedFile}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-md shadow-blue-500/20 transition-all disabled:shadow-none"
                  >
                    {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
