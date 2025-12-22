import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Calendar, FileText, History, CheckCircle2 } from "lucide-react";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  subscriptionTier?: string | null;
  planExpiry?: string | null;
}

interface ManualPlanAssignment {
  id: string;
  userId: string;
  assignedByAdminId: string;
  subscriptionTier: string | null;
  freelancerPlanId?: string | null;
  reason: string;
  notes: string | null;
  startDate: string;
  endDate: string;
  duration: string | null;
  previousPlan: string | null;
  previousFreelancerPlan?: string | null;
  previousExpiry: string | null;
  isActive: boolean;
  createdAt: string;
  userName: string;
  userEmail: string | null;
  userRole: string;
  adminName: string;
}

interface ManualPlanAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DURATION_OPTIONS = [
  { value: "1_month", label: "1 Month", days: 30 },
  { value: "3_months", label: "3 Months", days: 90 },
  { value: "6_months", label: "6 Months", days: 180 },
  { value: "1_year", label: "1 Year", days: 365 },
  { value: "custom", label: "Custom Duration", days: 0 },
];

// Student Plans - Based on grade tiers (for students accessing educational content)
const STUDENT_PLAN_OPTIONS = [
  { value: "elementary", label: "Elementary Plan (Grades 1-7)", price: "$5.99/month", yearlyPrice: "$54.99/year" },
  { value: "high_school", label: "High School Plan (Grades 8-12)", price: "$9.99/month", yearlyPrice: "$99.90/year" },
  { value: "college_university", label: "College & University Plan", price: "$99.00/month", yearlyPrice: "$799.00/year" },
];

// Shop Membership Plans (for customers buying products/downloads)
const SHOP_PLAN_OPTIONS = [
  { value: "free", label: "Free", price: "$0/month", yearlyPrice: "$0/year" },
  { value: "creator", label: "Creator", price: "$14.99/month", yearlyPrice: "$161.88/year" },
  { value: "pro", label: "Pro", price: "$24.99/month", yearlyPrice: "$188.88/year" },
  { value: "business", label: "Business", price: "$89.99/month", yearlyPrice: "$604.68/year" },
];

const REASON_OPTIONS = [
  { value: "cash_payment", label: "Cash Payment" },
  { value: "error_compensation", label: "Error Compensation" },
  { value: "promotional", label: "Promotional" },
  { value: "trial_extension", label: "Trial Extension" },
  { value: "other", label: "Other" },
];

