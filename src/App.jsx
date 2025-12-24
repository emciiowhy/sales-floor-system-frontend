import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AgentSetup from './pages/AgentSetup';
import Dashboard from './pages/Dashboard';
import PassUpForm from './pages/PassUpForm';
import Leaderboard from './pages/Leaderboard';
import { DarkModeProvider } from './hooks/useDarkMode';

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
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/passup" 
            element={
              <ProtectedRoute>
                <PassUpForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;