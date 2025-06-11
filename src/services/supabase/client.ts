// src/services/supabase/client.ts
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipTapDocument } from '../../utils/tiptapConverter';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://fuupwqlinnehbcckhqwi.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dXB3cWxpbm5laGJjY2tocXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTU4MzIsImV4cCI6MjA2MTc5MTgzMn0.5kBlJnl90zaqy3Ksy5PeRYRra0quqCHb__FRkaAEUE0';

// Custom REST-only Supabase client
class SupabaseRestClient {
  public supabaseUrl: string;
  public supabaseKey: string;
  private headers: Record<string, string>;
  
  constructor(url: string, key: string) {
    this.supabaseUrl = url;
    this.supabaseKey = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    console.log('Supabase client initialized in REST-only mode (no realtime)');
  }

  // Method to update headers (used by AuthContext)
  updateHeaders(token: string | null) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      this.headers['Authorization'] = `Bearer ${this.supabaseKey}`;
    }
  }

  // Auth methods
  auth = {
    getSession: async () => {
      try {
        const session = await AsyncStorage.getItem('supabase.auth.token');
        return { data: { session: session ? JSON.parse(session) : null }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },

    getUser: async () => {
      try {
        const session = await AsyncStorage.getItem('supabase.auth.token');
        if (!session) {
          return { data: { user: null }, error: null };
        }
        const parsedSession = JSON.parse(session);
        return { data: { user: parsedSession.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { data: { user: null, session: null }, error: data };
        }
        
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
          expires_at: data.expires_at,
        };
        
        // Don't store here - let AuthContext handle it
        this.updateHeaders(data.access_token);
        
        return { data: { user: data.user, session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          return { data: { user: null, session: null }, error: data };
        }
        
        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    signOut: async () => {
      try {
        // Call the logout endpoint
        await fetch(`${this.supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: this.headers,
        });
        
        // Reset headers
        this.updateHeaders(null);
        
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
  };

  // Database methods
  from(table: string) {
    return new SupabaseTable(this.supabaseUrl, this.headers, table);
  }
  rpc(functionName: string, params: Record<string, any> = {}) {
    return {
      execute: async () => {
        try {
          const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/${functionName}`, {
            method: 'POST',
            headers: {
              ...this.headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });

          const data = await response.json();
          
          if (!response.ok) {
            return { data: null, error: data };
          }

          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    };
  }
}

class SupabaseTable {
  private url: string;
  private headers: Record<string, string>;
  private table: string;
  private query: string;
  private selectColumns: string;

  constructor(url: string, headers: Record<string, string>, table: string) {
    this.url = url;
    this.headers = headers;
    this.table = table;
    this.query = '';
    this.selectColumns = '*';
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=eq.${encodeURIComponent(value)}`;
    return this;
  }

  or(conditions: string) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}or=(${conditions})`;
    return this;
  }

  contains(column: string, value: any[]) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=cs.{${value.map(v => `"${v}"`).join(',')}}`;
    return this;
  }

  gte(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=gte.${encodeURIComponent(value)}`;
    return this;
  }

  lte(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=lte.${encodeURIComponent(value)}`;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const separator = this.query ? '&' : '';
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.query += `${separator}order=${column}.${direction}`;
    return this;
  }

  limit(count: number) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}limit=${count}`;
    return this;
  }

  // Make execute public so the exported functions can use it
  public async execute() {
    try {
      const queryString = this.query ? `?select=${this.selectColumns}&${this.query}` : `?select=${this.selectColumns}`;
      const response = await fetch(`${this.url}/rest/v1/${this.table}${queryString}`, {
        method: 'GET',
        headers: this.headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async single() {
    const result = await this.execute();
    if (result.error) return result;
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
    }
    return { data: result.data[0], error: null };
  }

  async insert(data: any) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(Array.isArray(data) ? data : [data]),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(data: any) {
    try {
      const queryString = this.query ? `?${this.query}` : '';
      const response = await fetch(`${this.url}/rest/v1/${this.table}${queryString}`, {
        method: 'PATCH',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async delete() {
    try {
      const queryString = this.query ? `?${this.query}` : '';
      const response = await fetch(`${this.url}/rest/v1/${this.table}${queryString}`, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        const result = await response.json();
        return { data: null, error: result };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const supabase = new SupabaseRestClient(supabaseUrl, supabaseAnonKey);

// Export the same types as before
export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: TipTapDocument | { html: string } | Record<string, unknown>; // Allow multiple formats
  tags: string[];
  category: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type DailyActivity = {
  id: string;
  user_id: string;
  date: string;
  notes_count: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
};

// Note operations
export const getNotes = async () => {
  const result = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
    .execute();

  if (result.error) {
    console.error('Error fetching notes:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

export const getNoteById = async (id: string) => {
  const result = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (result.error) {
    console.error('Error fetching note by ID:', result.error);
    throw result.error;
  }

  return result.data as Note;
};

export const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const noteWithUser = {
    ...note,
    user_id: user.id
  };
  
  const result = await supabase
    .from('notes')
    .insert(noteWithUser);

  if (result.error) {
    console.error('Error creating note:', result.error);
    throw result.error;
  }
  
  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to create note - no data returned');
  }

  return result.data[0] as Note;
};

export const updateNote = async (id: string, note: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>) => {
  const result = await supabase
    .from('notes')
    .eq('id', id)
    .update(note);  

  if (result.error) {
    console.error('Error updating note:', result.error);
    throw result.error;
  }

  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to update note - no data returned');
  }

  return result.data[0] as Note;
};

export const deleteNote = async (id: string) => {
  const result = await supabase
    .from('notes')
    .eq('id', id)
    .delete();

  if (result.error) {
    console.error('Error deleting note:', result.error);
    throw result.error;
  }

  return true;
};

export const searchNotes = async (query: string) => {
  const result = await supabase
    .rpc('search_notes', { search_query: query })
    .execute();

  if (result.error) {
    console.error('Error searching notes:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

export const filterNotesByCategory = async (category: string) => {
  const result = await supabase
    .from('notes')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .execute();

  if (result.error) {
    console.error('Error filtering notes by category:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

export const filterNotesByTag = async (tag: string) => {
  const result = await supabase
    .from('notes')
    .select('*')
    .contains('tags', [tag])
    .order('created_at', { ascending: false })
    .execute();

  if (result.error) {
    console.error('Error filtering notes by tag:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

// Category operations
export const getCategories = async () => {
  const result = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
    .execute();

  if (result.error) {
    console.error('Error fetching categories:', result.error);
    throw result.error;
  }

  return result.data as Category[];
};

export const createCategory = async (name: string, color: string = 'blue') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const result = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      color
    });

  if (result.error) {
    console.error('Error creating category:', result.error);
    throw result.error;
  }
  
  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to create category - no data returned');
  }

  return result.data[0] as Category;
};

export const updateCategory = async (id: string, updates: { name?: string; color?: string }) => {
  const result = await supabase
    .from('categories')
    .eq('id', id)
    .update(updates);

  if (result.error) {
    console.error('Error updating category:', result.error);
    throw result.error;
  }

  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to update category - no data returned');
  }

  return result.data[0] as Category;
};

export const deleteCategory = async (id: string) => {
  // First check if category is in use
  const notesResult = await supabase
    .from('notes')
    .select('id')
    .eq('category', id)
    .limit(1)
    .execute();

  if (notesResult.error) {
    console.error('Error checking if category is in use:', notesResult.error);
    throw notesResult.error;
  }

  if (notesResult.data && notesResult.data.length > 0) {
    throw new Error('Cannot delete category that is in use by notes');
  }

  // Delete the category
  const result = await supabase
    .from('categories')
    .eq('id', id)
    .delete();

  if (result.error) {
    console.error('Error deleting category:', result.error);
    throw result.error;
  }

  return true;
};

// Tag operations
export const getTags = async () => {
  const result = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })
    .execute();

  if (result.error) {
    console.error('Error fetching tags:', result.error);
    throw result.error;
  }

  return result.data as Tag[];
};

export const createTag = async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const result = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name
    });

  if (result.error) {
    console.error('Error creating tag:', result.error);
    throw result.error;
  }
  
  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to create tag - no data returned');
  }

  return result.data[0] as Tag;
};

export const updateTag = async (id: string, name: string) => {
  const result = await supabase
    .from('tags')
    .eq('id', id)
    .update({ name });

  if (result.error) {
    console.error('Error updating tag:', result.error);
    throw result.error;
  }

  if (!result.data || result.data.length === 0) {
    throw new Error('Failed to update tag - no data returned');
  }

  return result.data[0] as Tag;
};

export const deleteTag = async (id: string) => {
  // First get the tag name
  const tagResult = await supabase
    .from('tags')
    .select('name')
    .eq('id', id)
    .single();

  if (tagResult.error) {
    console.error('Error fetching tag name:', tagResult.error);
    throw tagResult.error;
  }

  const tagName = tagResult.data?.name;

  // Check if tag is in use
  const notesResult = await supabase
    .from('notes')
    .select('id')
    .contains('tags', [tagName])
    .limit(1)
    .execute();

  if (notesResult.error) {
    console.error('Error checking if tag is in use:', notesResult.error);
    throw notesResult.error;
  }

  if (notesResult.data && notesResult.data.length > 0) {
    throw new Error('Cannot delete tag that is in use by notes');
  }

  // Delete the tag
  const result = await supabase
    .from('tags')
    .eq('id', id)
    .delete();

  if (result.error) {
    console.error('Error deleting tag:', result.error);
    throw result.error;
  }

  return true;
};

// Daily Activity operations
export const getCurrentStreak = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await supabase
    .from('daily_activity')
    .select('streak_days')
    .eq('date', today)
    .single();
    
  if (result.error && result.error.code !== 'PGRST116') {
    console.error('Error fetching current streak:', result.error);
    throw result.error;
  }
  
  return result.data?.streak_days || 0;
};

export const getActivityForDateRange = async (startDate: string, endDate: string): Promise<DailyActivity[]> => {
  const result = await supabase
    .from('daily_activity')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .execute();
    
  if (result.error) {
    console.error('Error fetching activity for date range:', result.error);
    throw result.error;
  }
  
  return result.data as DailyActivity[];
};

export const getWeeklyActivity = async (): Promise<DailyActivity[]> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  return getActivityForDateRange(startDate, endDate);
};

export const getMonthlyActivity = async (): Promise<DailyActivity[]> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  return getActivityForDateRange(startDate, endDate);
};

// Legacy export for compatibility
export const createClient = () => supabase; 