import React, { Suspense, lazy } from 'react';
// Fix: Replaced BrowserRouter with HashRouter to fix routing in the sandboxed environment.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import BottomNav from './components/navigation/BottomNav.tsx';
import HomePage from './pages/HomePage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import AuthForm from './components/auth/AuthForm.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';
import LearningCenterPage from './pages/LearningCenterPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import InventoryPage from './pages/InventoryPage.tsx';
import DiaryPage from './pages/DiaryPage.tsx';
const SparkApp = lazy(() => import('./spark/App.tsx'));

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          {/* Add bottom padding so content isn't hidden behind the sticky BottomNav on mobile */}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthForm mode="login" />} />
              <Route path="/register" element={<AuthForm mode="register" />} />
              <Route path="/learning/:slug" element={<LearningCenterPage />} />
              <Route path="/checkout/:plan" element={<CheckoutPage />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute role="Super Administrator">
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />

              <Route 
                path="/diary" 
                element={
                  <ProtectedRoute>
                    <DiaryPage />
                  </ProtectedRoute>
                }
              />

              {/* Spark module route (lazy-loaded) */}
              <Route
                path="/spark/*"
                element={
                  <Suspense fallback={<div className="py-12 text-center text-slate-500">Loading Spark…</div>}>
                    <SparkApp />
                  </Suspense>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          {/* Sticky mobile bottom menu */}
          <BottomNav />
          <Footer />
        </div>
      </AuthProvider>
    </HashRouter>
  );
}