export default function ManualPlanAssignmentDialog({
  open,
  onOpenChange,
}: ManualPlanAssignmentDialogProps) {
  const [currentTab, setCurrentTab] = useState("assign");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("1_month");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all users for search
  const { data: usersData, isLoading: loadingUsers } = useQuery<UserProfile[]>({
    queryKey: ["/api/admin/users"],
    enabled: open && currentTab === "assign",
  });

  // Fetch assignment history
  const { data: historyData, isLoading: loadingHistory } = useQuery<{
    success: boolean;
    assignments: ManualPlanAssignment[];
  }>({
    queryKey: ["/api/admin/manual-plan-assignments"],
    enabled: open && currentTab === "history",
  });

  // Fetch freelancer pricing plans
  const { data: freelancerPlansData } = useQuery<any>({
    queryKey: ["/api/freelancer-pricing-plans"],
    enabled: open && currentTab === "assign",
  });

  const users = Array.isArray(usersData) ? usersData : [];
  const assignments = historyData?.assignments || [];
  const freelancerPlans = freelancerPlansData || [];

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.userId?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Calculate end date based on duration
  const calculateEndDate = (duration: string, start: string) => {
    const durationOption = DURATION_OPTIONS.find((d) => d.value === duration);
    if (!durationOption || duration === "custom") return endDate;

    const startDateTime = new Date(start);
    startDateTime.setDate(startDateTime.getDate() + durationOption.days);
    return startDateTime.toISOString().split("T")[0];
  };

  // Update end date when duration or start date changes
  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    if (duration !== "custom") {
      const newEndDate = calculateEndDate(duration, startDate);
      setEndDate(newEndDate);
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (selectedDuration !== "custom") {
      const newEndDate = calculateEndDate(selectedDuration, date);
      setEndDate(newEndDate);
    }
  };

  // Create manual plan assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      subscriptionTier?: string;
      freelancerPlanId?: string;
      reason: string;
      notes: string;
      duration: string;
      startDate: string;
      endDate: string;
    }) => {
      return await apiRequest("/api/admin/manual-plan-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-plan-assignments"] });
      resetForm();
      setCurrentTab("history");
    },
    onError: (error: any) => {
      console.error("Failed to assign plan:", error);
    },
  });

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedPlan("");
    setSelectedDuration("1_month");
    setSelectedReason("");
    setNotes("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setShowPreview(false);
    setSearchQuery("");
  };

  const handleSubmit = () => {
    if (!selectedUser || !selectedPlan || !selectedReason || !startDate || !endDate) {
      console.error("Missing required fields for plan assignment");
      return;
    }

    // Determine if this is a freelancer plan or subscription tier
    const isFreelancerPlan = selectedUser.role === 'freelancer' || selectedUser.role === 'teacher';
    
    const mutationData: any = {
      userId: selectedUser.userId,
      reason: selectedReason,
      notes,
      duration: selectedDuration,
      startDate,
      endDate,
    };

    if (isFreelancerPlan) {
      mutationData.freelancerPlanId = selectedPlan;
    } else {
      mutationData.subscriptionTier = selectedPlan;
    }

    createAssignmentMutation.mutate(mutationData);
  };

  const getPlanLabel = (tier: string) => {
    // Check student plans
    const studentPlan = STUDENT_PLAN_OPTIONS.find((p) => p.value === tier);
    if (studentPlan) return studentPlan.label;
    
    // Check shop plans
    const shopPlan = SHOP_PLAN_OPTIONS.find((p) => p.value === tier);
    if (shopPlan) return shopPlan.label;
    
    // Check freelancer plans
    const freelancerPlan = freelancerPlans.find((p: any) => p.planId === tier);
    if (freelancerPlan) return freelancerPlan.name;
    
    return tier;
  };

  // Get appropriate plan options based on user role
  const getPlanOptionsForUser = (userRole: string) => {
    if (userRole === 'freelancer' || userRole === 'teacher') {
      // Convert freelancer plans to the format expected by the select
      return freelancerPlans.map((plan: any) => ({
        value: plan.planId,
        label: plan.name,
        price: plan.monthlyPrice ? `$${plan.monthlyPrice}/month` : `$${plan.lifetimePrice} lifetime`,
        yearlyPrice: plan.yearlyPrice ? `$${plan.yearlyPrice}/year` : undefined,
      }));
    }
    
    if (userRole === 'student') {
      // Students get grade-based subscription plans
      return STUDENT_PLAN_OPTIONS;
    }
    
    // Customers and other roles get shop membership plans
    return SHOP_PLAN_OPTIONS;
  };

  // Get current plan options based on selected user
  const currentPlanOptions = selectedUser 
    ? getPlanOptionsForUser(selectedUser.role)
    : SHOP_PLAN_OPTIONS;

  const getReasonLabel = (reason: string) => {
    const reasonOption = REASON_OPTIONS.find((r) => r.value === reason);
    return reasonOption?.label || reason;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Plan Assignment</DialogTitle>
          <DialogDescription>
            Assign subscription plans manually for cash payments, error compensation, or promotional purposes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign" data-testid="tab-assign">
              <User className="h-4 w-4 mr-2" />
              Assign Plan
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              Assignment History
            </TabsTrigger>
          </TabsList>

          {/* Assign Plan Tab */}
          <TabsContent value="assign" className="space-y-6">
            {!showPreview ? (
              <>
                {/* Step 1: User Search */}
                <div className="space-y-3">
                  <Label>Search User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-user-search"
                    />
                  </div>

                  {/* Selected User */}
                  {selectedUser && (
                    <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={selectedUser.avatarUrl || undefined} />
                            <AvatarFallback>
                              {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedUser.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedUser.email} • ID: {selectedUser.userId}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{selectedUser.role}</Badge>
                              {selectedUser.subscriptionTier && (
                                <Badge variant="secondary">
                                  Current: {getPlanLabel(selectedUser.subscriptionTier)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(null)}
                          data-testid="button-clear-user"
                        >
                          Change
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* User Search Results */}
                  {!selectedUser && searchQuery && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Loading users...</div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No users found</div>
                      ) : (
                        filteredUsers.slice(0, 10).map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchQuery("");
                              setSelectedPlan(""); // Reset plan when changing user
                            }}
                            className="w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-b last:border-b-0 text-left transition-colors"
                            data-testid={`user-option-${user.userId}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(user.name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {user.email} • {user.role}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Plan Selection */}
                {selectedUser && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="plan">Subscription Plan *</Label>
                      <Select
                        value={selectedPlan}
                        onValueChange={setSelectedPlan}
                      >
                        <SelectTrigger data-testid="select-plan">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentPlanOptions.map((plan: { value: string; label: string; price: string; yearlyPrice?: string }) => (
                            <SelectItem key={plan.value} value={plan.value}>
                              <div className="flex flex-col">
                                <span>{plan.label}</span>
                                <span className="text-xs text-gray-500">{plan.price}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Step 3: Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="duration">Duration *</Label>
                        <Select
                          value={selectedDuration}
                          onValueChange={handleDurationChange}
                        >
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          data-testid="input-start-date"
                        />
                      </div>
                    </div>

                    {/* End Date (shown for custom duration) */}
                    {selectedDuration === "custom" && (
                      <div className="space-y-3">
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          data-testid="input-end-date"
                        />
                      </div>
                    )}

                    {endDate && (
                      <Card className="p-3 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Plan Duration:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(startDate).toLocaleDateString()} -{" "}
                            {new Date(endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </Card>
                    )}

                    {/* Step 4: Reason */}
                    <div className="space-y-3">
                      <Label htmlFor="reason">Reason *</Label>
                      <Select
                        value={selectedReason}
                        onValueChange={setSelectedReason}
                      >
                        <SelectTrigger data-testid="select-reason">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {REASON_OPTIONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Step 5: Notes */}
                    <div className="space-y-3">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any additional notes about this assignment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        data-testid="input-notes"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={resetForm}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowPreview(true)}
                        disabled={
                          !selectedUser ||
                          !selectedPlan ||
                          !selectedReason ||
                          !startDate ||
                          !endDate
                        }
                        data-testid="button-preview"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Preview & Confirm
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Preview Section */
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    Review Assignment Details
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">User</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedUser?.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedUser?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getPlanLabel(selectedPlan)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(startDate).toLocaleDateString()} -{" "}
                          {new Date(endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getReasonLabel(selectedReason)}
                        </p>
                      </div>
                    </div>

                    {notes && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    data-testid="button-back"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createAssignmentMutation.isPending}
                    data-testid="button-confirm-assign"
                  >
                    {createAssignmentMutation.isPending ? "Assigning..." : "Confirm Assignment"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-8 text-gray-500">Loading history...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No manual plan assignments yet
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="p-4"
                    data-testid={`assignment-${assignment.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {assignment.userName}
                          </p>
                          <Badge variant="outline">{assignment.userRole}</Badge>
                          {assignment.isActive && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Plan: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {assignment.subscriptionTier 
                                ? getPlanLabel(assignment.subscriptionTier)
                                : assignment.freelancerPlanId 
                                  ? getPlanLabel(assignment.freelancerPlanId)
                                  : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Reason: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getReasonLabel(assignment.reason)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Period: </span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(assignment.startDate).toLocaleDateString()} -{" "}
                              {new Date(assignment.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Assigned by:{" "}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {assignment.adminName}
                            </span>
                          </div>
                        </div>

                        {assignment.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                            "{assignment.notes}"
                          </p>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Assigned on {new Date(assignment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
