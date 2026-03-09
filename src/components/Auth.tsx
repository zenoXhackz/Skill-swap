import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onAuth: (user: User) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      onAuth(data);
    } else {
      setError(data.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-3xl font-serif italic mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Join SkillSwap'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-stone-600 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-stone-900 font-semibold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
