import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Mail,
  MailOpen,
  Star,
  Trash2,
  Reply,
  Loader2,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';

interface EmailMessage {
  id: string;
  emailAccountId: string;
  messageId: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  isRead: boolean;
  isReplied: boolean;
  isStarred: boolean;
  receivedAt: string;
  account?: {
    id: string;
    email: string;
    displayName: string;
  };
  replies?: EmailReply[];
}

interface EmailReply {
  id: string;
  to: string;
  cc?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  sentAt: string;
}

interface AdminEmailInboxProps {
  onNavigate?: (page: string) => void;
}

interface QuickResponse {
  id: number;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  isActive: boolean;
}

export default function AdminEmailInbox({ onNavigate }: AdminEmailInboxProps) {
  
  const { profile } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [quickResponseQuery, setQuickResponseQuery] = useState('');
  const [selectedQuickResponseIndex, setSelectedQuickResponseIndex] = useState(0);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if user is support staff (admin, moderator, or customer_service)
  const isSupportStaff = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'customer_service';

  // Debug logging for quick responses
  console.log('📋 Email Inbox - Quick Response Debug:', {
    profileRole: profile?.role,
    isSupportStaff,
    hasProfile: !!profile
  });

  const { data: emails = [], isLoading } = useQuery<EmailMessage[]>({
    queryKey: ["/api/email/messages"],
    refetchInterval: false, // Disabled auto-polling to reduce database egress - use manual refresh
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch quick responses for "/" trigger (support staff only)
  const { data: quickResponses = [], isLoading: quickResponsesLoading, error: quickResponsesError } = useQuery<QuickResponse[]>({
    queryKey: ['/api/quick-responses/active'],
    queryFn: async () => {
      console.log('📋 Fetching quick responses...');
      const response = await apiRequest('/api/quick-responses/active');
      console.log('📋 Quick responses API response:', response);
      // Handle both wrapped and unwrapped responses
      const result = Array.isArray(response) ? response : (response.data || []);
      console.log('📋 Quick responses result:', result);
      return result;
    },
    enabled: isSupportStaff
  });

  // Log quick responses state
  console.log('📋 Quick responses state:', {
    quickResponses,
    count: quickResponses.length,
    loading: quickResponsesLoading,
    error: quickResponsesError
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for email updates');
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          ws?.send(JSON.stringify({
            type: 'auth',
            userId: userData.userId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_email') {
            console.log('New email received via WebSocket:', data.email);
            queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
            
      // Silent operation - AJAX only
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const { data: emailDetail } = useQuery<EmailMessage>({
    queryKey: ["/api/email/messages", selectedEmail?.id],
    enabled: !!selectedEmail?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      return apiRequest(`/api/email/messages/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      if (selectedEmail) {
        queryClient.invalidateQueries({ queryKey: ["/api/email/messages", selectedEmail.id] });
      }
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ id, textBody }: { id: string; textBody: string }) => {
      return apiRequest(`/api/email/messages/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ textBody }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      if (selectedEmail) {
        queryClient.invalidateQueries({ queryKey: ["/api/email/messages", selectedEmail.id] });
      }
      setIsReplyDialogOpen(false);
      setReplyText("");
      // Silent operation - AJAX only
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email/messages/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/messages"] });
      setSelectedEmail(null);
      // Silent operation - AJAX only
    },
  });

  const handleEmailClick = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate({ id: email.id, isRead: true });
    }
  };

  const handleReply = () => {
    if (selectedEmail && replyText.trim()) {
      sendReplyMutation.mutate({
        id: selectedEmail.id,
        textBody: replyText,
      });
    }
  };

  // Handle reply text changes with quick response detection
  const handleReplyTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReplyText(value);

    // Check for quick response trigger (only for support staff)
    if (isSupportStaff) {
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
    }
  }, [isSupportStaff]);

  // Filter quick responses based on query
  const filteredQuickResponses = quickResponses.filter((response: QuickResponse) => 
    response.shortcut?.toLowerCase().includes(quickResponseQuery.toLowerCase()) ||
    response.title.toLowerCase().includes(quickResponseQuery.toLowerCase())
  );

  // Insert quick response
  const insertQuickResponse = useCallback((response: QuickResponse) => {
    const textarea = replyTextareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart || 0;
    const textBeforeCursor = replyText.substring(0, cursorPosition);
    const textAfterCursor = replyText.substring(cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const newText = textBeforeCursor.substring(0, lastSlashIndex) + response.content + textAfterCursor;
      setReplyText(newText);
      setShowQuickResponses(false);
      
      // Set cursor position after the inserted content
      setTimeout(() => {
        const newCursorPosition = lastSlashIndex + response.content.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
      }, 0);
    }
  }, [replyText]);

  // Handle keyboard navigation for quick responses
  const handleReplyKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            insertQuickResponse(filteredQuickResponses[selectedQuickResponseIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowQuickResponses(false);
          break;
      }
    }
  }, [showQuickResponses, filteredQuickResponses, selectedQuickResponseIndex, insertQuickResponse]);

  const currentEmail = emailDetail || selectedEmail;

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("admin-dashboard");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-email-inbox">Email Inbox</h1>
          <p className="text-muted-foreground">
            View and reply to emails from all configured accounts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              All Messages ({emails.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No emails found</p>
                <p className="text-sm text-muted-foreground">
                  Sync your email accounts to see messages
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedEmail?.id === email.id ? "bg-accent" : ""
                    } ${!email.isRead ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                    onClick={() => handleEmailClick(email)}
                    data-testid={`email-item-${email.id}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {email.isRead ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="font-semibold text-sm truncate max-w-[150px]">
                          {email.from}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate mb-1">{email.subject}</p>
                    {email.textBody && (
                      <p className="text-xs text-muted-foreground truncate">
                        {email.textBody.substring(0, 60)}...
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {email.isReplied && (
                        <Badge variant="outline" className="text-xs">
                          <Reply className="w-3 h-3 mr-1" />
                          Replied
                        </Badge>
                      )}
                      {email.account && (
                        <Badge variant="secondary" className="text-xs">
                          {email.account.email}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Email Detail */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmail(null)}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <span>Email Details</span>
              </div>
              {currentEmail && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplyDialogOpen(true)}
                    data-testid="button-reply"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteEmailMutation.mutate(currentEmail.id)}
                    disabled={deleteEmailMutation.isPending}
                    data-testid="button-delete-email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentEmail ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select an email to view its contents
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {/* Email Header */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold" data-testid="text-email-subject">
                      {currentEmail.subject}
                    </h2>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex gap-2">
                        <span className="font-semibold">From:</span>
                        <span className="text-muted-foreground" data-testid="text-email-from">
                          {currentEmail.from}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-semibold">To:</span>
                        <span className="text-muted-foreground" data-testid="text-email-to">
                          {currentEmail.to}
                        </span>
                      </div>
                      {currentEmail.cc && (
                        <div className="flex gap-2">
                          <span className="font-semibold">CC:</span>
                          <span className="text-muted-foreground">{currentEmail.cc}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <span className="font-semibold">Date:</span>
                        <span className="text-muted-foreground">
                          {new Date(currentEmail.receivedAt).toLocaleString()}
                        </span>
                      </div>
                      {currentEmail.account && (
                        <div className="flex gap-2">
                          <span className="font-semibold">Received by:</span>
                          <Badge variant="secondary">
                            {currentEmail.account.displayName} ({currentEmail.account.email})
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Email Body */}
                  <div className="prose max-w-none" data-testid="content-email-body">
                    {currentEmail.htmlBody ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: currentEmail.htmlBody }}
                        className="email-content"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">
                        {currentEmail.textBody}
                      </pre>
                    )}
                  </div>

                  {/* Replies */}
                  {currentEmail.replies && currentEmail.replies.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-semibold">Replies ({currentEmail.replies.length})</h3>
                        {currentEmail.replies.map((reply) => (
                          <Card key={reply.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="flex justify-between mb-2">
                                <span className="font-semibold">To: {reply.to}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(reply.sentAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-semibold mb-2">{reply.subject}</p>
                              {reply.htmlBody ? (
                                <div dangerouslySetInnerHTML={{ __html: reply.htmlBody }} />
                              ) : (
                                <pre className="whitespace-pre-wrap font-sans text-sm">
                                  {reply.textBody}
                                </pre>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Email</DialogTitle>
            <DialogDescription>
              {currentEmail && (
                <div className="space-y-1 mt-2">
                  <div className="flex gap-2 text-sm">
                    <span className="font-semibold">From:</span>
                    <span>{currentEmail.account?.displayName} ({currentEmail.account?.email})</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-semibold">To:</span>
                    <span>{currentEmail.from}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-semibold">Subject:</span>
                    <span>Re: {currentEmail.subject}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replyText">Your Reply</Label>
              <div className="relative">
                <Textarea
                  ref={replyTextareaRef}
                  id="replyText"
                  placeholder="Type your reply here... (Use / for quick responses)"
                  value={replyText}
                  onChange={handleReplyTextChange}
                  onKeyDown={handleReplyKeyDown}
                  rows={10}
                  data-testid="textarea-reply"
                />
                {/* Quick Response Dropdown */}
                {showQuickResponses && filteredQuickResponses.length > 0 && (
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    {filteredQuickResponses.map((response, index) => (
                      <button
                        key={response.id}
                        type="button"
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          index === selectedQuickResponseIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                        onClick={() => insertQuickResponse(response)}
                        data-testid={`quick-response-${response.id}`}
                      >
                        <div className="font-medium text-sm">{response.title}</div>
                        {response.shortcut && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">/{response.shortcut}</div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{response.content}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
              data-testid="button-cancel-reply"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={sendReplyMutation.isPending || !replyText.trim()}
              data-testid="button-send-reply"
            >
              {sendReplyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Reply className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
