import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.js';
import { AdminRoute } from '../components/layout/AdminRoute.js';
import { PageLoader } from '../components/common/PageLoader.js';

// Route Lazy Loading & Code Splitting
const LandingPage = lazy(() => import('../pages/LandingPage.js').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage.js').then((m) => ({ default: m.OnboardingPage })));
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage.js').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })));
const LearningPathPage = lazy(() => import('../pages/LearningPathPage.js').then((m) => ({ default: m.LearningPathPage })));
const SkillAnalysisPage = lazy(() => import('../pages/SkillAnalysisPage.js').then((m) => ({ default: m.SkillAnalysisPage })));
const AIMentorPage = lazy(() => import('../pages/AIMentorPage.js').then((m) => ({ default: m.AIMentorPage })));
const ExplorePage = lazy(() => import('../pages/ExplorePage.js').then((m) => ({ default: m.ExplorePage })));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage.js').then((m) => ({ default: m.CourseDetailPage })));
const ProgressPage = lazy(() => import('../pages/ProgressPage.js').then((m) => ({ default: m.ProgressPage })));
const PairProgrammerPage = lazy(() => import('../pages/PairProgrammerPage.js').then((m) => ({ default: m.PairProgrammerPage })));
const RecruiterProfilePage = lazy(() => import('../pages/RecruiterProfilePage.js').then((m) => ({ default: m.RecruiterProfilePage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage })));

const HelpPage = lazy(() => import('../pages/HelpPage.js').then((m) => ({ default: m.HelpPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.js'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* World-Class SaaS Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />


        {/* Public / Shareable Recruiter Profile Route */}
        <Route path="/profile" element={<RecruiterProfilePage />} />
        <Route path="/profile/:username" element={<RecruiterProfilePage />} />
        <Route path="/recruiter-view" element={<RecruiterProfilePage />} />

        {/* Admin Portal Login via /back */}
        <Route path="/back" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/back/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>

        {/* Protected Learner App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/learning-path" element={<LearningPathPage />} />
            <Route path="/skills" element={<SkillAnalysisPage />} />
            <Route path="/ai-mentor" element={<AIMentorPage />} />
            <Route path="/pair-programmer" element={<PairProgrammerPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/courses/:slug" element={<CourseDetailPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
        </Route>



        {/* 404 — Proper Not Found page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};


