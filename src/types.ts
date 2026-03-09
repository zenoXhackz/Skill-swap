export interface User {
  id: number;
  username: string;
}

export interface Skill {
  id: number;
  user_id: number;
  owner_name: string;
  name: string;
  description: string;
  type: 'offer' | 'want';
  tags: string[];
  created_at: string;
}

export interface Swap {
  id: number;
  requester_id: number;
  owner_id: number;
  skill_offered_id: number;
  skill_wanted_id: number;
  status: 'pending' | 'confirmed' | 'rejected';
  requester_name: string;
  owner_name: string;
  offered_skill_name: string;
  wanted_skill_name: string;
  created_at: string;
}

export interface Message {
  id: number;
  swap_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}
