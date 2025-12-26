import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, 
  Users, 
  Zap, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  User,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AssignmentSetting {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

type AssignmentMode = 'auto' | 'manual';

export default function AssignmentModeSettings() {
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('auto');
  const [autoAssignSettings, setAutoAssignSettings] = useState({
    enableRoundRobin: true,
    considerAgentLoad: true,
    maxActiveChatsPerAgent: '5',
    autoAssignWelcomeMessage: 'Hello! You have been connected to a support agent who will assist you shortly.',
    workingHoursOnly: false
  });
  
  const [manualSettings, setManualSettings] = useState({
    queueWelcomeMessage: 'Hello! Your request has been received. An agent will be with you shortly.',
    allowAgentSelection: false,
    showQueuePosition: true,
    estimatedWaitTime: '5-10 minutes',
    selectedAgents: [] as number[]
  });

  const queryClient = useQueryClient();

  // Fetch assignment mode settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/help-chat-settings'],
    queryFn: () => apiRequest('/api/admin/help-chat-settings'),
    select: (data: any) => {
      const settingsArray = data?.data || [];
      const settingsMap: Record<string, AssignmentSetting> = {};
      settingsArray.forEach((setting: AssignmentSetting) => {
        settingsMap[setting.settingKey] = setting;
      });
      return settingsMap;
    }
  });

  // Fetch support agents for manual assignment selection (fetch ALL agents, not just active)
  const { data: supportAgents } = useQuery({
    queryKey: ['/api/admin/support-agents-all'],
    queryFn: () => apiRequest('/api/admin/support-agents'),
    select: (data: any) => {
      console.log('📋 All Support Agents Query Result (for manual assignment):', data);
      // Return ALL agents for manual assignment configuration
      return data?.data || [];
    },
    enabled: assignmentMode === 'manual' // Always fetch when in manual mode
  });

  // Update settings when data loads
  useEffect(() => {
    if (settings) {
      // Set assignment mode
      const mode = settings['assignment_mode']?.settingValue as AssignmentMode;
      if (mode) setAssignmentMode(mode);

      // Auto assignment settings
      if (settings['auto_assign_round_robin']?.settingValue) {
        setAutoAssignSettings(prev => ({
          ...prev,
          enableRoundRobin: settings['auto_assign_round_robin'].settingValue === 'true'
        }));
      }
      
      if (settings['auto_assign_consider_load']?.settingValue) {
        setAutoAssignSettings(prev => ({
          ...prev,
          considerAgentLoad: settings['auto_assign_consider_load'].settingValue === 'true'
        }));
      }

      if (settings['max_active_chats_per_agent']?.settingValue) {
        setAutoAssignSettings(prev => ({
          ...prev,
          maxActiveChatsPerAgent: settings['max_active_chats_per_agent'].settingValue
        }));
      }

      if (settings['auto_assign_welcome_message']?.settingValue) {
        setAutoAssignSettings(prev => ({
          ...prev,
          autoAssignWelcomeMessage: settings['auto_assign_welcome_message'].settingValue
        }));
      }

      if (settings['working_hours_only']?.settingValue) {
        setAutoAssignSettings(prev => ({
          ...prev,
          workingHoursOnly: settings['working_hours_only'].settingValue === 'true'
        }));
      }

      // Manual assignment settings
      if (settings['manual_queue_welcome_message']?.settingValue) {
        setManualSettings(prev => ({
          ...prev,
          queueWelcomeMessage: settings['manual_queue_welcome_message'].settingValue
        }));
      }

      if (settings['allow_agent_selection']?.settingValue) {
        setManualSettings(prev => ({
          ...prev,
          allowAgentSelection: settings['allow_agent_selection'].settingValue === 'true'
        }));
      }

      if (settings['show_queue_position']?.settingValue) {
        setManualSettings(prev => ({
          ...prev,
          showQueuePosition: settings['show_queue_position'].settingValue === 'true'
        }));
      }

      if (settings['estimated_wait_time']?.settingValue) {
        setManualSettings(prev => ({
          ...prev,
          estimatedWaitTime: settings['estimated_wait_time'].settingValue
        }));
      }

      // Load selected agents
      if (settings['manual_selected_agent_ids']?.settingValue) {
        try {
          const selectedAgents = JSON.parse(settings['manual_selected_agent_ids'].settingValue);
          if (Array.isArray(selectedAgents)) {
            setManualSettings(prev => ({
              ...prev,
              selectedAgents: selectedAgents
            }));
          }
        } catch (error) {
          console.error('Failed to parse selected agents:', error);
        }
      }
    }
  }, [settings]);

  // Save setting mutation
  const saveSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => 
      apiRequest('/api/admin/help-chat-settings', {
        method: 'POST',
        body: JSON.stringify({
          settingKey: key,
          settingValue: value,
          description: getSettingDescription(key)
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/help-chat-settings'] });
    },
    onError: (error: any) => {}
  });

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'assignment_mode': 'How support requests are assigned to agents',
      'auto_assign_round_robin': 'Whether to use round-robin assignment',
      'auto_assign_consider_load': 'Whether to consider agent workload when assigning',
      'max_active_chats_per_agent': 'Maximum active chats per agent',
      'auto_assign_welcome_message': 'Message sent when auto-assigned to an agent',
      'working_hours_only': 'Only auto-assign during working hours',
      'manual_queue_welcome_message': 'Welcome message for manual queue',
      'allow_agent_selection': 'Allow visitors to select specific agents',
      'show_queue_position': 'Show queue position to waiting visitors',
      'estimated_wait_time': 'Estimated wait time for manual queue',
      'manual_selected_agent_ids': 'Selected agents for manual assignment'
    };
    return descriptions[key] || 'Support system setting';
  };

  const handleSaveAllSettings = async () => {
    try {
      // Save assignment mode
      await saveSettingMutation.mutateAsync({
        key: 'assignment_mode',
        value: assignmentMode
      });

      // Save auto assignment settings
      if (assignmentMode === 'auto') {
        await Promise.all([
          saveSettingMutation.mutateAsync({
            key: 'auto_assign_round_robin',
            value: autoAssignSettings.enableRoundRobin.toString()
          }),
          saveSettingMutation.mutateAsync({
            key: 'auto_assign_consider_load',
            value: autoAssignSettings.considerAgentLoad.toString()
          }),
          saveSettingMutation.mutateAsync({
            key: 'max_active_chats_per_agent',
            value: autoAssignSettings.maxActiveChatsPerAgent
          }),
          saveSettingMutation.mutateAsync({
            key: 'auto_assign_welcome_message',
            value: autoAssignSettings.autoAssignWelcomeMessage
          }),
          saveSettingMutation.mutateAsync({
            key: 'working_hours_only',
            value: autoAssignSettings.workingHoursOnly.toString()
          })
        ]);
      }

      // Save manual assignment settings
      if (assignmentMode === 'manual') {
        await Promise.all([
          saveSettingMutation.mutateAsync({
            key: 'manual_queue_welcome_message',
            value: manualSettings.queueWelcomeMessage
          }),
          saveSettingMutation.mutateAsync({
            key: 'allow_agent_selection',
            value: manualSettings.allowAgentSelection.toString()
          }),
          saveSettingMutation.mutateAsync({
            key: 'show_queue_position',
            value: manualSettings.showQueuePosition.toString()
          }),
          saveSettingMutation.mutateAsync({
            key: 'estimated_wait_time',
            value: manualSettings.estimatedWaitTime
          }),
          saveSettingMutation.mutateAsync({
            key: 'manual_selected_agent_ids',
            value: JSON.stringify(manualSettings.selectedAgents || [])
          })
        ]);
      }} catch (error: any) {}
  };

  const handleReset = () => {
    // Reset to default values
    setAssignmentMode('auto');
    setAutoAssignSettings({
      enableRoundRobin: true,
      considerAgentLoad: true,
      maxActiveChatsPerAgent: '5',
      autoAssignWelcomeMessage: 'Hello! You have been connected to a support agent who will assist you shortly.',
      workingHoursOnly: false
    });
    setManualSettings({
      queueWelcomeMessage: 'Hello! Your request has been received. An agent will be with you shortly.',
      allowAgentSelection: false,
      showQueuePosition: true,
      estimatedWaitTime: '5-10 minutes',
      selectedAgents: []
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="assignment-mode-settings-loading">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="assignment-mode-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assignment Mode</h2>
          <p className="text-sm text-muted-foreground">
            Configure how support requests are assigned to agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            data-testid="reset-settings-button"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSaveAllSettings}
            disabled={saveSettingMutation.isPending}
            data-testid="save-settings-button"
          >
            {saveSettingMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⚪</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Assignment Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assignment Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={assignmentMode}
            onValueChange={(value) => setAssignmentMode(value as AssignmentMode)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50" transition-all duration-300>
              <RadioGroupItem value="auto" id="auto" data-testid="radio-auto-assignment" />
              <div className="grid gap-1.5">
                <Label htmlFor="auto" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Auto Assignment
                  <Badge variant="default" className="ml-2">Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Requests are automatically assigned to available agents based on workload and availability.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50" transition-all duration-300>
              <RadioGroupItem value="manual" id="manual" data-testid="radio-manual-assignment" />
              <div className="grid gap-1.5">
                <Label htmlFor="manual" className="flex items-center gap-2 font-medium cursor-pointer">
                  <User className="h-4 w-4 text-green-500" />
                  Manual Assignment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Agents manually claim requests from a queue. Provides more control but may increase wait times.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Auto Assignment Settings */}
      {assignmentMode === 'auto' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Auto Assignment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Round Robin */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Round Robin Assignment</Label>
                <p className="text-xs text-muted-foreground">
                  Distribute requests evenly among all available agents
                </p>
              </div>
              <Switch
                checked={autoAssignSettings.enableRoundRobin}
                onCheckedChange={(checked) => 
                  setAutoAssignSettings(prev => ({ ...prev, enableRoundRobin: checked }))
                }
                data-testid="switch-round-robin"
              />
            </div>

            <Separator />

            {/* Consider Agent Load */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Consider Agent Workload</Label>
                <p className="text-xs text-muted-foreground">
                  Prioritize agents with fewer active chats
                </p>
              </div>
              <Switch
                checked={autoAssignSettings.considerAgentLoad}
                onCheckedChange={(checked) => 
                  setAutoAssignSettings(prev => ({ ...prev, considerAgentLoad: checked }))
                }
                data-testid="switch-consider-load"
              />
            </div>

            <Separator />

            {/* Max Chats */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maximum Active Chats per Agent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={autoAssignSettings.maxActiveChatsPerAgent}
                  onChange={(e) => 
                    setAutoAssignSettings(prev => ({ ...prev, maxActiveChatsPerAgent: e.target.value }))
                  }
                  className="w-20 px-3 py-2 border rounded-md text-sm"
                  data-testid="input-max-chats"
                />
                <span className="text-sm text-muted-foreground">chats</span>
              </div>
            </div>

            <Separator />

            {/* Working Hours Only */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Working Hours Only</Label>
                <p className="text-xs text-muted-foreground">
                  Only auto-assign during configured business hours
                </p>
              </div>
              <Switch
                checked={autoAssignSettings.workingHoursOnly}
                onCheckedChange={(checked) => 
                  setAutoAssignSettings(prev => ({ ...prev, workingHoursOnly: checked }))
                }
                data-testid="switch-working-hours"
              />
            </div>

            <Separator />

            {/* Welcome Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Auto-Assignment Welcome Message</Label>
              <Textarea
                value={autoAssignSettings.autoAssignWelcomeMessage}
                onChange={(e) => 
                  setAutoAssignSettings(prev => ({ ...prev, autoAssignWelcomeMessage: e.target.value }))
                }
                placeholder="Enter welcome message for auto-assigned chats..."
                rows={3}
                data-testid="textarea-auto-welcome"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Assignment Settings */}
      {assignmentMode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              Manual Assignment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Queue Welcome Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Queue Welcome Message</Label>
              <Textarea
                value={manualSettings.queueWelcomeMessage}
                onChange={(e) => 
                  setManualSettings(prev => ({ ...prev, queueWelcomeMessage: e.target.value }))
                }
                placeholder="Enter welcome message for visitors in queue..."
                rows={3}
                data-testid="textarea-queue-welcome"
              />
            </div>

            <Separator />

            {/* Allow Agent Selection */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Allow Agent Selection</Label>
                <p className="text-xs text-muted-foreground">
                  Let visitors choose their preferred support agent
                </p>
              </div>
              <Switch
                checked={manualSettings.allowAgentSelection}
                onCheckedChange={(checked) => 
                  setManualSettings(prev => ({ ...prev, allowAgentSelection: checked }))
                }
                data-testid="switch-agent-selection"
              />
            </div>

            {/* Agent Selection Interface */}
            {manualSettings.allowAgentSelection && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm font-medium">Available Support Agents</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which agents can be chosen for manual assignment
                  </p>
                  
                  {supportAgents && supportAgents.length > 0 ? (
                    <div className="grid gap-3">
                      {(() => {
                        console.log('🔍 All support agents for manual assignment:', supportAgents);
                        // Show ALL agents (both active and inactive) for manual assignment
                        return supportAgents;
                      })()
                        .map((agent: any) => (
                        <div
                          key={agent.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" transition-all duration-300
                        >
                          <Checkbox
                            id={`agent-${agent.id}`}
                            checked={Array.isArray(manualSettings.selectedAgents) && manualSettings.selectedAgents.includes(agent.id)}
                            onCheckedChange={(checked) => {
                              const currentAgents = Array.isArray(manualSettings.selectedAgents) ? manualSettings.selectedAgents : [];
                              setManualSettings(prev => ({
                                ...prev,
                                selectedAgents: checked === true
                                  ? [...currentAgents, agent.id]
                                  : currentAgents.filter(id => id !== agent.id)
                              }));
                            }}
                            data-testid={`checkbox-agent-${agent.id}`}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                            <AvatarFallback>
                              {agent.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`agent-${agent.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {agent.name}
                              </label>
                              <Badge variant="outline" className="text-xs">
                                {agent.role || 'Support Agent'}
                              </Badge>
                            </div>
                            {agent.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No active support agents found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create support agents in the Support Profiles section first
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Show Queue Position */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Show Queue Position</Label>
                <p className="text-xs text-muted-foreground">
                  Display current queue position to waiting visitors
                </p>
              </div>
              <Switch
                checked={manualSettings.showQueuePosition}
                onCheckedChange={(checked) => 
                  setManualSettings(prev => ({ ...prev, showQueuePosition: checked }))
                }
                data-testid="switch-queue-position"
              />
            </div>

            <Separator />

            {/* Estimated Wait Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estimated Wait Time</Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualSettings.estimatedWaitTime}
                  onChange={(e) => 
                    setManualSettings(prev => ({ ...prev, estimatedWaitTime: e.target.value }))
                  }
                  placeholder="e.g., 5-10 minutes"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  data-testid="input-wait-time"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be shown to visitors waiting in the queue
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {assignmentMode === 'auto' ? (
              <>
                <div className="flex items-center gap-2 text-blue-600">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Auto Assignment Active</span>
                </div>
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Efficient
                </Badge>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Manual Assignment Active</span>
                </div>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Agent Control
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
