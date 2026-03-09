import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Check, X, Clock, Plus } from 'lucide-react';
import { User, Skill, Swap } from '../types';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [skillsRes, swapsRes] = await Promise.all([
        fetch('/api/skills'),
        fetch('/api/swaps')
      ]);
      
      const allSkills = await skillsRes.json();
      setMySkills(allSkills.filter((s: Skill) => s.user_id === user.id));
      setSwaps(await swapsRes.json());
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  const handleSwapStatus = async (swapId: number, status: 'confirmed' | 'rejected') => {
    await fetch(`/api/swaps/${swapId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setSwaps(swaps.map(s => s.id === swapId ? { ...s, status } : s));
  };

  if (loading) return <div>Loading dashboard...</div>;

  const pendingSwaps = swaps.filter(s => s.status === 'pending' && s.owner_id === user.id);
  const activeSwaps = swaps.filter(s => s.status === 'confirmed');

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-serif italic font-bold">Hello, {user.username}</h1>
        <p className="text-stone-500 mt-2">Manage your skills and active exchanges.</p>
      </header>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-serif italic font-semibold">My Skills</h2>
          <Link to="/skills" className="flex items-center gap-2 text-stone-900 font-medium hover:underline">
            <Plus size={18} />
            Add New
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySkills.map(skill => (
            <div key={skill.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  skill.type === 'offer' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {skill.type === 'offer' ? 'Offering' : 'Seeking'}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
              <p className="text-stone-600 text-sm mb-4 line-clamp-2">{skill.description}</p>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded-md uppercase font-bold tracking-tighter">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {mySkills.length === 0 && (
            <div className="col-span-full py-12 text-center bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200">
              <p className="text-stone-500">You haven't added any skills yet.</p>
            </div>
          )}
        </div>
      </section>

      {pendingSwaps.length > 0 && (
        <section>
          <h2 className="text-2xl font-serif italic font-semibold mb-6">Pending Requests</h2>
          <div className="space-y-4">
            {pendingSwaps.map(swap => (
              <div key={swap.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-stone-900 font-medium">
                    <span className="font-bold">{swap.requester_name}</span> wants to swap their 
                    <span className="italic"> "{swap.offered_skill_name}"</span> for your 
                    <span className="italic"> "{swap.wanted_skill_name}"</span>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleSwapStatus(swap.id, 'confirmed')}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <Check size={18} /> Accept
                  </button>
                  <button 
                    onClick={() => handleSwapStatus(swap.id, 'rejected')}
                    className="flex items-center gap-2 bg-stone-100 text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    <X size={18} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-serif italic font-semibold mb-6">Active Swaps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeSwaps.map(swap => (
            <div key={swap.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Confirmed</span>
                </div>
                <Link 
                  to={`/chat/${swap.id}`}
                  className="flex items-center gap-2 text-stone-900 bg-stone-100 px-4 py-2 rounded-xl hover:bg-stone-200 transition-colors"
                >
                  <MessageSquare size={18} />
                  Chat
                </Link>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-stone-500">Partner: <span className="text-stone-900 font-semibold">{swap.requester_id === user.id ? swap.owner_name : swap.requester_name}</span></p>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 text-center">
                    <p className="text-xs uppercase text-stone-400 font-bold">You give</p>
                    <p className="font-medium">{swap.requester_id === user.id ? swap.offered_skill_name : swap.wanted_skill_name}</p>
                  </div>
                  <div className="text-stone-300">↔</div>
                  <div className="flex-1 text-center">
                    <p className="text-xs uppercase text-stone-400 font-bold">You get</p>
                    <p className="font-medium">{swap.requester_id === user.id ? swap.wanted_skill_name : swap.offered_skill_name}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {activeSwaps.length === 0 && (
            <div className="col-span-full py-12 text-center bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-stone-400 italic">No active swaps yet. Browse skills to find a partner!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
