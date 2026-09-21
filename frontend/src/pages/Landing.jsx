import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import { HardHat, Activity, BrainCircuit, ArrowRight, ClipboardCheck, BarChart3, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/main_logo.png" alt="ConstructIQ Logo" className="w-10 h-10 rounded-md" />
              <span className="text-4xl font-bold text-slate-900 tracking-tight">Construct<span className="text-blue-600">IQ</span></span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block transition-colors">How it Works</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block transition-colors">Features</a>

              <ClerkLoading>
                <div className="flex items-center space-x-3">
                  <Link to="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                  <Link to="/sign-up" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all">
                    Get Started
                  </Link>
                </div>
              </ClerkLoading>
              <ClerkLoaded>
                <SignedOut>
                  <div className="flex items-center space-x-3">
                    <Link to="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                    <Link to="/sign-up" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all">
                      Get Started
                    </Link>
                  </div>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mr-4">Go to Dashboard</Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </ClerkLoaded>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Turn Field Reports Into<span className="text-blue-600 inline-block">Project Progress.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              ConstructIQ uses AI to extract work from daily field reports,match it to scheduled activities, and turn field updatesinto accurate, actionable project progress.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <ClerkLoading>
                <Link to="/sign-up" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Start Building Free <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                  See How It Works
                </a>
              </ClerkLoading>
              <ClerkLoaded>
                <SignedOut>
                  <Link to="/sign-up" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    Start Building Free <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                  </Link>
                  <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    See How It Works
                  </a>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                    Open Dashboard <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                  </Link>
                </SignedIn>
              </ClerkLoaded>
            </div>
          </div>
        </div>
      </main>

      {/* How it Works / Workflow */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">From PDF to Progress in Seconds</h2>
            <p className="mt-4 text-lg text-slate-500">A seamless pipeline powering your construction management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <HardHat className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">1. Ingest Data</h3>
              <p className="mt-2 text-slate-500 text-sm">Upload daily reports, PDFs, Excel sheets, or site diaries directly into ConstructIQ.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">2.Extract Construction Events</h3>
              <p className="mt-2 text-slate-500 text-sm">AI extracts activities, quantities, locations, disciplines, dates, and other relevant field information.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">3. Match & Validate</h3>
              <p className="mt-2 text-slate-500 text-sm">ConstructIQ finds the most relevant scheduled L5/L6 activities, scores candidates, and validates the match against project constraints.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-green-100">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">4. Review & Track Progress</h3>
              <p className="mt-2 text-slate-500 text-sm">Planners review AI recommendations, approve or modify matches, and turn validated field updates into actual project progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About / Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Enterprise-Grade Construction Intelligence</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Construction teams work across schedules, field reports, site updates, and fragmented project data. ConstructIQ connects these sources to create a single, traceable view of what is planned, what is happening on site, and what has actually been completed.
              </p>

              <ul className="space-y-6">
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-slate-900">Live Progress Tracking</h4>
                    <p className="mt-1 text-slate-500 text-sm">Monitor actual construction progress against planned L5/L6 activities and WBS structure.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-slate-900">Explainable AI Matching</h4>
                    <p className="mt-1 text-slate-500 text-sm">Match field-reported work to scheduled activities with transparent scores, evidence, and validation.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                      <HardHat className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-slate-900">Human-in-the-Loop Control</h4>
                    <p className="mt-1 text-slate-500 text-sm">Review AI recommendations, accept matches, change activities, or mark events as unmatched.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-slate-900">Enterprise-Ready Data</h4>
                    <p className="mt-1 text-slate-500 text-sm">Secure authentication, structured PostgreSQL data, and a complete audit trail for every important decision.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* <div className="mt-16 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 transform transition-transform hover:-translate-y-1 duration-500">
                <div className="aspect-w-16 aspect-h-9 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {/* Placeholder for dashboard mockup */}
            {/* <div className="p-4 w-full h-full flex flex-col gap-3">
                    <div className="h-8 bg-slate-200 rounded-md w-1/3 mb-2 animate-pulse"></div>
                    <div className="flex gap-4 mb-4">
                      <div className="h-24 bg-blue-50 border border-blue-100 rounded-lg flex-1"></div>
                      <div className="h-24 bg-green-50 border border-green-100 rounded-lg flex-1"></div>
                      <div className="h-24 bg-purple-50 border border-purple-100 rounded-lg flex-1"></div>
                    </div>
                    <div className="flex-1 bg-slate-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="mt-16 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100 transform transition-transform hover:-translate-y-1 duration-500">
                <div className="rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src="/landing_image.png"
                    alt="ConstructIQ project intelligence dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to transform your project execution?</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">Join the teams using ConstructIQ to connect the field to the office.</p>
          <div className="mt-10 flex justify-center">
            <ClerkLoading>
              <Link to="/sign-up" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all">
                Get Started Now
              </Link>
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <Link to="/sign-up" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all">
                  Get Started Now
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all">
                  Go to Dashboard
                </Link>
              </SignedIn>
            </ClerkLoaded>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tracking-tight mb-4">Construct<span className="text-blue-500">IQ</span></span>
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} ConstructIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
