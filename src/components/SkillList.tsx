import React, { useState, useEffect } from 'react';
import { Search, Plus, Tag, Filter, ArrowRight } from 'lucide-react';
import { User, Skill } from '../types';

interface SkillListProps {
  user: User;
}

export default function SkillList({ user }: SkillListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'want'>('all');

  // New Skill Form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'offer' | 'want'>('offer');
  const [newTags, setNewTags] = useState('');

  // Swap Request
  const [requestingSwap, setRequestingSwap] = useState<Skill | null>(null);
  const [myOfferSkillId, setMyOfferSkillId] = useState<string>('');

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      });
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc, type: newType, tags })
    });
    const data = await res.json();
    setSkills([data, ...skills]);
    setShowAddModal(false);
    setNewName(''); setNewDesc(''); setNewTags('');
  };

  const handleRequestSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingSwap) return;

    await fetch('/api/swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_id: requestingSwap.user_id,
        skill_offered_id: parseInt(myOfferSkillId),
        skill_wanted_id: requestingSwap.id
      })
    });
    setRequestingSwap(null);
    alert('Swap request sent!');
  };

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || s.type === filterType;
    return matchesSearch && matchesType;
  });

  const myOfferSkills = skills.filter(s => s.user_id === user.id && s.type === 'offer');

  if (loading) return <div>Loading skills...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-serif italic font-bold">Browse Skills</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
        >
          <Plus size={20} /> List Your Skill
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search skills or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 bg-white"
          />
        </div>
        <div className="flex bg-white rounded-2xl border border-stone-200 p-1">
          {(['all', 'offer', 'want'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === type ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSkills.map(skill => (
          <div key={skill.id} className="group bg-white rounded-3xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`h-2 ${skill.type === 'offer' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                  skill.type === 'offer' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {skill.type === 'offer' ? 'Offering' : 'Seeking'}
                </span>
                <span className="text-xs text-stone-400 font-medium">by {skill.owner_name}</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-stone-700 transition-colors">{skill.name}</h3>
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">{skill.description}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {skill.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] bg-stone-50 text-stone-500 px-2 py-1 rounded-md uppercase font-bold tracking-tighter border border-stone-100">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
              
              {skill.user_id !== user.id && (
                <button 
                  onClick={() => setRequestingSwap(skill)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-stone-900 text-stone-900 font-bold hover:bg-stone-900 hover:text-white transition-all"
                >
                  Request Swap <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-serif italic font-bold mb-6">List a Skill</h2>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wider">Skill Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="e.g. Piano Lessons, Web Development"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 h-24"
                  placeholder="What can you teach or what do you want to learn?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wider">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'offer' | 'want')}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200"
                >
                  <option value="offer">I am offering this skill</option>
                  <option value="want">I am seeking this skill</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wider">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="e.g. Beginner, Online, Creative"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Swap Modal */}
      {requestingSwap && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-serif italic font-bold mb-2">Request Swap</h2>
            <p className="text-stone-500 mb-6">You are requesting <span className="font-bold text-stone-900">"{requestingSwap.name}"</span> from {requestingSwap.owner_name}.</p>
            <form onSubmit={handleRequestSwap} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3 uppercase tracking-wider">Which skill will you offer in return?</label>
                <div className="space-y-2">
                  {myOfferSkills.map(s => (
                    <label key={s.id} className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      myOfferSkillId === s.id.toString() ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'
                    }`}>
                      <input
                        type="radio"
                        name="offerSkill"
                        value={s.id}
                        checked={myOfferSkillId === s.id.toString()}
                        onChange={(e) => setMyOfferSkillId(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex-1">
                        <p className="font-bold">{s.name}</p>
                        <p className="text-xs text-stone-400">{s.tags.join(', ')}</p>
                      </div>
                      {myOfferSkillId === s.id.toString() && <div className="w-4 h-4 bg-stone-900 rounded-full" />}
                    </label>
                  ))}
                  {myOfferSkills.length === 0 && (
                    <p className="text-red-500 text-sm">You need to list an "Offer" skill first before you can request a swap.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRequestingSwap(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!myOfferSkillId}
                  className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
