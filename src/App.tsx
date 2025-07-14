
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/toaster';
import Navigation from './components/Navigation';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Editor from './pages/Editor';
import Community from './pages/Community';
import WorkingShadersPage from './pages/WorkingShadersPage';
import NotFound from './pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Navigation />
              <main>
                <Routes>
                  <Route path="/" element={<WorkingShadersPage />} />
                  <Route path="/home" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/editor" element={<Editor />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/shaders" element={<WorkingShadersPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
