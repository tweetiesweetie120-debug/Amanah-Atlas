import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Public pages
import Landing from '@/pages/Landing';

// App pages (protected)
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import Opportunities from '@/pages/Opportunities';
import OpportunityDetail from '@/pages/OpportunityDetail';
import VolunteerLog from '@/pages/VolunteerLog';
import AdviceCorner from '@/pages/AdviceCorner';
import AdvicePostDetail from '@/pages/AdvicePostDetail';
import ResumeGenerator from '@/pages/ResumeGenerator';
import Profile from '@/pages/Profile';
import SentMessages from '@/pages/SentMessages';
import GoalsChatbot from '@/pages/GoalsChatbot';
import GoalExchange from '@/pages/GoalExchange';
import SkillSwap from '@/pages/SkillSwap';
import Community from '@/pages/Community';
import PublicProfile from '@/pages/PublicProfile';
import Messages from '@/pages/Messages';
import InternshipSources from '@/pages/InternshipSources';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                <Route path="/volunteer-log" element={<VolunteerLog />} />
                <Route path="/advice-corner" element={<AdviceCorner />} />
                <Route path="/advice-corner/:id" element={<AdvicePostDetail />} />
                <Route path="/resume-generator" element={<ResumeGenerator />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/sent-messages" element={<SentMessages />} />
                <Route path="/goals-chatbot" element={<GoalsChatbot />} />
                <Route path="/goal-exchange" element={<GoalExchange />} />
                <Route path="/skill-swap" element={<SkillSwap />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/:userId" element={<PublicProfile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/internship-sources" element={<InternshipSources />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
