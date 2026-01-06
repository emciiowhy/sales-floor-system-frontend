import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { lazy, Suspense } from 'react';
import AgentSetup from './pages/AgentSetup';
import LoadingSplash from './components/LoadingSplash';
import { DarkModeProvider } from './hooks/useDarkMode';

// Lazy load routes for code splitting and faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PassUpForm = lazy(() => import('./pages/PassUpForm'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AgentDetail = lazy(() => import('./pages/AgentDetail'));

function ProtectedRoute({ children }) {
  const agentId = localStorage.getItem('agentId');
  
  if (!agentId) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<AgentSetup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSplash />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/passup" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSplash />}>
                  <PassUpForm />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSplash />}>
                  <Leaderboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agent/:agentId" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSplash />}>
                  <AgentDetail />
                </Suspense>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;