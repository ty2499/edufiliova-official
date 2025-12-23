import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, XCircle, Clock, Database, Globe, Shield, CreditCard, FileText, Wifi, HelpCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

interface SystemError {
  id: string;
  occurredAt: string;
  severity: "critical" | "error" | "warning" | "info";
  category: "database" | "api" | "validation" | "auth" | "payment" | "file" | "network" | "unknown";
  source: string;
  endpoint?: string;
  method?: string;
  userRoleContext?: string;
  userId?: string;
  message: string;
  userFriendlyMessage?: string;
  stack?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedNotes?: string;
}

interface ErrorStats {
  unresolved: number;
  critical: number;
  today: number;
  byCategory: Record<string, number>;
}

const SEVERITY_COLORS = {
  critical: "bg-primary/15 text-red-800 border-red-200",
  error: "bg-primary/15 text-primary border-orange-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  info: "bg-blue-100 text-blue-800 border-blue-200"
};

const CATEGORY_ICONS: Record<string, any> = {
  database: Database,
  api: Globe,
  validation: AlertTriangle,
  auth: Shield,
  payment: CreditCard,
  file: FileText,
  network: Wifi,
  unknown: HelpCircle
};

export function SystemErrorsPanel() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("unresolved");
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [ajaxStatus, setAjaxStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/system-errors/stats'],
  });

  const { data: errorsData, isLoading: errorsLoading, refetch } = useQuery({
    queryKey: ['/api/admin/system-errors', { severity: severityFilter, category: categoryFilter, resolved: resolvedFilter }],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ errorId, notes }: { errorId: string; notes: string }) => {
      setAjaxStatus({ type: 'loading', message: 'Resolving error...' });
      return apiRequest(`/api/admin/system-errors/${errorId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      setAjaxStatus({ type: 'success', message: 'Error marked as resolved!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-errors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-errors/stats'] });
      setResolveDialogOpen(false);
      setSelectedError(null);
      setResolveNotes("");
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
    onError: (error: any) => {
      setAjaxStatus({ type: 'error', message: error.message || 'Failed to resolve error' });
      setTimeout(() => setAjaxStatus({ type: 'idle', message: '' }), 3000);
    },
  });

  const stats = (statsData as any)?.data as ErrorStats | undefined;
  const errors = ((errorsData as any)?.data || []) as SystemError[];

  const handleResolve = (error: SystemError) => {
    setSelectedError(error);
    setResolveDialogOpen(true);
  };

  const confirmResolve = () => {
    if (selectedError) {
      resolveMutation.mutate({ errorId: selectedError.id, notes: resolveNotes });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || HelpCircle;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {ajaxStatus.type !== 'idle' && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          ajaxStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
          ajaxStatus.type === 'success' ? 'bg-green-50 text-green-700' :
          'bg-primary/10 text-primary'
        }`} data-testid="ajax-status-inline">
          {ajaxStatus.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {ajaxStatus.type === 'success' && <CheckmarkIcon size="sm" variant="success" />}
          {ajaxStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{ajaxStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="card-unresolved-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unresolved</p>
                <p className="text-2xl font-bold text-primary">{stats?.unresolved || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-critical-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <p className="text-2xl font-bold text-primary">{stats?.critical || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-today-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.today || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-resolved-action">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-sm font-medium text-green-600">System Active</p>
              </div>
              <CheckmarkIcon size="xl" variant="success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-error-filters">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">System Errors</CardTitle>
              <CardDescription>Technical errors for admin review only</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-errors">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-severity-filter">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-resolved-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-gray-500" data-testid="no-errors-message">
              <CheckmarkIcon size="2xl" variant="success" className="mx-auto mb-4" />
              <p className="text-lg font-medium">No errors found</p>
              <p className="text-sm">The system is running smoothly</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className={`border rounded-lg p-4 ${error.resolved ? 'bg-gray-50 opacity-75' : 'bg-white'}`}
                  data-testid={`error-item-${error.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getCategoryIcon(error.category)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={SEVERITY_COLORS[error.severity]} data-testid={`badge-severity-${error.id}`}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="capitalize" data-testid={`badge-category-${error.id}`}>
                            {error.category}
                          </Badge>
                          {error.resolved && (
                            <Badge className="bg-green-100 text-green-800" data-testid={`badge-resolved-${error.id}`}>
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 break-words" data-testid={`error-message-${error.id}`}>
                          {error.message.slice(0, 150)}{error.message.length > 150 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(error.occurredAt)}</span>
                          {error.endpoint && <span className="font-mono">{error.method} {error.endpoint}</span>}
                          {error.userRoleContext && <span>Role: {error.userRoleContext}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                        data-testid={`button-expand-${error.id}`}
                      >
                        {expandedError === error.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {!error.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(error)}
                          data-testid={`button-resolve-${error.id}`}
                        >
                          <CheckmarkIcon size="sm" variant="success" className="mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedError === error.id && (
                    <div className="mt-4 pt-4 border-t space-y-4" data-testid={`error-details-${error.id}`}>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Full Error Message</h4>
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
                          {error.message}
                        </pre>
                      </div>

                      {error.userFriendlyMessage && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">User-Facing Message</h4>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{error.userFriendlyMessage}</p>
                        </div>
                      )}

                      {error.stack && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Stack Trace</h4>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Additional Details</h4>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {error.resolved && (
                        <div className="bg-green-50 p-3 rounded">
                          <h4 className="text-sm font-medium text-green-700 mb-1">Resolution Details</h4>
                          <p className="text-sm text-green-600">Resolved by: {error.resolvedBy}</p>
                          <p className="text-sm text-green-600">Resolved at: {error.resolvedAt ? formatDate(error.resolvedAt) : 'N/A'}</p>
                          {error.resolvedNotes && <p className="text-sm text-green-600 mt-1">Notes: {error.resolvedNotes}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent data-testid="resolve-error-dialog">
          <DialogHeader>
            <DialogTitle>Resolve Error</DialogTitle>
            <DialogDescription>
              Mark this error as resolved. Add optional notes about how it was fixed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedError && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">{selectedError.message.slice(0, 100)}...</p>
                <p className="text-gray-500 text-xs mt-1">{formatDate(selectedError.occurredAt)}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Resolution Notes (Optional)</label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe how the error was fixed..."
                rows={3}
                data-testid="resolve-notes-textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} data-testid="button-cancel-resolve">
              Cancel
            </Button>
            <Button
              onClick={confirmResolve}
              disabled={resolveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-resolve"
            >
              {resolveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resolving...</>
              ) : (
                <><CheckmarkIcon size="sm" variant="success" className="mr-2" /> Mark Resolved</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
