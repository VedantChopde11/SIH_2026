import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Network,
  UploadCloud,
  FileText,
  BrainCircuit,
  GitMerge,
  ClipboardCheck,
  Activity,
  BarChart3,
  BookOpen,
  History,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Overview' },
  { name: 'Projects', href: '/projects', icon: FolderKanban, category: 'Overview' },
  { name: 'Schedule', href: '/schedule', icon: Calendar, category: 'Planning' },
  { name: 'Work Breakdown', href: '/wbs', icon: Network, category: 'Planning' },
  { name: 'Data Sources', href: '/ingestion', icon: UploadCloud, category: 'Execution' },
  { name: 'Extracted Events', href: '/ai-events', icon: BrainCircuit, category: 'Execution' },
  { name: 'Smart Matching', href: '/matching', icon: GitMerge, category: 'Execution' },
  { name: 'Review', href: '/review-center', icon: ClipboardCheck, category: 'Execution' },
  { name: 'Progress Tracking', href: '/live-progress', icon: Activity, category: 'Execution' },
  { name: 'Reports', href: '/reports', icon: FileText, category: 'Insights' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Insights' },
  { name: 'Documents', href: '/knowledge-base', icon: BookOpen, category: 'Insights' },
  { name: 'Audit Logs', href: '/audit', icon: History, category: 'System' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'System' },
];

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { activeProject, setActiveProject } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const token = await getToken();
        if (token) {
          await fetch('http://localhost:5000/api/users/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (err) {
        console.error('Failed to sync user:', err);
      }
    };
    syncUser();
  }, [getToken]);

  const searchResults = globalSearch
    ? navigation.filter(item => item.name.toLowerCase().includes(globalSearch.toLowerCase()))
    : [];

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken();
      return getProjects(token);
    }
  });

  // Group navigation
  const categories = ['Overview', 'Planning', 'Execution', 'Insights', 'System'];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/main_logo.png" alt="ConstructIQ Logo" className="h-8 w-8 rounded-lg" />
            <h1 className="text-xl font-bold text-white tracking-tight">Construct<span className="text-blue-500">IQ</span></h1>
          </Link>
        </div>

        {/* Project Switcher in Sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Project</p>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
            >
              <div className="flex flex-col items-start truncate pr-2">
                <span className="text-sm font-medium truncate w-full text-left">
                  {activeProject ? activeProject.name : 'Select a Project'}
                </span>
                {activeProject && (
                  <span className="text-xs text-blue-400 font-medium">{activeProject.project_code}</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 text-sm text-slate-400 text-center">Loading...</div>
                ) : projects && projects.length > 0 ? (
                  <div className="py-1">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProject(p);
                          setIsDropdownOpen(false);
                          if (location.pathname === '/projects') navigate('/dashboard');
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm flex flex-col hover:bg-slate-700 transition-colors",
                          activeProject?.id === p.id ? "bg-blue-600/10 border-l-2 border-blue-500 text-white" : "text-slate-300"
                        )}
                      >
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-xs text-slate-500">{p.project_code}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-slate-400 text-center">No projects found.</div>
                )}
                <div className="border-t border-slate-700 p-1">
                  <Link
                    to="/projects"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full block text-center px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                  >
                    + Create Project
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-6 px-3">
            {categories.map(category => (
              <div key={category}>
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{category}</h3>
                <div className="space-y-1">
                  {navigation.filter(item => item.category === category).map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
                            'flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-200'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User profile bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9 border-2 border-slate-700" } }} />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">My Account</p>
              <p className="text-xs text-slate-500 truncate">Manage settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex-1 flex items-center">
            {/* Mobile menu button could go here */}
            <div className="w-full max-w-md relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                ref={searchInputRef}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
                placeholder="Search modules and pages (Press '/')"
                type="search"
              />

              {/* Search Dropdown */}
              {showSearchDropdown && globalSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(result => (
                        <Link
                          key={result.name}
                          to={result.href}
                          onClick={() => {
                            setGlobalSearch('');
                            setShowSearchDropdown(false);
                          }}
                          className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <result.icon className="h-5 w-5 text-slate-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{result.name}</p>
                            <p className="text-xs text-slate-500">{result.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No results found for "{globalSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6 space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
              >
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                <Bell className="h-5 w-5" />
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-slate-900">New field report processed</p>
                      <p className="text-xs text-slate-500 mt-0.5">Foundations_Weekly.pdf was analyzed</p>
                      <p className="text-[10px] text-slate-400 mt-1">2 mins ago</p>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-slate-900">High-confidence match</p>
                      <p className="text-xs text-slate-500 mt-0.5">AI matched 5 new activities in schedule</p>
                      <p className="text-[10px] text-slate-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-center border-t border-slate-100 bg-slate-50">
                    <Link to="/audit" onClick={() => setShowNotifications(false)} className="text-xs font-medium text-blue-600 hover:underline">View all activity</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="md:hidden">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
