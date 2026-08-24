import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// A mock base44 client that mimics the SDK structure used by the app to minimize refactoring
export const base44 = {
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('Not logged in');
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
      return { ...user, ...userData };
    },
    loginViaEmailPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    register: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    resetPasswordRequest: async (email) => {
      await supabase.auth.resetPasswordForEmail(email);
    },
    resetPassword: async ({ newPassword }) => {
      await supabase.auth.updateUser({ password: newPassword });
    }
  },
  entities: {
    Campaign: buildEntityClient('campaign'),
    Prize: buildEntityClient('prize'),
    Customer: buildEntityClient('customer'),
    Spin: buildEntityClient('spin'),
    Coupon: buildEntityClient('coupon'),
  },
  functions: {
    invoke: async (functionName, payload) => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch(`${apiBase}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      return { data: await response.json() };
    }
  }
};

function buildEntityClient(table) {
  return {
    list: async (orderBy, limit) => {
      let query = supabase.from(table).select('*');
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col = desc ? orderBy.substring(1) : orderBy;
        query = query.order(col, { ascending: !desc });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    create: async (payload) => {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  };
}
