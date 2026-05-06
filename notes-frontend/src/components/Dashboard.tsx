import { useState, useEffect, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, LogOut } from 'lucide-react';

import api from "../api";
import type { ApiResponse, Note } from "../types";

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get<ApiResponse>('/users/notes');
      console.log(data.data.notes);
      setNotes(data.data.notes as Note[]);
      setUsername(data.data.username as string);
    } catch (error) {
      console.error('Failed to fetch notes', error);
    }
  };

  const createNote = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      const { data } = await api.post<ApiResponse>('/users/notes', { title, content });
      console.log(data.data.notes);
      setNotes(data.data.notes as Note[]);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Failed to create note', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { data } = await api.delete<ApiResponse>(`/users/notes/${id}`);
      console.log(data.data.notes);
      setNotes(data.data.notes as Note[]);
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {username}</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </button>
      </header>

      {/* Note Creation Form */}
      <form onSubmit={createNote} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-semibold mb-3 focus:outline-none placeholder-gray-400"
        />
        <textarea
          placeholder="Write your note here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none h-24 focus:outline-none text-gray-600 placeholder-gray-400"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="flex items-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={20} className="mr-1" /> Add Note
          </button>
        </div>
      </form>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div key={note._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group relative">
            <button
              onClick={() => deleteNote(note._id)}
              className="absolute top-4 right-4 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
              <Trash2 size={20} />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 pr-6">{note.title}</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
