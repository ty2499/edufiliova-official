import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Plus, Trash2, Mail, RefreshCw, XCircle, Loader2, ArrowLeft, Pencil } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUsername: string;
  imapPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  isActive: boolean;
  syncStatus: string;
  syncError?: string;
  lastSyncedAt?: string;
}

interface AdminEmailManagementProps {
  onNavigate?: (page: string) => void;
}

export default function AdminEmailManagement({ onNavigate }: AdminEmailManagementProps) {
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    imapUsername: "",
    imapPassword: "",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: "",
    smtpPassword: "",
  });

  const { data: accounts = [], isLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/email/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/email/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      setFormData({
        email: "",
        displayName: "",
        imapHost: "",
        imapPort: 993,
        imapSecure: true,
        imapUsername: "",
        imapPassword: "",
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUsername: "",
        smtpPassword: "",
      });
      // Silent operation - AJAX only
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest(`/api/email/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      setFormData({
        email: "",
        displayName: "",
        imapHost: "",
        imapPort: 993,
        imapSecure: true,
        imapUsername: "",
        imapPassword: "",
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUsername: "",
        smtpPassword: "",
      });
      // Silent operation - AJAX only
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email/accounts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      // Silent operation - AJAX only
    },
  });

  const syncEmailsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email/accounts/${id}/sync`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/accounts"] });
      // Silent operation - AJAX only
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data: formData });
    } else {
      createAccountMutation.mutate(formData);
    }
  };

  const handleEdit = (account: EmailAccount) => {
    setEditingAccount(account);
    setFormData({
      email: account.email,
      displayName: account.displayName,
      imapHost: account.imapHost,
      imapPort: account.imapPort,
      imapSecure: account.imapSecure,
      imapUsername: account.imapUsername,
      imapPassword: "",
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
      smtpSecure: account.smtpSecure,
      smtpUsername: account.smtpUsername,
      smtpPassword: "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingAccount(null);
      setFormData({
        email: "",
        displayName: "",
        imapHost: "",
        imapPort: 993,
        imapSecure: true,
        imapUsername: "",
        imapPassword: "",
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUsername: "",
        smtpPassword: "",
      });
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "syncing":
        return <Badge className="bg-blue-500" data-testid={`badge-${status}`}><Loader2 className="w-3 h-3 mr-1 animate-spin" />Syncing</Badge>;
      case "idle":
        return <Badge className="bg-green-500" data-testid={`badge-${status}`}><CheckmarkIcon size="sm" variant="success" className="mr-1" />Idle</Badge>;
      case "error":
        return <Badge variant="destructive" data-testid={`badge-${status}`}><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-${status}`}>{status}</Badge>;
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("admin-dashboard");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-email-management">Email Account Management</h1>
          <p className="text-muted-foreground">
            Manage multiple email accounts to receive and reply to emails
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-add-account"
              className="bg-[#a0fab2] text-[#0d3931] hover:bg-[#a0fab2] hover:text-[#0d3931]"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Add Email Account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Email Account" : "Add New Email Account"}</DialogTitle>
              <DialogDescription>
                Configure IMAP and SMTP settings for your email account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="support@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Support Team"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  data-testid="input-displayName"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">IMAP Settings (Incoming Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="imapHost">IMAP Host</Label>
                    <Input
                      id="imapHost"
                      placeholder="imap.gmail.com"
                      value={formData.imapHost}
                      onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      required
                      data-testid="input-imapHost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPort">IMAP Port</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      value={formData.imapPort}
                      onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                      required
                      data-testid="input-imapPort"
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <Switch
                      id="imapSecure"
                      checked={formData.imapSecure}
                      onCheckedChange={(checked) => setFormData({ ...formData, imapSecure: checked })}
                      data-testid="switch-imapSecure"
                    />
                    <Label htmlFor="imapSecure">Use SSL/TLS</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapUsername">IMAP Username</Label>
                    <Input
                      id="imapUsername"
                      value={formData.imapUsername}
                      onChange={(e) => setFormData({ ...formData, imapUsername: e.target.value })}
                      required
                      data-testid="input-imapUsername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPassword">IMAP Password</Label>
                    <Input
                      id="imapPassword"
                      type="password"
                      placeholder={editingAccount ? "Leave blank to keep current password" : ""}
                      value={formData.imapPassword}
                      onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
                      required={!editingAccount}
                      data-testid="input-imapPassword"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">SMTP Settings (Outgoing Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      required
                      data-testid="input-smtpHost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                      required
                      data-testid="input-smtpPort"
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <Switch
                      id="smtpSecure"
                      checked={formData.smtpSecure}
                      onCheckedChange={(checked) => setFormData({ ...formData, smtpSecure: checked })}
                      data-testid="switch-smtpSecure"
                    />
                    <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={formData.smtpUsername}
                      onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                      required
                      data-testid="input-smtpUsername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      placeholder={editingAccount ? "Leave blank to keep current password" : ""}
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      required={!editingAccount}
                      data-testid="input-smtpPassword"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                  data-testid="button-submit-account"
                >
                  {createAccountMutation.isPending || updateAccountMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingAccount ? "Updating..." : "Testing & Saving..."}
                    </>
                  ) : (
                    editingAccount ? "Update Account" : "Add Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Email Accounts</CardTitle>
          <CardDescription>
            Manage your email accounts and sync messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No email accounts configured</p>
              <p className="text-sm text-muted-foreground">Add your first email account to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>IMAP Host</TableHead>
                  <TableHead>SMTP Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: EmailAccount) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium" data-testid={`text-email-${account.id}`}>
                      {account.email}
                    </TableCell>
                    <TableCell data-testid={`text-displayName-${account.id}`}>
                      {account.displayName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.imapHost}:{account.imapPort}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.smtpHost}:{account.smtpPort}
                    </TableCell>
                    <TableCell>
                      {getSyncStatusBadge(account.syncStatus)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.lastSyncedAt
                        ? new Date(account.lastSyncedAt).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncEmailsMutation.mutate(account.id)}
                          disabled={syncEmailsMutation.isPending || account.syncStatus === "syncing"}
                          data-testid={`button-sync-${account.id}`}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(account)}
                          data-testid={`button-edit-${account.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                          disabled={deleteAccountMutation.isPending}
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
