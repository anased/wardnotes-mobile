// src/services/supabase/rest-client.ts
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://fuupwqlinnehbcckhqwi.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dXB3cWxpbm5laGJjY2tocXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTU4MzIsImV4cCI6MjA2MTc5MTgzMn0.5kBlJnl90zaqy3Ksy5PeRYRra0quqCHb__FRkaAEUE0';

// Custom REST-only Supabase client
class SupabaseRestClient {
  private url: string;
  private key: string;
  private headers: Record<string, string>;
  
  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
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
        const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
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
        
        await AsyncStorage.setItem('supabase.auth.token', JSON.stringify(session));
        this.headers['Authorization'] = `Bearer ${data.access_token}`;
        
        return { data: { user: data.user, session }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch(`${this.url}/auth/v1/signup`, {
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
        await AsyncStorage.removeItem('supabase.auth.token');
        this.headers['Authorization'] = `Bearer ${this.key}`;
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
  };

  // Database methods
  from(table: string) {
    return new SupabaseTable(this.url, this.key, table);
  }
}

class SupabaseTable {
  private url: string;
  private key: string;
  private table: string;
  private query: string;
  private operation: string;
  private insertData: any;
  private updateData: any;

  constructor(url: string, key: string, table: string) {
    this.url = url;
    this.key = key;
    this.table = table;
    this.query = '';
    this.operation = 'select';
    this.insertData = null;
    this.updateData = null;
  }

  // Make the class itself awaitable
  then(resolve: Function, reject?: Function) {
    return this.execute().then(resolve, reject);
  }

  private async getHeaders(): Promise<Record<string, string>> {
    try {
      const session = await AsyncStorage.getItem('supabase.auth.token');
      const token = session ? JSON.parse(session).access_token : this.key;
      
      return {
        'apikey': this.key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    }
  }

  select(columns = '*') {
    this.query = `select=${columns}`;
    return this;
  }

  eq(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=eq.${value}`;
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

  lte(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=lte.${value}`;
    return this;
  }

  gte(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=gte.${value}`;
    return this;
  }

  neq(column: string, value: any) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}${column}=neq.${value}`;
    return this;
  }

  in(column: string, values: any[]) {
    const separator = this.query ? '&' : '';
    const valueList = values.map(v => encodeURIComponent(v)).join(',');
    this.query += `${separator}${column}=in.(${valueList})`;
    return this;
  }

  or(conditions: string) {
    const separator = this.query ? '&' : '';
    this.query += `${separator}or=(${conditions})`;
    return this;
  }

  async single() {
    const result = await this.execute();
    console.log('REST Client - single() result:', result);
    if (result.error) return result;
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'No rows found' } };
    }
    return { data: result.data[0], error: null };
  }

  // Method to get array results (used by getDecks, getFlashcards, etc.)
  async getArray() {
    const result = await this.execute();
    console.log('REST Client - getArray() result:', result);
    return result;
  }

  insert(data: any) {
    this.insertData = data;
    this.operation = 'insert';
    return this;
  }

  update(data: any) {
    this.updateData = data;
    this.operation = 'update';
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  private async execute() {
    try {
      const headers = await this.getHeaders();
      let url: string;
      let method: string;
      let body: string | undefined;

      switch (this.operation) {
        case 'insert':
          url = `${this.url}/rest/v1/${this.table}`;
          method = 'POST';
          body = JSON.stringify(this.insertData);
          break;
        case 'update':
          const updateQuery = this.query ? `?${this.query}` : '';
          url = `${this.url}/rest/v1/${this.table}${updateQuery}`;
          method = 'PATCH';
          body = JSON.stringify(this.updateData);
          break;
        case 'delete':
          const deleteQuery = this.query ? `?${this.query}` : '';
          url = `${this.url}/rest/v1/${this.table}${deleteQuery}`;
          method = 'DELETE';
          break;
        default: // select
          const selectQuery = this.query ? `?${this.query}` : '';
          url = `${this.url}/rest/v1/${this.table}${selectQuery}`;
          method = 'GET';
          break;
      }
      
      console.log('REST Client - Executing:', { operation: this.operation, method, url });
      console.log('REST Client - Headers:', headers);
      if (body) console.log('REST Client - Body:', body);
      
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const data = await response.json();
      console.log('REST Client - Response status:', response.status);
      console.log('REST Client - Response data type:', typeof data);
      console.log('REST Client - Response data length:', Array.isArray(data) ? data.length : 'not array');
      console.log('REST Client - Response data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('REST Client - Error response:', data);
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error) {
      console.error('REST Client - Network error:', error);
      return { data: null, error };
    }
  }
}

export const supabase = new SupabaseRestClient(supabaseUrl, supabaseAnonKey);