import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Plus,
  Mail,
  Send,
  Eye,
  Pencil,
  Trash2,
  Users,
  FileText,
  BarChart3,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TestTube,
  RefreshCw,
} from "lucide-react";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  status: "draft" | "scheduled" | "sending" | "completed" | "cancelled";
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  failedCount?: number;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface CampaignSegment {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, unknown>;
  estimatedSize?: number;
  isActive: boolean;
  createdAt: string;
}

interface EmailServiceStatus {
  configured: boolean;
  connectionValid?: boolean;
  message?: string;
  error?: string;
}

interface AdminEmailCampaignsProps {
  onNavigate?: (page: string) => void;
}

interface TestAllEmailsResult {
  success: boolean;
  email: string;
  total: number;
  sent: number;
  failed: number;
  results: { name: string; success: boolean; error?: string }[];
}

export default function AdminEmailCampaigns({ onNavigate }: AdminEmailCampaignsProps) {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; html: string } | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isTestAllEmailsOpen, setIsTestAllEmailsOpen] = useState(false);
  const [testAllEmailAddress, setTestAllEmailAddress] = useState("");
  const [testAllResults, setTestAllResults] = useState<TestAllEmailsResult | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    templateId: "",
    segmentFilters: {} as Record<string, unknown>,
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    category: "marketing",
  });

  const { data: emailStatus } = useQuery<EmailServiceStatus>({
    queryKey: ["/api/email-marketing/status"],
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/email-marketing/campaigns"],
  });
  const campaigns = campaignsData ?? [];

  const { data: templatesData, isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-marketing/templates"],
  });
  const templates = templatesData ?? [];

  const { data: segmentsData } = useQuery<CampaignSegment[]>({
    queryKey: ["/api/email-marketing/segments"],
  });
  const segments = segmentsData ?? [];

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignForm) => {
      const payload = {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || undefined,
        templateId: data.templateId || undefined,
        segmentFilters: Object.keys(data.segmentFilters).length > 0 ? data.segmentFilters : undefined,
      };
      return apiRequest("/api/email-marketing/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/campaigns"] });
      setIsCreateCampaignOpen(false);
      setCampaignForm({ name: "", subject: "", htmlContent: "", textContent: "", templateId: "", segmentFilters: {} });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email-marketing/campaigns/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/campaigns"] });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email-marketing/campaigns/${id}/send`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/campaigns"] });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      return apiRequest(`/api/email-marketing/campaigns/${id}/test`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  });

  const testAllEmailsMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("/api/email-marketing/test-all-emails", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: (data: TestAllEmailsResult) => {
      setTestAllResults(data);
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      return apiRequest("/api/email-marketing/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/templates"] });
      setIsCreateTemplateOpen(false);
      setTemplateForm({ name: "", subject: "", htmlContent: "", textContent: "", category: "marketing" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/email-marketing/templates/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-marketing/templates"] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" data-testid="badge-draft"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500" data-testid="badge-scheduled"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "sending":
        return <Badge className="bg-yellow-500" data-testid="badge-sending"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sending</Badge>;
      case "completed":
        return <Badge className="bg-green-500" data-testid="badge-completed"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" data-testid="badge-cancelled"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">{status}</Badge>;
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("admin-dashboard");
    }
  };

  const handlePreview = (campaign: EmailCampaign) => {
    setPreviewContent({ subject: campaign.subject, html: campaign.htmlContent });
    setIsPreviewOpen(true);
  };

  const handleSendTest = async (campaign: EmailCampaign) => {
    if (!testEmail) return;
    setSelectedCampaign(campaign);
    await sendTestEmailMutation.mutateAsync({ id: campaign.id, email: testEmail });
    setTestEmail("");
    setSelectedCampaign(null);
  };

  const handleSendCampaign = async (campaign: EmailCampaign) => {
    if (confirm(`Are you sure you want to send this campaign to all eligible recipients?`)) {
      await sendCampaignMutation.mutateAsync(campaign.id);
    }
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setCampaignForm({
      name: `Campaign - ${template.name}`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      templateId: template.id,
      segmentFilters: {},
    });
    setIsCreateCampaignOpen(true);
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
          <h1 className="text-3xl font-bold" data-testid="heading-email-campaigns">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTestAllEmailsOpen(true)}
            disabled={!emailStatus?.configured}
            data-testid="button-test-all-emails"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test All Emails
          </Button>
          {emailStatus?.configured ? (
            <Badge className="bg-green-500" data-testid="status-connected">
              <CheckCircle className="w-3 h-3 mr-1" />
              Email Service Connected
            </Badge>
          ) : (
            <Badge variant="destructive" data-testid="status-not-configured">
              <AlertCircle className="w-3 h-3 mr-1" />
              Email Not Configured
            </Badge>
          )}
        </div>
      </div>

      {!emailStatus?.configured && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Email Service Not Configured</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {emailStatus?.message || "Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables to enable email sending."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold" data-testid="stat-total-campaigns">{campaigns.length}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold" data-testid="stat-templates">{templates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Segments</p>
                <p className="text-2xl font-bold" data-testid="stat-segments">{segments.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent Emails</p>
                <p className="text-2xl font-bold" data-testid="stat-sent">
                  {campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Users className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Campaigns</h2>
            <Button onClick={() => setIsCreateCampaignOpen(true)} data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {campaignsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                  <p className="text-sm text-muted-foreground">Create your first email campaign to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium" data-testid={`campaign-name-${campaign.id}`}>
                          {campaign.name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{campaign.subject}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell data-testid={`campaign-sent-${campaign.id}`}>
                          {campaign.sentCount || 0} / {campaign.totalRecipients || 0}
                        </TableCell>
                        <TableCell>
                          {campaign.openedCount || 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(campaign)}
                              data-testid={`button-preview-${campaign.id}`}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {campaign.status === "draft" && (
                              <>
                                <Dialog>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedCampaign(campaign)}
                                    data-testid={`button-test-${campaign.id}`}
                                  >
                                    <TestTube className="w-3 h-3" />
                                  </Button>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleSendCampaign(campaign)}
                                  disabled={!emailStatus?.configured || sendCampaignMutation.isPending}
                                  data-testid={`button-send-${campaign.id}`}
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                                  disabled={deleteCampaignMutation.isPending}
                                  data-testid={`button-delete-${campaign.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Email Templates</h2>
            <Button onClick={() => setIsCreateTemplateOpen(true)} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {templatesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No templates yet</p>
                  <p className="text-sm text-muted-foreground">Create reusable email templates</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg" data-testid={`template-name-${template.id}`}>
                            {template.name}
                          </CardTitle>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.category}
                          </Badge>
                        </div>
                        <CardDescription className="truncate">{template.subject}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUseTemplate(template)}
                            data-testid={`button-use-template-${template.id}`}
                          >
                            Use Template
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Audience Segments</h2>
            <Button data-testid="button-create-segment" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Create Segment
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {segments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No segments configured</p>
                  <p className="text-sm text-muted-foreground">Create segments to target specific audiences</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Est. Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell className="text-muted-foreground">{segment.description || "-"}</TableCell>
                        <TableCell>{segment.estimatedSize || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant={segment.isActive ? "default" : "secondary"}>
                            {segment.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Create a new email marketing campaign
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCampaignMutation.mutate(campaignForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Summer Sale Newsletter"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                required
                data-testid="input-campaign-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Don't miss our amazing deals!"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                required
                data-testid="input-campaign-subject"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateId">Use Template (Optional)</Label>
                <Select
                  value={campaignForm.templateId}
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template && value !== "none") {
                      setCampaignForm({
                        ...campaignForm,
                        templateId: value,
                        subject: template.subject,
                        htmlContent: template.htmlContent,
                        textContent: template.textContent || "",
                      });
                    } else {
                      setCampaignForm({ ...campaignForm, templateId: "" });
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-campaign-template">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Target Segment (Optional)</Label>
                <Select
                  value={Object.keys(campaignForm.segmentFilters).length > 0 ? "custom" : "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setCampaignForm({ ...campaignForm, segmentFilters: {} });
                    } else {
                      const segment = segments.find(s => s.id === value);
                      if (segment) {
                        setCampaignForm({ ...campaignForm, segmentFilters: segment.filters });
                      }
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-campaign-segment">
                    <SelectValue placeholder="All subscribers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscribers</SelectItem>
                    {segments.filter(s => s.isActive).map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.estimatedSize || "?"} recipients)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML Content</Label>
              <Textarea
                id="htmlContent"
                placeholder="<html>...</html>"
                value={campaignForm.htmlContent}
                onChange={(e) => setCampaignForm({ ...campaignForm, htmlContent: e.target.value })}
                rows={10}
                required
                data-testid="input-campaign-html"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{recipientName}}"}, {"{{recipientEmail}}"}, {"{{unsubscribeLink}}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
              <Textarea
                id="textContent"
                placeholder="Plain text version of the email..."
                value={campaignForm.textContent}
                onChange={(e) => setCampaignForm({ ...campaignForm, textContent: e.target.value })}
                rows={4}
                data-testid="input-campaign-text"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a reusable email template
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createTemplateMutation.mutate(templateForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Welcome Email"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  required
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Email Subject</Label>
              <Input
                id="templateSubject"
                placeholder="Welcome to EduFiliova!"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                required
                data-testid="input-template-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateHtml">HTML Content</Label>
              <Textarea
                id="templateHtml"
                placeholder="<html>...</html>"
                value={templateForm.htmlContent}
                onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                rows={10}
                required
                data-testid="input-template-html"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateText">Plain Text Content (Optional)</Label>
              <Textarea
                id="templateText"
                placeholder="Plain text version..."
                value={templateForm.textContent}
                onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                rows={4}
                data-testid="input-template-text"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTemplateMutation.isPending} data-testid="button-submit-template">
                {createTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Template"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Subject: {previewContent?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div
              dangerouslySetInnerHTML={{ __html: previewContent?.html || "" }}
              className="prose max-w-none"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email for "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                data-testid="input-test-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedCampaign && handleSendTest(selectedCampaign)}
              disabled={!testEmail || sendTestEmailMutation.isPending}
              data-testid="button-send-test"
            >
              {sendTestEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
