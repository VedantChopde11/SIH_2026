import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProjectProvider } from './context/ProjectContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Schedule from './pages/Schedule';
import Ingestion from './pages/Ingestion';
import AIEvents from './pages/AIEvents';
import WBS from './pages/WBS';
import Matching from './pages/Matching';
import ReviewCenter from './pages/ReviewCenter';
import LiveProgress from './pages/LiveProgress';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import KnowledgeBase from './pages/KnowledgeBase';
import Audit from './pages/Audit';
import Settings from './pages/Settings';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient();

const EmptyPage = ({ title }) => {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-500">This module is under development.</p>
    </div>
  );
};

import DashboardLayout from './layouts/DashboardLayout';

const withLayout = (title) => (
  <DashboardLayout>
    <EmptyPage title={title} />
  </DashboardLayout>
);

function App() {
  if (!clerkPubKey) {
    return <div>Missing Clerk Publishable Key</div>;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              
              <Route path="/sign-in/*" element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
                </div>
              } />
              <Route path="/sign-up/*" element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                  <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
                </div>
              } />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<SignedIn><Dashboard /></SignedIn>} />
              <Route path="/projects" element={<SignedIn><Projects /></SignedIn>} />
              <Route path="/schedule" element={<SignedIn><Schedule /></SignedIn>} />
              <Route path="/wbs" element={<SignedIn><WBS /></SignedIn>} />
              <Route path="/ingestion" element={<SignedIn><Ingestion /></SignedIn>} />
              <Route path="/reports" element={<SignedIn><Reports /></SignedIn>} />
              <Route path="/ai-events" element={<SignedIn><AIEvents /></SignedIn>} />
              <Route path="/matching" element={<SignedIn><Matching /></SignedIn>} />
              <Route path="/review-center" element={<SignedIn><ReviewCenter /></SignedIn>} />
              <Route path="/live-progress" element={<SignedIn><LiveProgress /></SignedIn>} />
              <Route path="/analytics" element={<SignedIn><Analytics /></SignedIn>} />
              <Route path="/knowledge-base" element={<SignedIn><KnowledgeBase /></SignedIn>} />
              <Route path="/audit" element={<SignedIn><Audit /></SignedIn>} />
              <Route path="/settings" element={<SignedIn><Settings /></SignedIn>} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </ProjectProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
