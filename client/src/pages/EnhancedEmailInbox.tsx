import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useWhatsAppSocket } from "@/hooks/useWhatsAppSocket";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  File,
  Mail,
  Search,
  Plus,
  Loader2,
  Check,
  CheckCheck,
  Download,
  X,
  Trash2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import type { EmailMessage, EmailAccount } from "@shared/schema";

interface EmailAttachment {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'image' | 'document';
}

interface EmailReply {
  id: string;
  textBody: string;
  htmlBody?: string | null;
  to: string;
  subject: string;
  sentAt: Date;
  attachments?: EmailAttachment[] | null;
}

interface EmailWithReplies extends EmailMessage {
  account?: {
    id: string;
    email: string;
    displayName: string;
  };
  replies?: EmailReply[];
}

interface ConversationThread {
  subject: string;
  participants: string[];
  lastMessage: Date;
  messages: EmailWithReplies[];
  unreadCount: number;
}

interface QuickResponse {
  id: number;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  isActive: boolean;
}

interface EnhancedEmailInboxProps {
  onNavigate?: (page: string) => void;
}

export default function EnhancedEmailInbox({ onNavigate }: EnhancedEmailInboxProps = {}) {
  const [selectedThreadSubject, setSelectedThreadSubject] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeToType, setComposeToType] = useState<"individual" | "group">("individual");
  const [composeToValue, setComposeToValue] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<EmailAttachment[]>([]);
  const [composeAccountId, setComposeAccountId] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<ConversationThread | null>(null);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const composeImageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  
  // WebSocket for real-time updates
  const { wsRef } = useWhatsAppSocket();

  // Fetch email messages - WebSocket handles real-time updates
  const { data: emailMessages = [], isLoading } = useQuery<EmailWithReplies[]>({
    queryKey: ["/api/email/messages"],
    staleTime: 60 * 1000, // Cache for 1 minute (WebSocket provides instant updates)
    refetchOnWindowFocus: true,
  });

  // Fetch configured email accounts for the "From" selector
  const { data: configuredEmailAccounts = [] } = useQuery<EmailAccount[]>({
    queryKey: ["/api/email/accounts"],
  });

  // Fetch quick responses for "/" trigger (admin and customer service only)
  const { data: quickResponses = [] } = useQuery<QuickResponse[]>({
    queryKey: ['/api/quick-responses/active'],
    enabled: true, // Enable quick responses for admin and customer service
  });

  // Set default account when accounts are loaded or when dialog opens
  useEffect(() => {
    if (configuredEmailAccounts.length > 0 && !composeAccountId && showComposeDialog) {
      setComposeAccountId(configuredEmailAccounts[0].id);
    }
  }, [configuredEmailAccounts, composeAccountId, showComposeDialog]);
  
  // Listen for real-time email updates via WebSocket
  useEffect(() => {
    if (!wsRef?.current) return;
    
    const handleNewEmail = (data: any) => {
      console.log('New email received via WebSocket:', data);
      // Instantly refresh email messages
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      
      // Show toast notification
      // Silent operation - AJAX only
    };
    
    const handleNewReply = (data: any) => {
      console.log('New reply via WebSocket:', data);
      // Instantly refresh to show new reply
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
    };
    
    // Listen for email events
    wsRef.current.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_email') {
        handleNewEmail(message.data);
      } else if (message.type === 'new_email_reply') {
        handleNewReply(message.data);
      }
    });
  }, [wsRef]);

  // Get the first email account to determine which emails are sent vs received
  const emailAccounts = emailMessages.map(m => m.account?.email).filter(Boolean);
  const primaryAccount = emailAccounts[0] || '';

  // Group messages by subject (conversation threading)
  const conversationThreads: ConversationThread[] = emailMessages.reduce((threads: ConversationThread[], message) => {
    const threadSubject = message.subject.replace(/^(Re:|Fwd:|Fw:)\s*/i, '').trim();
    let thread = threads.find(t => t.subject.toLowerCase() === threadSubject.toLowerCase());
    
    // Determine if this is a sent or received message
    const isSentMessage = message.from === message.account?.email || message.from === primaryAccount;
    // For sent messages, the participant is the recipient (to)
    // For received messages, the participant is the sender (from)
    const participant = isSentMessage ? message.to : message.from;
    
    if (!thread) {
      thread = {
        subject: threadSubject,
        participants: [participant],
        lastMessage: new Date(message.receivedAt),
        messages: [],
        unreadCount: 0
      };
      threads.push(thread);
    }
    
    // Add participant if not already in list
    if (!thread.participants.includes(participant)) {
      thread.participants.push(participant);
    }
    
    thread.messages.push(message);
    
    // Update last message time
    const messageDate = new Date(message.receivedAt);
    if (messageDate > thread.lastMessage) {
      thread.lastMessage = messageDate;
    }
    
    // Count unread messages
    if (!message.isRead) {
      thread.unreadCount++;
    }
    
    return threads;
  }, []).map(thread => ({
    ...thread,
    // Sort messages within thread chronologically (oldest first, newest last - like WhatsApp)
    messages: thread.messages.sort((a, b) => 
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    )
  }));

  // Sort threads by last message time
  const sortedThreads = conversationThreads
    .filter(thread => 
      !searchQuery || 
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());

  // Derive the selected thread from current data (prevents stale state)
  const selectedThread = selectedThreadSubject 
    ? sortedThreads.find(t => t.subject === selectedThreadSubject) || null
    : null;

  // Auto-scroll to bottom when new messages arrive or thread is selected (WhatsApp style)
  useEffect(() => {
    if (selectedThread) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedThread?.messages, selectedThread?.subject]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("admin-dashboard");
    }
  };

  // Manual email sync function
  const handleSyncEmails = async () => {
    if (!configuredEmailAccounts.length) {
      console.error('No email accounts configured');
      return;
    }
    
    setIsSyncing(true);
    try {
      // Sync all configured email accounts
      for (const account of configuredEmailAccounts) {
        await apiRequest(`/api/email/accounts/${account.id}/sync`, {
          method: 'POST',
        });
      }
      
      // Wait a bit for sync to complete then refresh
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
        setIsSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to sync emails:', error);
      setIsSyncing(false);
    }
  };

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({messageId, textBody, attachments}: {messageId: string, textBody: string, attachments: EmailAttachment[]}) => {
      return apiRequest(`/api/email/messages/${messageId}/reply`, {
        method: "POST",
        body: JSON.stringify({ 
          textBody,
          attachments: attachments.length > 0 ? attachments : undefined
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      setMessageInput("");
      setAttachments([]);
      // Silent operation - AJAX only
    },
    onError: (error: Error) => {
      // Silent operation - AJAX only
    },
  });

  // Send new email mutation
  const sendNewEmailMutation = useMutation({
    mutationFn: async ({to, subject, textBody, attachments, accountId}: {to: string, subject: string, textBody: string, attachments: EmailAttachment[], accountId?: string}) => {
      return apiRequest('/api/email/send', {
        method: "POST",
        body: JSON.stringify({ 
          to,
          subject,
          textBody,
          accountId,
          attachments: attachments.length > 0 ? attachments : undefined
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      setShowComposeDialog(false);
      setComposeToType("individual");
      setComposeToValue("");
      setComposeSubject("");
      setComposeMessage("");
      setComposeAttachments([]);
      setComposeAccountId("");
      // Silent operation - AJAX only
    },
    onError: (error: Error) => {
      // Silent operation - AJAX only
    },
  });

  // File upload handler for reply
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await apiRequest('/api/email/attachments/upload', {
        method: 'POST',
        body: formData,
      });
      
      setAttachments([...attachments, result]);
      // Silent operation - AJAX only
      
      // Reset file inputs
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      // Silent operation - AJAX only
      
      // Reset file inputs on error too
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  // File upload handler for compose dialog
  const handleComposeFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await apiRequest('/api/email/attachments/upload', {
        method: 'POST',
        body: formData,
      });
      
      setComposeAttachments([...composeAttachments, result]);
      // Silent operation - AJAX only
      
      // Reset file inputs
      if (composeImageInputRef.current) composeImageInputRef.current.value = '';
      if (composeFileInputRef.current) composeFileInputRef.current.value = '';
    } catch (error) {
      // Silent operation - AJAX only
      
      // Reset file inputs on error too
      if (composeImageInputRef.current) composeImageInputRef.current.value = '';
      if (composeFileInputRef.current) composeFileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    if (!selectedThread || selectedThread.messages.length === 0) return;

    // Get the first message ID to reply to
    const firstMessage = selectedThread.messages[0];
    sendReplyMutation.mutate({
      messageId: firstMessage.id,
      textBody: messageInput || "(Attachment)",
      attachments
    });
  };

  const handleSendCompose = () => {
    if (!composeToValue.trim() || !composeSubject.trim() || !composeMessage.trim()) {
      // Silent operation - AJAX only
      return;
    }

    sendNewEmailMutation.mutate({
      to: composeToValue,
      subject: composeSubject,
      textBody: composeMessage,
      attachments: composeAttachments,
      accountId: composeAccountId || undefined
    });
  };

  const handleSelectThread = async (thread: ConversationThread) => {
    setSelectedThreadSubject(thread.subject);
    
    // Mark all unread messages in this thread as read
    const unreadMessages = thread.messages.filter(msg => !msg.isRead);
    for (const message of unreadMessages) {
      try {
        await apiRequest(`/api/email/messages/${message.id}/read`, {
          method: 'PATCH',
          body: JSON.stringify({ isRead: true }),
        });
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
    
    // Refresh to update unread counts
    if (unreadMessages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
    }
  };

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (thread: ConversationThread) => {
      // Delete all messages in this thread
      for (const message of thread.messages) {
        await apiRequest(`/api/email/messages/${message.id}`, {
          method: "DELETE",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      setSelectedThreadSubject(null);
      // Silent operation - AJAX only
    },
    onError: (error: Error) => {
      // Silent operation - AJAX only
    },
  });

  const handleDeleteThread = (e: React.MouseEvent, thread: ConversationThread) => {
    e.stopPropagation();
    setThreadToDelete(thread);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (threadToDelete) {
      deleteConversationMutation.mutate(threadToDelete);
    }
    setShowDeleteDialog(false);
    setThreadToDelete(null);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    // Remove any quotes and trim the email
    const cleanEmail = email.replace(/["']/g, '').trim();
    const name = cleanEmail.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Filter quick responses based on query
  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => 
    response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
    response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
  );

  // Insert quick response
  const insertQuickResponse = useCallback((response: QuickResponse) => {
    const input = messageInputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const textBeforeCursor = messageInput.substring(0, cursorPosition);
    const textAfterCursor = messageInput.substring(cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const newText = textBeforeCursor.substring(0, lastSlashIndex) + response.content + textAfterCursor;
      setMessageInput(newText);
      setShowQuickResponses(false);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        const newCursorPosition = lastSlashIndex + response.content.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
      }, 0);
    }
  }, [messageInput]);

  // Handle message input changes with quick response detection
  const handleMessageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for quick response trigger
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const query = textBeforeCursor.substring(lastSlashIndex + 1);
      if (query.length >= 0) {
        setQuickResponseQuery(query);
        setShowQuickResponses(true);
        setSelectedQuickResponseIndex(0);
      }
    } else {
      setShowQuickResponses(false);
    }
  }, []);

  // Handle keyboard navigation for quick responses
  const handleMessageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showQuickResponses && filteredQuickResponses.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev < filteredQuickResponses.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedQuickResponseIndex(prev => 
            prev > 0 ? prev - 1 : filteredQuickResponses.length - 1
          );
          break;
        case 'Tab':
          if (filteredQuickResponses.length > 0) {
            e.preventDefault();
            insertQuickResponse(filteredQuickResponses[selectedQuickResponseIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowQuickResponses(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [showQuickResponses, filteredQuickResponses, selectedQuickResponseIndex, insertQuickResponse]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Thread List Sidebar - Hidden on mobile when thread selected */}
      <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r bg-white dark:bg-gray-800 flex-col`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Messages</h1>
                <p className="text-xs text-muted-foreground">{conversationThreads.length} conversations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSyncEmails}
                disabled={isSyncing}
                data-testid="button-sync"
                title="Sync emails"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowComposeDialog(true)}
                data-testid="button-compose"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1">
          {sortedThreads.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div>
              {sortedThreads.map((thread, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectThread(thread)}
                  className={`group p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedThreadSubject === thread.subject ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                  }`}
                  data-testid={`thread-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold flex-shrink-0">
                      {getInitials(thread.participants[0])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{thread.subject || "(No Subject)"}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground ml-2">{formatTime(thread.lastMessage)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-opacity"
                            onClick={(e) => handleDeleteThread(e, thread)}
                            disabled={deleteConversationMutation.isPending}
                            data-testid={`button-delete-thread-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.participants.join(', ')}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-green-500 rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Hidden on mobile when no thread selected */}
      <div className={`${selectedThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full`}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b bg-white dark:bg-gray-800 flex items-center gap-3">
              {/* Mobile back button */}
              <button
                onClick={() => setSelectedThreadSubject(null)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                data-testid="button-back-mobile"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold">
                {getInitials(selectedThread.participants[0])}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base sm:text-lg truncate">{selectedThread.subject || "(No Subject)"}</h2>
                <p className="text-sm text-muted-foreground truncate">{selectedThread.participants.join(', ')}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#e5ddd5] dark:bg-gray-900" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-1">
                {(() => {
                  // Flatten all messages into a single chronological timeline
                  const allMessages: Array<{
                    id: string;
                    from: string;
                    timestamp: Date;
                    textBody: string;
                    htmlBody?: unknown;
                    attachments?: any[];
                    isOutgoing: boolean;
                  }> = [];

                  selectedThread.messages.forEach((message) => {
                    // Determine if this is a sent or received message
                    const isSentMessage = message.from === message.account?.email || message.from === primaryAccount;
                    
                    // Add the original message (sent or received)
                    allMessages.push({
                      id: message.id,
                      from: isSentMessage ? 'You' : message.from,
                      timestamp: new Date(message.receivedAt),
                      textBody: message.textBody || '',
                      htmlBody: message.htmlBody,
                      attachments: message.attachments as any[] || undefined,
                      isOutgoing: isSentMessage
                    });

                    // Add all replies
                    if (message.replies && Array.isArray(message.replies)) {
                      message.replies.forEach((reply) => {
                        allMessages.push({
                          id: reply.id,
                          from: 'You',
                          timestamp: new Date(reply.sentAt),
                          textBody: reply.textBody,
                          attachments: reply.attachments as any[] || undefined,
                          isOutgoing: true
                        });
                      });
                    }
                  });

                  // Sort all messages chronologically
                  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                  // Render all messages in order
                  return allMessages.map((msg) => (
                    <div key={msg.id} className={`flex mb-3 ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${msg.isOutgoing ? 'bg-[#d9fdd3] dark:bg-green-900 rounded-br-sm' : 'bg-white dark:bg-gray-800 rounded-bl-sm'}`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold ${msg.isOutgoing ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {msg.from}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {String(msg.textBody || (typeof msg.htmlBody === 'string' ? msg.htmlBody : ''))}
                        </div>
                        {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {(msg.attachments as any[])
                              .filter((att: any) => att && typeof att === 'object')
                              .map((attachment: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={String(attachment.url || '')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                                    msg.isOutgoing 
                                      ? 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700'
                                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                  <span className="truncate flex-1">{String(attachment.fileName || 'file')}</span>
                                  <Download className="w-3 h-3" />
                                </a>
                              ))}
                          </div>
                        )}
                        {msg.isOutgoing && (
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
                <div ref={messagesEndRef} className="h-1" />
              </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t bg-white dark:bg-gray-800 p-4">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm">
                      {attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                      <span className="truncate max-w-[200px]">{attachment.fileName}</span>
                      <button
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-attach-image"
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-attach-file"
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    placeholder="Type a message... (Use / for quick responses)"
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    onKeyDown={handleMessageInputKeyDown}
                    className="h-10 w-full"
                    data-testid="input-message"
                  />
                  
                  {/* Quick Response Dropdown */}
                  {showQuickResponses && filteredQuickResponses.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                      {filteredQuickResponses.map((response, index) => (
                        <div
                          key={response.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            index === selectedQuickResponseIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                          }`}
                          onClick={() => insertQuickResponse(response)}
                          data-testid={`quick-response-${response.id}`}
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {response.shortcut && (
                              <span className="text-blue-600 dark:text-blue-400 mr-2">/{response.shortcut}</span>
                            )}
                            {response.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {response.content.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && attachments.length === 0) || sendReplyMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white h-10 w-10 p-0 flex-shrink-0"
                  data-testid="button-send"
                >
                  {sendReplyMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose New Email</DialogTitle>
            <DialogDescription>Send a new email message</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="compose-from">From *</Label>
              <Select value={composeAccountId} onValueChange={setComposeAccountId}>
                <SelectTrigger id="compose-from" data-testid="select-compose-from">
                  <SelectValue placeholder="Select email account" />
                </SelectTrigger>
                <SelectContent>
                  {configuredEmailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} data-testid={`select-option-${account.email}`}>
                      {account.displayName} ({account.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="compose-to">To *</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={composeToType === "individual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setComposeToType("individual");
                    setComposeToValue("");
                  }}
                  data-testid="button-to-individual"
                >
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={composeToType === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setComposeToType("group");
                    setComposeToValue("");
                  }}
                  data-testid="button-to-group"
                >
                  Send to Group
                </Button>
              </div>
              
              {composeToType === "individual" ? (
                <Input
                  id="compose-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeToValue}
                  onChange={(e) => setComposeToValue(e.target.value)}
                  data-testid="input-compose-to"
                />
              ) : (
                <Select value={composeToValue} onValueChange={setComposeToValue}>
                  <SelectTrigger id="compose-to" data-testid="select-compose-to-group">
                    <SelectValue placeholder="Select a group to send to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_students" data-testid="option-all-students">
                      All Students
                    </SelectItem>
                    <SelectItem value="all_teachers" data-testid="option-all-teachers">
                      All Teachers
                    </SelectItem>
                    <SelectItem value="all_freelancers" data-testid="option-all-freelancers">
                      All Freelancers
                    </SelectItem>
                    <SelectItem value="all_customers" data-testid="option-all-customers">
                      All Customers
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="compose-subject">Subject *</Label>
              <Input
                id="compose-subject"
                placeholder="Email subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                data-testid="input-compose-subject"
              />
            </div>

            <div>
              <Label htmlFor="compose-message">Message *</Label>
              <Textarea
                id="compose-message"
                placeholder="Type your message here..."
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                rows={10}
                data-testid="input-compose-message"
              />
            </div>

            {/* Attachments Preview */}
            {composeAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {composeAttachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2">
                    {attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    <span className="text-sm truncate max-w-[200px]">{attachment.fileName}</span>
                    <button
                      onClick={() => setComposeAttachments(composeAttachments.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={composeImageInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleComposeFileUpload(e.target.files[0])}
            />
            <input
              type="file"
              ref={composeFileInputRef}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleComposeFileUpload(e.target.files[0])}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => composeImageInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-compose-attach-image"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                  Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => composeFileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-compose-attach-file"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Paperclip className="w-4 h-4 mr-2" />}
                  File
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowComposeDialog(false);
                    setComposeToType("individual");
                    setComposeToValue("");
                    setComposeSubject("");
                    setComposeMessage("");
                    setComposeAttachments([]);
                    setComposeAccountId("");
                  }}
                  data-testid="button-compose-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendCompose}
                  disabled={!composeToValue.trim() || !composeSubject.trim() || !composeMessage.trim() || !composeAccountId || sendNewEmailMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white"
                  data-testid="button-compose-send"
                >
                  {sendNewEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation with {threadToDelete?.participants.join(', ')}? 
              This action cannot be undone and will permanently delete all messages in this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setThreadToDelete(null)} data-testid="button-delete-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConversationMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteConversationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
