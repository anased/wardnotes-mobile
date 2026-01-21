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

    // OAuth method for Google Sign-In
    signInWithOAuth: (provider: string, redirectTo: string) => {
      // Return OAuth URL - the actual OAuth flow will be handled by expo-auth-session
      // Query parameters to pass to Google OAuth:
      // - prompt=select_account: Forces account picker to show every time
      // - access_type=offline: Request a refresh token
      const queryParams = new URLSearchParams({
        provider: provider,
        redirect_to: redirectTo,
        // These get passed to the OAuth provider (Google)
        prompt: 'select_account',
        access_type: 'offline',
      });

      return {
        url: `${this.supabaseUrl}/auth/v1/authorize?${queryParams.toString()}`,
      };
    },

    // Exchange OAuth code for session
    exchangeCodeForSession: async (code: string) => {
      try {
        const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ auth_code: code }),
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

        // Update headers with new token
        this.updateHeaders(data.access_token);

        return { data: { user: data.user, session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
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
  private _updateData: any;
  private _operation: string | null;

  constructor(url: string, headers: Record<string, string>, table: string) {
    this.url = url;
    this.headers = headers;
    this.table = table;
    this.query = '';
    this.selectColumns = '*';
    this._updateData = null;
    this._operation = null;
  }

  select(columns = '*'): SupabaseTable {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=eq.${encodeURIComponent(value)}`;
    return this;
  }

  neq(column: string, value: any): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=neq.${encodeURIComponent(value)}`;
    return this;
  }

  or(conditions: string): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}or=(${conditions})`;
    return this;
  }

  contains(column: string, value: any[]): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=cs.{${value.map(v => `"${v}"`).join(',')}}`;
    return this;
  }

  // Array overlaps operator - returns true if arrays share any elements (OR logic)
  overlaps(column: string, value: any[]): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=ov.{${value.map(v => `"${v}"`).join(',')}}`;
    return this;
  }

  gte(column: string, value: any): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=gte.${encodeURIComponent(value)}`;
    return this;
  }

  lte(column: string, value: any): SupabaseTable {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=lte.${encodeURIComponent(value)}`;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): SupabaseTable {
    const separator = this.query ? '&' : '';
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.query += `${separator}order=${column}.${direction}`;
    return this;
  }

  limit(count: number): SupabaseTable {
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
        // Check for JWT expired error
        if (response.status === 401 && data.message?.includes('JWT')) {
          console.warn('JWT expired during query execution. Please refresh the app.');
        }
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

  update(data: any): SupabaseTable {
    this._updateData = data;
    this._operation = 'update';
    return this;
  }

  // Execute an update operation with select
  async updateWithSelect() {
    return this._executeUpdate();
  }

  private async _executeUpdate() {
    try {
      // For updates, the select columns go in the query string WITH the filters
      let queryString = '';
      
      // First add the filter conditions
      if (this.query) {
        queryString = this.query;
      }
      
      // Then add select if specified
      if (this.selectColumns !== '*') {
        const selectParam = `select=${this.selectColumns}`;
        queryString = queryString ? `${queryString}&${selectParam}` : selectParam;
      }
      
      // Build final URL
      const finalQueryString = queryString ? `?${queryString}` : '';
      const url = `${this.url}/rest/v1/${this.table}${finalQueryString}`;
      
      console.log('=== EXECUTING UPDATE ===');
      console.log('Update URL:', url);
      console.log('Update data:', JSON.stringify(this._updateData, null, 2));
      console.log('Update data content field:', JSON.stringify(this._updateData?.content, null, 2));
      console.log('Query string:', queryString);
      console.log('Headers:', this.headers);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 
          ...this.headers, 
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(this._updateData),
      });

      const result = await response.json();
      console.log('Update response status:', response.status);
      console.log('Update response headers:', response.headers);
      console.log('Update response:', JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        console.error('Update failed with status:', response.status);
        console.error('Error details:', result);
        return { data: null, error: result };
      }

      console.log('Update successful, returning data:', result);
      console.log('Is result an array?', Array.isArray(result));
      console.log('Result length if array:', Array.isArray(result) ? result.length : 'N/A');
      return { data: result, error: null };
    } catch (error) {
      console.error('Update error:', error);
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
  const query = supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
    
  const result = await query.execute();

  if (result.error) {
    console.error('Error fetching notes:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

export const getNoteById = async (id: string) => {
  console.log('=== FETCHING NOTE BY ID ===');
  console.log('Note ID:', id);
  
  const query = supabase
    .from('notes')
    .select('*')
    .eq('id', id);
    
  const result = await query.single();

  console.log('Fetch result:', JSON.stringify(result, null, 2));

  if (result.error) {
    console.error('Error fetching note by ID:', result.error);
    throw result.error;
  }

  console.log('Returning note data:', JSON.stringify(result.data, null, 2));
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
  console.log('=== UPDATE NOTE CALLED ===');
  console.log('Note ID:', id);
  console.log('Note data to update:', JSON.stringify(note, null, 2));
  
  const query = supabase
    .from('notes')
    .eq('id', id)
    .update(note)
    .select();
    
  const result = await query.updateWithSelect();

  console.log('Update result:', JSON.stringify(result, null, 2));
  console.log('Update result.data type:', typeof result.data);
  console.log('Update result.data is array:', Array.isArray(result.data));
  console.log('Update result.data content:', result.data);

  if (result.error) {
    console.error('Error updating note:', result.error);
    throw result.error;
  }

  // Handle both array and single object responses
  let updatedNote;
  if (Array.isArray(result.data)) {
    if (result.data.length === 0) {
      console.error('No data returned from update operation - empty array');
      throw new Error('Failed to update note - no data returned');
    }
    updatedNote = result.data[0];
  } else if (result.data) {
    // Single object returned
    updatedNote = result.data;
  } else {
    console.error('No data returned from update operation - null/undefined');
    throw new Error('Failed to update note - no data returned');
  }

  console.log('Update successful, returning:', updatedNote);
  return updatedNote as Note;
};

export const deleteNote = async (id: string) => {
  const query = supabase
    .from('notes')
    .eq('id', id);
    
  const result = await query.delete();

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
  const query = supabase
    .from('notes')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });
    
  const result = await query.execute();

  if (result.error) {
    console.error('Error filtering notes by category:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

export const filterNotesByTag = async (tag: string) => {
  const query = supabase
    .from('notes')
    .select('*')
    .contains('tags', [tag])
    .order('created_at', { ascending: false });
    
  const result = await query.execute();

  if (result.error) {
    console.error('Error filtering notes by tag:', result.error);
    throw result.error;
  }

  return result.data as Note[];
};

// Category operations
export const getCategories = async () => {
  const query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
    
  const result = await query.execute();

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
  const query = supabase
    .from('categories')
    .eq('id', id)
    .update(updates)
    .select();

  const result = await query.updateWithSelect();

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
  const notesQuery = supabase
    .from('notes')
    .select('id')
    .eq('category', id)
    .limit(1);
    
  const notesResult = await notesQuery.execute();

  if (notesResult.error) {
    console.error('Error checking if category is in use:', notesResult.error);
    throw notesResult.error;
  }

  if (notesResult.data && notesResult.data.length > 0) {
    throw new Error('Cannot delete category that is in use by notes');
  }

  // Delete the category
  const query = supabase
    .from('categories')
    .eq('id', id);
    
  const result = await query.delete();

  if (result.error) {
    console.error('Error deleting category:', result.error);
    throw result.error;
  }

  return true;
};

// Tag operations
export const getTags = async () => {
  const query = supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });
    
  const result = await query.execute();

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

  // Custom REST client's insert() already returns data (has 'Prefer': 'return=representation')
  // No .select() needed - insert() returns a Promise directly
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
  const query = supabase
    .from('tags')
    .eq('id', id)
    .update({ name })
    .select();
    
  const result = await query.updateWithSelect();

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
  const tagQuery = supabase
    .from('tags')
    .select('name')
    .eq('id', id);
    
  const tagResult = await tagQuery.single();

  if (tagResult.error) {
    console.error('Error fetching tag name:', tagResult.error);
    throw tagResult.error;
  }

  const tagName = tagResult.data?.name;

  // Check if tag is in use
  const notesQuery = supabase
    .from('notes')
    .select('id')
    .contains('tags', [tagName])
    .limit(1);
    
  const notesResult = await notesQuery.execute();

  if (notesResult.error) {
    console.error('Error checking if tag is in use:', notesResult.error);
    throw notesResult.error;
  }

  if (notesResult.data && notesResult.data.length > 0) {
    throw new Error('Cannot delete tag that is in use by notes');
  }

  // Delete the tag
  const query = supabase
    .from('tags')
    .eq('id', id);
    
  const result = await query.delete();

  if (result.error) {
    console.error('Error deleting tag:', result.error);
    throw result.error;
  }

  return true;
};

// Daily Activity operations

export const getCurrentStreak = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];
  
  const query = supabase
    .from('daily_activity')
    .select('streak_days')
    .eq('user_id', user.id)
    .eq('date', today);
    
  const result = await query.single();
    
  if (result.error && result.error.code !== 'PGRST116') {
    console.error('Error fetching current streak:', result.error);
    return 0; // Return 0 instead of throwing to handle gracefully
  }
  
  return result.data?.streak_days || 0;
};

export const getActivityForDateRange = async (startDate: string, endDate: string): Promise<DailyActivity[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const query = supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
    
  const result = await query.execute();
    
  if (result.error) {
    console.error('Error fetching activity for date range:', result.error);
    return []; // Return empty array instead of throwing
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