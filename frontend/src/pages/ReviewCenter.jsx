import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getReviewEvents, submitReview, approveAllEvents } from '../api/events';
import { useProject } from '../context/ProjectContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { ClipboardCheck, MapPin, Calendar, Activity, CheckCircle2, AlertCircle, Building2, ChevronRight, Check, X, ShieldAlert } from 'lucide-react';

function ReviewCenter() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { activeProject } = useProject();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['review-events', activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return getReviewEvents(token, activeProject.id);
    },
    enabled: !!activeProject?.id
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ eventId, matchId, activityId, status, comment }) => {
      const token = await getToken();
      return submitReview(token, activeProject.id, eventId, { matchId, activityId, status, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-events', activeProject?.id] });
    },
    onError: (err) => {
      alert(`Error submitting review: ${err.message}`);
    }
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return approveAllEvents(token, activeProject.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['review-events', activeProject?.id] });
      alert(`Successfully approved ${data.count} events!`);
    },
    onError: (err) => {
      alert(`Error bulk approving: ${err.message}`);
    }
  });

  const handleReview = (eventId, matchId, activityId, status) => {
    reviewMutation.mutate({ eventId, matchId, activityId, status, comment: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
            <ClipboardCheck className="h-8 w-8 mr-3 text-orange-600" />
            Review Center
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Review and approve AI-generated matches between field events and P6 schedule activities before they are permanently linked.
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Project</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Please select a project from the sidebar to view pending matches for review.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Reviews</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : events?.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">There are no pending matches to review. Run the AI Matching Engine to generate new matches.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">You have <strong>{events.length}</strong> events pending human review. Approving a match will link the field event to the schedule activity.</p>
            </div>
            
            {events?.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row group transition-shadow hover:shadow-md">
                
                {/* Left Side: Field Event */}
                <div className="lg:w-2/5 bg-slate-50/50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                      Field Event
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Action & Object</span>
                      <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        {event.action} <span className="text-slate-600 font-medium">{event.object}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3 h-3" /> Location
                        </span>
                        <span className="font-medium text-slate-800">{event.location || '-'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Discipline</span>
                        <span className="font-medium text-slate-800">{event.discipline || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3 h-3" /> Date
                        </span>
                        <span className="font-medium text-slate-800">{event.actual_start ? new Date(event.actual_start).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                        <span className="font-medium text-slate-800">{event.status || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Extracted From</span>
                      <span className="text-sm italic text-slate-600 font-medium">{event.source_text || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Proposed Matches */}
                <div className="lg:w-3/5 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200 uppercase tracking-wide">
                      AI Proposed Matches
                    </span>
                  </div>
                  
                  {!event.candidates || event.candidates.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 italic">
                      No matches found for this event in the schedule.
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      {event.candidates.map((candidate, idx) => {
                        if (!candidate) return null;
                        const confidencePercent = Math.round(candidate.total_score * 100);
                        const isHighConfidence = confidencePercent > 70;
                        const isMedConfidence = confidencePercent > 40 && confidencePercent <= 70;
                        
                        return (
                          <div 
                            key={candidate.match_id} 
                            className={`p-5 rounded-2xl border transition-all ${
                              idx === 0 
                                ? 'border-pink-200 bg-pink-50/30 ring-1 ring-pink-100 shadow-sm' 
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                                    {candidate.activity_id_original}
                                  </span>
                                  <span className="font-bold text-slate-900 text-lg">{candidate.activity_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Confidence:</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${isHighConfidence ? 'bg-emerald-500' : isMedConfidence ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${confidencePercent}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-sm font-bold ${isHighConfidence ? 'text-emerald-700' : isMedConfidence ? 'text-amber-700' : 'text-red-700'}`}>
                                      {confidencePercent}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <button 
                                  onClick={() => handleReview(event.id, candidate.match_id, candidate.activity_id, 'Approved')}
                                  disabled={reviewMutation.isPending}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                  <Check className="w-5 h-5" />
                                  Approve
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => handleReview(event.id, null, null, 'Rejected')}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject All / Ignore Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {events?.length > 0 && (
          <div className="flex justify-end pt-4 pb-10">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to approve the top AI candidate for ALL pending events?')) {
                  bulkApproveMutation.mutate();
                }
              }}
              disabled={bulkApproveMutation.isPending || reviewMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {bulkApproveMutation.isPending ? 'Approving...' : 'Approve All Top Candidates'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ReviewCenter;
