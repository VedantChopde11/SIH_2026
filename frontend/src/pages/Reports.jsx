import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { fetchReports, retryReport } from "../api/reports";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  FileText,
  Clock,
  CheckCircle,
  UploadCloud,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProject } from "../context/ProjectContext";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const Reports = () => {
  const { getToken } = useAuth();
  const { activeProject } = useProject();

  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reports", activeProject?.id],
    queryFn: async () => {
      const token = await getToken();
      return fetchReports(token, activeProject.id);
    },
    enabled: !!activeProject?.id,
  });

  const [isRetrying, setIsRetrying] = React.useState(null);

  const handleRetry = async (e, reportId) => {
    e.stopPropagation();
    if (!activeProject?.id) return;

    setIsRetrying(reportId);
    try {
      const token = await getToken();
      await retryReport(token, activeProject.id, reportId);
      refetch();
    } catch (error) {
      console.error(error);
      alert("Retry failed: " + error.message);
      refetch();
    } finally {
      setIsRetrying(null);
    }
  };

  const handleDownload = async (e, report) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/projects/${activeProject.id}/reports/${report.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processed":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "Uploaded":
      case "Processing":
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Processed":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Processed
          </span>
        );
      case "Uploaded":
      case "Processing":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            Processing
          </span>
        );
      case "Quota Reached":
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            Quota Reached
          </span>
        );
      case "Failed AI":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Failed AI
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Field Reports
            </h1>
            <p className="text-slate-500 mt-1">
              Manage and view all uploaded field reports for this project.
            </p>
          </div>
          <Link
            to="/ingestion"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
          >
            <UploadCloud className="w-5 h-5" />
            Upload New Report
          </Link>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              No Active Project
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
              Please select a project from the sidebar to view its field
              reports.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium text-lg"
            >
              Select a Project
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-slate-500 font-medium">
              Loading reports...
            </span>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Reports</h3>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto">
            <div className="bg-blue-50 w-20 h-20 border border-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              No Reports Yet
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
              Upload your first construction field report to extract physical
              progress events and automatically update your schedule.
            </p>
            <Link
              to="/ingestion"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20 text-lg"
            >
              <UploadCloud className="w-5 h-5" />
              Upload Report
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date Uploaded
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-blue-50/50 transition-colors group cursor-default"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-blue-100">
                            <FileText className="w-5 h-5" />
                          </div>
                          <a
                            href="#"
                            onClick={(e) => handleDownload(e, report)}
                            className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors hover:underline"
                          >
                            {report.file_name}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {report.file_type === "application/pdf"
                          ? "PDF"
                          : report.file_type ===
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            ? "DOCX"
                            : report.file_type.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {new Date(report.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {report.uploaded_by === "system"
                          ? "System"
                          : report.uploaded_by}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          {(report.status === "Quota Reached" ||
                            report.status === "Failed AI") && (
                            <button
                              onClick={(e) => handleRetry(e, report.id)}
                              disabled={isRetrying === report.id}
                              className="ml-2 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center shadow-sm disabled:bg-slate-300"
                            >
                              {isRetrying === report.id
                                ? "Retrying..."
                                : "Retry AI"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
