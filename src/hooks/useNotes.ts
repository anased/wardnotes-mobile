import { useState, useEffect, useCallback } from 'react';
import { supabase, Note } from '../services/supabase/client';

export default function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNoteById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Error fetching note with ID ${id}:`, err);
      throw err;
    }
  }, []);

  const createNote = useCallback(async (note: Omit<Note, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert({ ...note, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setNotes(prevNotes => [data, ...prevNotes]);
      return data;
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    }
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(prevNotes => 
        prevNotes.map(note => note.id === id ? data : note)
      );
      return data;
    } catch (err) {
      console.error(`Error updating note with ID ${id}:`, err);
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    } catch (err) {
      console.error(`Error deleting note with ID ${id}:`, err);
      throw err;
    }
  }, []);

  const search = useCallback(async (query: string) => {
    try {
      setLoading(true);
      if (!query.trim()) {
        return fetchNotes();
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      setError(err as Error);
      console.error(`Error searching notes with query "${query}":`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
    search,
  };
}