import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Building2, ChevronRight, FileUp } from 'lucide-react';
import { uploadReport, fetchReports, retryReport } from '../api/reports';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useProject } from '../context/ProjectContext';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';

const Ingestion = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { activeProject } = useProject();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: string, data?: any }
  
  useEffect(() => {
    if (activeProject?.id) {
      loadReports(activeProject.id);
      setUploadStatus(null);
      setFile(null);
    } else {
      setReports([]);
    }
  }, [activeProject]);

  const loadReports = async (projectId) => {
    try {
      const token = await getToken();
      const data = await fetchReports(token, projectId);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !activeProject?.id) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const token = await getToken();
      const uploaderName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'system';
      const response = await uploadReport(token, activeProject.id, file, uploaderName);
      setUploadStatus({
        type: 'success',
        message: `Successfully processed report! Extracted ${response.extractedCount} events.`,
        data: response
      });
      setFile(null);
      loadReports(activeProject.id); // Refresh list
      
      // Give a brief delay for user to see success, then navigate
      setTimeout(() => {
        navigate('/ai-events');
      }, 1500);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to upload and process report.'
      });
      loadReports(activeProject.id); // Refresh list to show failed report
    } finally {
      setIsUploading(false);
    }
  };

  const [isRetrying, setIsRetrying] = useState(null);

  const handleRetry = async (e, reportId) => {
    e.stopPropagation();
    if (!activeProject?.id) return;
    
    setIsRetrying(reportId);
    setUploadStatus(null);
    
    try {
      const token = await getToken();
      const response = await retryReport(token, activeProject.id, reportId);
      setUploadStatus({
        type: 'success',
        message: `Successfully retried report! Extracted ${response.extractedCount} events.`,
        data: response
      });
      loadReports(activeProject.id);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to retry report.'
      });
      loadReports(activeProject.id);
    } finally {
      setIsRetrying(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Ingestion</h1>
        <p className="text-slate-500 mt-1">Upload unstructured field reports (PDF, DOCX, TXT) to automatically extract structured construction events via AI.</p>
      </div>

      {!activeProject ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to start uploading and processing field reports.</p>
          <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
            Select a Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upload Area */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm h-full">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <FileUp className="w-6 h-6 mr-2 text-blue-500" />
                Upload Field Report
              </h2>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 hover:bg-slate-50 transition-colors bg-white group cursor-pointer relative text-center">
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileChange} 
                  accept=".pdf,.txt,.docx,.csv" 
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Click or drag file to this area to upload</h3>
                  <p className="text-slate-500 mb-2">Support for a single or bulk upload.</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">PDF, DOCX, TXT up to 10MB</p>
                </div>
              </div>

              {file && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 mr-3 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Processing with AI Engine...
                    </>
                  ) : (
                    'Extract Events with AI'
                  )}
                </button>
              </div>

              {uploadStatus && (
                <div className={`mt-6 p-4 rounded-xl flex items-start ${uploadStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`text-sm font-bold ${uploadStatus.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                      {uploadStatus.type === 'success' ? 'Processing Complete' : 'Processing Failed'}
                    </h4>
                    <p className={`text-sm mt-1 ${uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {uploadStatus.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Previous Uploads */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Processed Reports
                </h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{reports.length} Total</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                {reports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">No reports processed yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Upload a report to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div 
                        key={report.id} 
                        onClick={() => report.status === 'Processed' && navigate('/ai-events')}
                        className={`group p-4 bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-center justify-between ${
                          report.status === 'Processed' ? 'cursor-pointer hover:border-blue-200 hover:bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center overflow-hidden">
                          <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center text-blue-500 mr-3 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{report.file_name}</p>
                            <div className="flex items-center text-xs text-slate-500 mt-0.5">
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              <span className="mx-1.5">•</span>
                              <span className={`font-medium flex items-center ${
                                report.status === 'Processed' ? 'text-green-600' : 
                                report.status === 'Processing' ? 'text-blue-600' :
                                report.status === 'Quota Reached' ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {report.status === 'Processed' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : report.status === 'Processing' ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {report.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {(report.status === 'Quota Reached' || report.status === 'Failed AI') && (
                            <button 
                              onClick={(e) => handleRetry(e, report.id)}
                              disabled={isRetrying === report.id}
                              className="mr-3 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center shadow-sm disabled:bg-slate-300"
                            >
                              {isRetrying === report.id ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Retrying...</>
                              ) : (
                                'Retry AI'
                              )}
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {reports.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                  <Link to="/reports" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all reports in detail &rarr;</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
};

export default Ingestion;
