import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  BookOpen,
  Calendar,
  Filter,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#ff6b6b',
  'English': '#4ecdc4', 
  'Science': '#45b7d1',
  'History': '#96ceb4',
  'Geography': '#feca57',
  'Chemistry': '#ff9ff3',
  'Physics': '#54a0ff',
  'Biology': '#5f27cd',
  'Literature': '#00d2d3',
  'Art': '#ff9f43',
  'Music': '#10ac84',
  'Physical Education': '#ee5a24',
  'Computer Science': '#2e86de',
  'Psychology': '#f368e0',
  'Philosophy': '#3742fa',
  'Other': '#A0FAB2'
};

const COMMON_SUBJECTS = Object.keys(SUBJECT_COLORS);

const StudyNotes = () => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [saveTimeouts, setSaveTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const { user } = useAuth();

  // New note form state
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject: '',
    color: '#A0FAB2'
  });

  // Edit note form state
  const [editNote, setEditNote] = useState({
    title: '',
    content: '',
    subject: '',
    color: '#A0FAB2'
  });

  // Lazy load notes on component mount
  useEffect(() => {
    if (user?.id) {
      lazyFetchNotes();
    }
  }, [user?.id]);

  // Auto-save debounced function
  const debouncedAutoSave = useCallback((noteId: string, noteData: Partial<StudyNote>) => {
    // Clear existing timeout for this note
    const existingTimeout = saveTimeouts.get(noteId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(async () => {
      await autoSaveNote(noteId, noteData);
      setSaveTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(noteId);
        return newMap;
      });
    }, 1000); // 1 second debounce

    setSaveTimeouts(prev => {
      const newMap = new Map(prev);
      newMap.set(noteId, newTimeout);
      return newMap;
    });
  }, [saveTimeouts]);

  const lazyFetchNotes = async () => {
    if (!user?.id) return;

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      console.log('StudyNotes: User session not found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/notes/${user.id}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      const result = await response.json();

      if (result.success) {
        setNotes(result.data || []);
      } else {
        console.error('StudyNotes: Failed to fetch notes:', result.error);
      }
    } catch (error) {
      console.error('StudyNotes: Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save function for notes
  const autoSaveNote = async (noteId: string, noteData: Partial<StudyNote>) => {
    if (!user?.id) return;

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      setAutoSaving(true);
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          userId: user.id,
          ...noteData
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNotes(notes => notes.map(note => 
          note.id === noteId ? result.data : note
        ));
      } else {
        console.error('StudyNotes: Auto-save failed:', result.error);
      }
    } catch (error) {
      console.error('StudyNotes: Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const createNote = async () => {
    if (!user?.id || !newNote.title.trim() || !newNote.content.trim() || !newNote.subject) {
      console.log('StudyNotes: Missing required fields for note creation');
      return;
    }

    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        console.log('StudyNotes: User session not found for note creation');
        return;
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          userId: user.id,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          subject: newNote.subject,
          color: SUBJECT_COLORS[newNote.subject] || newNote.color
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotes([result.data, ...notes]);
        setNewNote({ title: '', content: '', subject: '', color: '#A0FAB2' });
        setIsCreating(false);
      } else {
        console.error('StudyNotes: Failed to create note:', result.error);
      }
    } catch (error) {
      console.error('StudyNotes: Error creating note:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!user?.id || !editNote.title.trim() || !editNote.content.trim() || !editNote.subject) {
      console.log('StudyNotes: Missing required fields for note update');
      return;
    }

    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        console.log('StudyNotes: User session not found for note update');
        return;
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          userId: user.id,
          title: editNote.title.trim(),
          content: editNote.content.trim(),
          subject: editNote.subject,
          color: SUBJECT_COLORS[editNote.subject] || editNote.color
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotes(notes.map(note => 
          note.id === noteId ? result.data : note
        ));
        setEditingNote(null);
        setEditNote({ title: '', content: '', subject: '', color: '#A0FAB2' });
      } else {
        console.error('StudyNotes: Failed to update note:', result.error);
      }
    } catch (error) {
      console.error('StudyNotes: Error updating note:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        console.log('StudyNotes: User session not found for note deletion');
        return;
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotes(notes.filter(note => note.id !== noteId));
      } else {
        console.error('StudyNotes: Failed to delete note:', result.error);
      }
    } catch (error) {
      console.error('StudyNotes: Error deleting note:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: StudyNote) => {
    setEditingNote(note.id);
    setEditNote({
      title: note.title,
      content: note.content,
      subject: note.subject,
      color: note.color
    });
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditNote({ title: '', content: '', subject: '', color: '#A0FAB2' });
  };

  const handleSubjectChange = (subject: string, isEdit = false) => {
    const color = SUBJECT_COLORS[subject] || '#A0FAB2';
    if (isEdit) {
      setEditNote(prev => ({ ...prev, subject, color }));
    } else {
      setNewNote(prev => ({ ...prev, subject, color }));
    }
  };

  // Filter notes based on search term and subject filter
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || filterSubject === 'all' || note.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 pb-4 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Study Notes</h2>
          <Badge variant="outline" className="ml-2">
            {notes.length} notes
          </Badge>
          {autoSaving && (
            <Badge variant="outline" className="ml-2 animate-pulse">
              Auto-saving...
            </Badge>
          )}
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 text-white" transition-all duration-300
          disabled={isCreating}
          data-testid="create-note-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Note
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-notes"
          />
        </div>
        <div className="sm:w-48">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger data-testid="filter-subject">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {COMMON_SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: SUBJECT_COLORS[subject] }}
                    />
                    <span>{subject}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Create New Study Note</CardTitle>
            <CardDescription>Add a new note for your studies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Title *</label>
              <Input
                placeholder="Enter note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                data-testid="new-note-title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Subject *</label>
              <Select 
                value={newNote.subject} 
                onValueChange={(subject) => handleSubjectChange(subject, false)}
              >
                <SelectTrigger data-testid="new-note-subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SUBJECTS.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: SUBJECT_COLORS[subject] }}
                        />
                        <span>{subject}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Content *</label>
              <Textarea
                placeholder="Write your note content here..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                data-testid="new-note-content"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Button 
                onClick={createNote} 
                disabled={loading}
                className="bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 text-white" transition-all duration-300
                data-testid="save-note-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Note"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: '', content: '', subject: '', color: '#A0FAB2' });
                }}
                disabled={loading}
                data-testid="cancel-note-btn"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {loading && notes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading notes...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {notes.length === 0 ? "No notes yet" : "No notes match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {notes.length === 0 
                ? "Create your first study note to get started" 
                : "Try adjusting your search terms or filters"
              }
            </p>
            {notes.length === 0 && !isCreating && (
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary/80 hover:shadow-xl hover:scale-105 text-white" transition-all duration-300
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note, index) => {
            const colors = ['#0C332C', '#A0FAB2', '#151314', '#0C332C', '#a28ff9', '#a4f5a6'];
            const bgColor = colors[index % colors.length];
            const isLight = ['#A0FAB2', '#a4f5a6'].includes(bgColor);
            const textColor = isLight ? '#000000' : '#ffffff';
            
            return (
              <div
                key={note.id}
                className="rounded-2xl p-5 transition-all duration-200 hover:scale-105 hover:shadow-lg" transition-all duration-300
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {editingNote === note.id ? (
                      <Input
                        value={editNote.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setEditNote(prev => ({ ...prev, title: newTitle }));
                          debouncedAutoSave(note.id, { title: newTitle.trim() });
                        }}
                        className="text-lg font-semibold bg-transparent border-white/30 shadow-none placeholder:text-white/70 focus-visible:ring-white/30"
                        style={{ color: textColor }}
                        data-testid={`edit-title-${note.id}`}
                      />
                    ) : (
                      <h3 
                        className="text-lg font-bold truncate mb-1" 
                        style={{ color: textColor }}
                        title={note.title}
                      >
                        {note.title}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {editingNote === note.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateNote(note.id)}
                          disabled={loading}
                          className="p-2 hover:bg-white/20" transition-all duration-300
                          style={{ color: textColor }}
                          data-testid={`save-edit-${note.id}`}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={loading}
                          className="p-2 hover:bg-white/20" transition-all duration-300
                          style={{ color: textColor }}
                          data-testid={`cancel-edit-${note.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                          disabled={loading}
                          className="p-2 hover:bg-white/20" transition-all duration-300
                          style={{ color: textColor }}
                          data-testid={`edit-${note.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNote(note.id)}
                          disabled={loading}
                          className="p-2 hover:bg-white/20" transition-all duration-300
                          style={{ color: textColor }}
                          data-testid={`delete-${note.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                      color: textColor 
                    }}
                  >
                    {note.subject}
                  </span>
                </div>

                {editingNote === note.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editNote.content}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        setEditNote(prev => ({ ...prev, content: newContent }));
                        debouncedAutoSave(note.id, { content: newContent.trim() });
                      }}
                      rows={4}
                      className="text-sm bg-transparent border-white/30 placeholder:text-white/70 focus-visible:ring-white/30"
                      style={{ color: textColor }}
                      data-testid={`edit-content-${note.id}`}
                    />
                    <Select 
                      value={editNote.subject} 
                      onValueChange={(subject) => {
                        handleSubjectChange(subject, true);
                        debouncedAutoSave(note.id, { subject, color: SUBJECT_COLORS[subject] || '#A0FAB2' });
                      }}
                    >
                      <SelectTrigger className="w-40 bg-transparent border-white/30" style={{ color: textColor }}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SUBJECTS.map(subject => (
                          <SelectItem key={subject} value={subject}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: SUBJECT_COLORS[subject] }}
                              />
                              <span>{subject}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-4 leading-relaxed opacity-90" style={{ color: textColor }}>
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs opacity-75" style={{ color: textColor }}>
                      <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyNotes;
