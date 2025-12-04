import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabaseConto } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import Search from '@/pages/Search';
import LeadDetail from '@/pages/LeadDetail';
import Login from '@/pages/Login';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controlla la sessione attuale
    supabaseConto.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ascolta i cambiamenti di autenticazione
    const { data: { subscription } } = supabaseConto.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading iniziale
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bylo-blue"></div>
      </div>
    );
  }

  // Non autenticato → mostra Login
  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  // Autenticato → mostra App
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/lead/:id" element={<LeadDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;