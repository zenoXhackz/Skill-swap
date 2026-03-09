import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import { User, Message, Swap } from '../types';

interface ChatProps {
  user: User;
}

export default function Chat({ user }: ChatProps) {
  const { swapId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [swap, setSwap] = useState<Swap | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch swap details and history
    const fetchData = async () => {
      const [swapRes, msgRes] = await Promise.all([
        fetch('/api/swaps'),
        fetch(`/api/messages/${swapId}`)
      ]);
      const allSwaps = await swapRes.json();
      const currentSwap = allSwaps.find((s: Swap) => s.id === parseInt(swapId!));
      
      if (!currentSwap || currentSwap.status !== 'confirmed') {
        navigate('/dashboard');
        return;
      }
      
      setSwap(currentSwap);
      setMessages(await msgRes.json());
    };
    fetchData();

    // Socket setup
    socketRef.current = io();
    socketRef.current.emit('join_swap', swapId);
    
    socketRef.current.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [swapId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current?.emit('send_message', {
      swapId: parseInt(swapId!),
      senderId: user.id,
      content: newMessage
    });
    setNewMessage('');
  };

  if (!swap) return <div>Loading chat...</div>;

  const partnerName = swap.requester_id === user.id ? swap.owner_name : swap.requester_name;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
      <header className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserIcon size={18} className="text-stone-400" />
              {partnerName}
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
              Swapping: {swap.offered_skill_name} ↔ {swap.wanted_skill_name}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                isMe 
                  ? 'bg-stone-900 text-white rounded-tr-none' 
                  : 'bg-stone-100 text-stone-800 rounded-tl-none'
              }`}>
                {!isMe && <p className="text-[10px] font-bold uppercase mb-1 opacity-50">{msg.sender_name}</p>}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-stone-400' : 'text-stone-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-6 border-t border-stone-100 bg-stone-50/50">
        <div className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-6 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 bg-white"
          />
          <button
            type="submit"
            className="bg-stone-900 text-white p-4 rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
