import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, BrainCircuit, ClipboardCheck, Activity, Building2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMetrics } from '../api/analytics';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

const COLORS = ['#10b981', '#ef4444', '#94a3b8']; // Green, Red, Slate

export default function Dashboard() {
  const { getToken } = useAuth();
  const { activeProject } = useProject();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getMetrics(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const pieData = metrics ? [
    { name: 'On Time / Ahead', value: metrics.scheduleHealth.onTime },
    { name: 'Delayed', value: metrics.scheduleHealth.delayed },
    { name: 'Not Started', value: metrics.scheduleHealth.notStarted }
  ] : [];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time execution intelligence and progress overview.</p>
      </div>

      {!activeProject ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ConstructIQ</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select an active project from the dropdown in the sidebar to view its real-time analytics.</p>
          <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
            Manage Projects
          </Link>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading project metrics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reports Processed</h3>
                <p className="text-4xl font-extrabold text-slate-900">{metrics?.reportsProcessed || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FileText className="w-7 h-7" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extracted Events</h3>
                <p className="text-4xl font-extrabold text-slate-900">{metrics?.extractedEvents || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <BrainCircuit className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending Reviews</h3>
                <p className="text-4xl font-extrabold text-amber-500">{metrics?.pendingReviews || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <ClipboardCheck className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Health Donut Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Schedule Health (Activities)</h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Activities']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions / Activity Feed Placeholder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Execution Intelligence Pipeline</h3>
              <div className="space-y-4">
                <Link to="/ingestion" className="block p-5 bg-slate-50 hover:bg-blue-50/50 text-slate-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-all group">
                  <div className="flex items-center mb-1">
                    <FileText className="w-5 h-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-900">1. Upload Daily Report</span>
                  </div>
                  <div className="text-sm text-slate-500 ml-7">Navigate to Data Ingestion to upload the latest PDF report from the field engineer.</div>
                </Link>
                
                <Link to="/matching" className="block p-5 bg-slate-50 hover:bg-purple-50/50 text-slate-700 rounded-xl border border-slate-200 hover:border-purple-200 transition-all group">
                  <div className="flex items-center mb-1">
                    <BrainCircuit className="w-5 h-5 text-purple-500 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-900">2. Run AI Matching Engine</span>
                  </div>
                  <div className="text-sm text-slate-500 ml-7">Map newly extracted events to your baseline P6 schedule activities automatically.</div>
                </Link>
                
                <Link to="/review-center" className="block p-5 bg-slate-50 hover:bg-amber-50/50 text-slate-700 rounded-xl border border-slate-200 hover:border-amber-200 transition-all group">
                  <div className="flex items-center mb-1">
                    <ClipboardCheck className="w-5 h-5 text-amber-500 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-900">3. Review & Approve</span>
                  </div>
                  <div className="text-sm text-slate-500 ml-7">Check the Review Center to approve AI matches and update real-time progress.</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
