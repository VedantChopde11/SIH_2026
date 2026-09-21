import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAdvancedAnalytics } from '../api/analytics';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';
import { Loader2, TrendingUp, AlertTriangle, Activity, Building2, CheckCircle } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { getToken } = useAuth();
  const { activeProject } = useProject();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['advanced-analytics', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getAdvancedAnalytics(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
            Advanced Analytics
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">Deep dive into project trends, performance, and delays.</p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view advanced analytics.</p>
            <Link to="/projects" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg">
              Select a Project
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Analytics</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Trend Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Progress Reporting Trend</h3>
                <div className="h-72 w-full min-h-[300px]">
                  {analytics.progressTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.progressTrend.length === 1 ? [
                        { date: new Date(new Date(analytics.progressTrend[0].date).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), events_count: 0 },
                        ...analytics.progressTrend
                      ] : analytics.progressTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis 
                          tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} 
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                        />
                        <RechartsTooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600}}
                          cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}}
                        />
                        <Legend wrapperStyle={{paddingTop: '20px', fontWeight: 600}} />
                        <Line type="monotone" name="Events Reported" dataKey="events_count" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                       <Activity className="w-10 h-10 mb-3 text-slate-300" />
                       <span className="font-medium">No progress events logged yet</span>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Overall Activity Status</h3>
                <div className="h-72 w-full min-h-[300px]">
                  {analytics.activityStatus?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.activityStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          innerRadius={70}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          stroke="none"
                        >
                          {analytics.activityStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                           contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600}}
                        />
                        <Legend wrapperStyle={{fontWeight: 600}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <PieChart className="w-10 h-10 mb-3 text-slate-300" />
                      <span className="font-medium">No activities found</span>
                    </div>
                  )}
                </div>
              </div>
  
            </div>
  
            {/* Top Delayed Activities */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Top Delayed Activities</h3>
              </div>
              
              <div className="overflow-x-auto">
                {analytics.topDelayed?.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Activity Name</th>
                        <th className="px-6 py-4">Planned Start</th>
                        <th className="px-6 py-4">Actual Start</th>
                        <th className="px-6 py-4 text-right">Delay (Days)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {analytics.topDelayed.map((act, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-sm text-slate-900 font-bold group-hover:text-blue-700 transition-colors">
                            {act.activity_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                            {new Date(act.planned_start).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                            {new Date(act.actual_start).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                              {act.delay_days}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">On Track!</h3>
                    <p className="text-slate-500 font-medium">No delayed activities found. Project is progressing as planned.</p>
                  </div>
                )}
              </div>
            </div>
  
          {/* Not Started Activities */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center mr-3">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Pending Activities (Not Started)</h3>
            </div>
            
            <div className="overflow-x-auto">
              {analytics.notStarted?.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Activity Name</th>
                      <th className="px-6 py-4">Planned Start</th>
                      <th className="px-6 py-4 text-right">Duration (Days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {analytics.notStarted.map((act, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold group-hover:text-blue-700 transition-colors">
                          {act.activity_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {act.planned_start ? new Date(act.planned_start).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {act.duration}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">All Caught Up!</h3>
                  <p className="text-slate-500 font-medium">There are no pending activities. Everything has been started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
