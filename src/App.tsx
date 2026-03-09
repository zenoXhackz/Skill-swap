import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, Search, User as UserIcon } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SkillList from './components/SkillList';
import Chat from './components/Chat';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        {user && (
          <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link to="/" className="text-2xl font-serif italic font-bold text-stone-800">SkillSwap</Link>
                <div className="flex items-center gap-6">
                  <Link to="/skills" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                    <Search size={20} />
                    <span className="hidden sm:inline">Browse</span>
                  </Link>
                  <Link to="/dashboard" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
                    <UserIcon size={20} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-stone-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/auth" element={!user ? <Auth onAuth={setUser} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />} />
            <Route path="/skills" element={user ? <SkillList user={user} /> : <Navigate to="/auth" />} />
            <Route path="/chat/:swapId" element={user ? <Chat user={user} /> : <Navigate to="/auth" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
