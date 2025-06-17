
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGroupById, updateComputerGroup, getProcedures, getProcedureById } from '@/lib/mockData';
import type { ComputerGroup, Procedure, AssociatedProcedureConfig, ScheduleConfig, ProcedureSystemType, ScheduleType, CustomIntervalUnit, DayOfWeek } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, PlusCircle, Search, Trash2, ArrowUp, ArrowDown, FileCode, HardDrive, RefreshCw, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const scheduleTypes: { value: ScheduleType; label: string }[] = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'runOnce', label: 'Run Once (at specified time)' },
  { value: 'daily', label: 'Daily (at specified time)' },
  { value: 'weekly', label: 'Weekly (on specific day/time)' },
  { value: 'monthly', label: 'Monthly (on specific day/time)' },
  { value: 'customInterval', label: 'Custom Interval' },
];

const customIntervalUnits: { value: CustomIntervalUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
];

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];


export default function ManageGroupProceduresPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [allAvailableProcedures, setAllAvailableProcedures] = useState<Procedure[]>([]);
  const [currentAssociatedProcedures, setCurrentAssociatedProcedures] = useState<AssociatedProcedureConfig[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddProceduresModalOpen, setIsAddProceduresModalOpen] = useState(false);
  const [addProcToGroupSearchTerm, setAddProcToGroupSearchTerm] = useState('');
  const [tempSelectedProcIdsForAddDialog, setTempSelectedProcIdsForAddDialog] = useState<Set<string>>(new Set());

  const loadData = useCallback(() => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        const fetchedGroup = getGroupById(groupId);
        const fetchedProcedures = getProcedures();
        
        if (fetchedGroup) {
          setGroup(fetchedGroup);
          setCurrentAssociatedProcedures((fetchedGroup.associatedProcedures || []).map(ap => ({
            ...ap,
            schedule: ap.schedule || { type: 'disabled' as const }
          })));
        } else {
          setError('Group not found.');
        }
        setAllAvailableProcedures(fetchedProcedures);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data.';
        setError(errorMessage);
        toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [groupId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProceduresForAddDialog = useMemo(() => {
    if (!addProcToGroupSearchTerm.trim()) {
        return allAvailableProcedures;
    }
    const lowerSearch = addProcToGroupSearchTerm.toLowerCase();
    return allAvailableProcedures.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.description.toLowerCase().includes(lowerSearch));
  }, [allAvailableProcedures, addProcToGroupSearchTerm]);

  const handleSaveAssociatedProcedures = () => {
    if (!group) return;
    setIsSaving(true);
    try {
      // Validate schedules
      for (const proc of currentAssociatedProcedures) {
        if (proc.schedule.type === 'runOnce' && !proc.schedule.time) {
          toast({ title: "Validation Error", description: `Procedure "${getProcedureById(proc.procedureId)?.name}" needs a time for 'Run Once' schedule.`, variant: "destructive" });
          setIsSaving(false); return;
        }
        if (proc.schedule.type === 'daily' && !proc.schedule.time) {
          toast({ title: "Validation Error", description: `Procedure "${getProcedureById(proc.procedureId)?.name}" needs a time for 'Daily' schedule.`, variant: "destructive" });
          setIsSaving(false); return;
        }
        if (proc.schedule.type === 'weekly' && (!proc.schedule.time || proc.schedule.dayOfWeek === undefined)) {
          toast({ title: "Validation Error", description: `Procedure "${getProcedureById(proc.procedureId)?.name}" needs a time and day for 'Weekly' schedule.`, variant: "destructive" });
          setIsSaving(false); return;
        }
        if (proc.schedule.type === 'monthly' && (!proc.schedule.time || !proc.schedule.dayOfMonth)) {
          toast({ title: "Validation Error", description: `Procedure "${getProcedureById(proc.procedureId)?.name}" needs a time and day of month for 'Monthly' schedule.`, variant: "destructive" });
          setIsSaving(false); return;
        }
        if (proc.schedule.type === 'customInterval' && (!proc.schedule.intervalValue || !proc.schedule.intervalUnit)) {
          toast({ title: "Validation Error", description: `Procedure "${getProcedureById(proc.procedureId)?.name}" needs value and unit for 'Custom Interval' schedule.`, variant: "destructive" });
          setIsSaving(false); return;
        }
      }

      const updatedGroupData = { ...group, associatedProcedures: currentAssociatedProcedures };
      updateComputerGroup(group.id, updatedGroupData);
      toast({ title: "Success", description: "Associated procedures updated for the group." });
      loadData(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save associated procedures.';
      toast({ title: "Error Saving Procedures", description: errorMessage, variant: "destructive" });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleAddProceduresToGroupDialogSubmit = () => {
    const proceduresToAdd = Array.from(tempSelectedProcIdsForAddDialog).filter(
      procId => !currentAssociatedProcedures.some(ap => ap.procedureId === procId)
    ).map(procId => ({
      procedureId: procId,
      runOnNewMember: false,
      schedule: { type: 'disabled' as const }
    }));

    setCurrentAssociatedProcedures(prev => [...prev, ...proceduresToAdd]);
    setTempSelectedProcIdsForAddDialog(new Set());
    setIsAddProceduresModalOpen(false);
    setAddProcToGroupSearchTerm('');
    if (proceduresToAdd.length > 0) {
        toast({ title: "Procedures Added", description: `${proceduresToAdd.length} procedure(s) added to the list. Configure them below and save changes to the group.`});
    }
  };

  const handleAssociatedProcedureConfigChange = (
    procedureId: string, 
    field: keyof AssociatedProcedureConfig | `schedule.${keyof ScheduleConfig}` | 'schedule.type', 
    value: any
  ) => {
    setCurrentAssociatedProcedures(prev =>
      prev.map(p => {
        if (p.procedureId === procedureId) {
          if (field === 'runOnNewMember') {
            return { ...p, runOnNewMember: value as boolean };
          } else if (field.startsWith('schedule.')) {
            const scheduleField = field.split('.')[1] as keyof ScheduleConfig | 'type';
            let newSchedule: ScheduleConfig = { ...(p.schedule || { type: 'disabled' as const }) };

            if (scheduleField === 'type') {
              newSchedule = { type: value as ScheduleType }; // Reset schedule on type change
              if (value === 'customInterval') {
                newSchedule.intervalValue = 5;
                newSchedule.intervalUnit = 'minutes';
              } else if (value === 'daily' || value === 'runOnce' || value === 'weekly' || value === 'monthly') {
                newSchedule.time = '09:00'; // Default time
              }
              if (value === 'weekly') newSchedule.dayOfWeek = 1; // Default to Monday
              if (value === 'monthly') newSchedule.dayOfMonth = 1; // Default to 1st
            } else if (scheduleField === 'time') {
              newSchedule.time = value;
            } else if (scheduleField === 'dayOfWeek') {
              newSchedule.dayOfWeek = parseInt(value, 10) as DayOfWeek;
            } else if (scheduleField === 'dayOfMonth') {
              newSchedule.dayOfMonth = value ? parseInt(value, 10) : undefined;
            } else if (scheduleField === 'intervalValue') {
              newSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
            } else if (scheduleField === 'intervalUnit') {
              newSchedule.intervalUnit = value as CustomIntervalUnit;
            }
            return { ...p, schedule: newSchedule };
          }
        }
        return p;
      })
    );
  };

  const handleMoveAssociatedProcedure = (currentIndex: number, direction: 'up' | 'down') => {
    setCurrentAssociatedProcedures(prev => {
        const newArray = [...prev];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= newArray.length) return prev;
        [newArray[currentIndex], newArray[targetIndex]] = [newArray[targetIndex], newArray[currentIndex]];
        return newArray;
    });
  };
  
  const handleRemoveAssociatedProcedure = (procedureId: string) => {
    setCurrentAssociatedProcedures(prev => prev.filter(p => p.procedureId !== procedureId));
    toast({ title: "Procedure Unlinked", description: "Procedure removed from this group's associations. Save changes to persist."});
  };

  const getProcedureSystemTypeLabel = (systemType?: ProcedureSystemType) => {
    switch (systemType) {
        case 'CustomScript': return 'Custom';
        case 'WindowsUpdate': return 'Windows Update';
        case 'SoftwareUpdate': return 'Software Update';
        default: return 'Custom';
    }
  };

  const getProcedureSystemTypeIcon = (systemType?: ProcedureSystemType) => {
    switch (systemType) {
        case 'CustomScript': return <FileCode className="mr-1.5 h-3.5 w-3.5 opacity-80" />;
        case 'WindowsUpdate': return <HardDrive className="mr-1.5 h-3.5 w-3.5 opacity-80" />;
        case 'SoftwareUpdate': return <RefreshCw className="mr-1.5 h-3.5 w-3.5 opacity-80" />;
        default: return <FileCode className="mr-1.5 h-3.5 w-3.5 opacity-80" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-40 mb-6" />
        <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading procedure management...</p></div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-destructive">{error} <Button onClick={() => router.back()} variant="link">Go Back</Button></div>;
  }
  
  if (!group) {
    return <div className="container mx-auto py-10 text-center">Group not found. <Button onClick={() => router.back()} variant="link">Go Back</Button></div>;
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push(`/groups/${groupId}`)} className="h-9 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group Details
        </Button>
        <div className="flex items-center gap-4">
            <Dialog open={isAddProceduresModalOpen} onOpenChange={(isOpen) => { setIsAddProceduresModalOpen(isOpen); if(!isOpen) { setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}}}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={isSaving} className="h-9 text-sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Procedures to Group
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Procedures to Group: {group.name}</DialogTitle>
                        <DialogDescription>Select procedures to associate with this group. You can configure them after adding.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                        <Input
                            type="search"
                            placeholder="Search available procedures..."
                            value={addProcToGroupSearchTerm}
                            onChange={(e) => setAddProcToGroupSearchTerm(e.target.value)}
                            className="pl-8 peer mb-3 h-9 text-sm"
                        />
                    </div>
                    <ScrollArea className="h-72 border rounded-md p-2">
                        {filteredProceduresForAddDialog.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">{allAvailableProcedures.length === 0 ? 'No procedures available.' : 'No procedures match your search.'}</p>}
                        {filteredProceduresForAddDialog.map(proc => (
                            <div key={`add-proc-dialog-${proc.id}`} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                                <Checkbox
                                    id={`add-proc-check-${proc.id}`}
                                    checked={tempSelectedProcIdsForAddDialog.has(proc.id)}
                                    onCheckedChange={(checked) => {
                                        setTempSelectedProcIdsForAddDialog(prev => {
                                            const newSet = new Set(prev);
                                            if (checked) newSet.add(proc.id);
                                            else newSet.delete(proc.id);
                                            return newSet;
                                        });
                                    }}
                                    disabled={currentAssociatedProcedures.some(ap => ap.procedureId === proc.id)}
                                />
                                <Label htmlFor={`add-proc-check-${proc.id}`} className={cn("text-xs font-normal cursor-pointer flex-1", currentAssociatedProcedures.some(ap => ap.procedureId === proc.id) && "text-muted-foreground line-through")}>
                                    {proc.name}
                                    <span className="text-muted-foreground ml-1">({getProcedureSystemTypeLabel(proc.procedureSystemType)})</span>
                                    {currentAssociatedProcedures.some(ap => ap.procedureId === proc.id) && <span className="italic"> (Already in group)</span>}
                                </Label>
                            </div>
                        ))}
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => { setIsAddProceduresModalOpen(false); setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}} disabled={isSaving} className="h-9 text-sm">Cancel</Button>
                        <Button onClick={handleAddProceduresToGroupDialogSubmit} disabled={isSaving || tempSelectedProcIdsForAddDialog.size === 0} className="h-9 text-sm">
                            Add Selected ({tempSelectedProcIdsForAddDialog.size}) to List
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button onClick={handleSaveAssociatedProcedures} disabled={isSaving} className="h-9 text-sm">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Associated Procedures'}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Manage Associated Procedures for: {group.name}</CardTitle>
          <CardDescription className="text-xs">
            Configure procedures linked to this group, their automation, schedule, and execution order.
            Changes are saved when you click "Save Associated Procedures".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssociatedProcedures.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No procedures currently associated with this group. Click "Add Procedures to Group" to get started.
            </p>
          ) : (
            <div className="space-y-2.5">
              {currentAssociatedProcedures.map((assocProc, index) => {
                const procedureDetails = getProcedureById(assocProc.procedureId);
                if (!procedureDetails) {
                  return (
                    <div key={`error-proc-${assocProc.procedureId}`} className="p-2.5 border rounded-md text-destructive text-xs bg-destructive/10">
                      Error: Associated procedure with ID {assocProc.procedureId} not found. It might have been deleted. Consider removing it.
                       <Button variant="destructive" size="xs" className="ml-2 h-6 px-1.5 text-xs" onClick={() => handleRemoveAssociatedProcedure(assocProc.procedureId)}>Remove</Button>
                    </div>
                  );
                }
                return (
                  <Card key={assocProc.procedureId} className="p-3">
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <h4 className="font-medium text-sm flex items-center">
                          <span className="font-mono text-xs text-muted-foreground mr-1.5">{(index + 1)}.</span>
                          {getProcedureSystemTypeIcon(procedureDetails.procedureSystemType)}
                          {procedureDetails.name}
                          <Badge variant="outline" className="ml-1.5 text-xs px-1.5 py-0.5 h-5">{getProcedureSystemTypeLabel(procedureDetails.procedureSystemType)}</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground ml-6">{procedureDetails.description}</p>
                      </div>
                       <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveAssociatedProcedure(index, 'up')} disabled={isSaving || index === 0} title="Move Up">
                            <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveAssociatedProcedure(index, 'down')} disabled={isSaving || index === currentAssociatedProcedures.length - 1} title="Move Down">
                            <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveAssociatedProcedure(assocProc.procedureId)} disabled={isSaving} title="Remove from Group">
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-2.5"/>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                        <div className="flex items-center space-x-1.5">
                            <Checkbox
                                id={`runOnNew-${assocProc.procedureId}`}
                                checked={assocProc.runOnNewMember}
                                onCheckedChange={(checked) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'runOnNewMember', !!checked)}
                                disabled={isSaving}
                            />
                            <Label htmlFor={`runOnNew-${assocProc.procedureId}`} className="font-normal text-xs">Run on new members joining this group</Label>
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Schedule Execution</Label>
                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={assocProc.schedule?.type || 'disabled'}
                                    onValueChange={(value: ScheduleType) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.type', value)}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="flex-1 h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {scheduleTypes.map(st => <SelectItem key={st.value} value={st.value} className="text-xs">{st.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {assocProc.schedule?.type && assocProc.schedule.type !== 'disabled' && (
                                <div className="grid grid-cols-2 gap-1.5 items-end mt-1.5 pl-1">
                                    {(assocProc.schedule.type === 'runOnce' || assocProc.schedule.type === 'daily' || assocProc.schedule.type === 'weekly' || assocProc.schedule.type === 'monthly') && (
                                        <div className="space-y-0.5 col-span-2">
                                            <Label htmlFor={`time-${assocProc.procedureId}`} className="text-xs">Time (HH:MM)</Label>
                                            <Input
                                                id={`time-${assocProc.procedureId}`}
                                                type="time"
                                                value={assocProc.schedule.time || ''}
                                                onChange={(e) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.time', e.target.value)}
                                                disabled={isSaving} className="h-8 text-xs px-2"
                                            />
                                        </div>
                                    )}
                                    {assocProc.schedule.type === 'weekly' && (
                                        <div className="space-y-0.5 col-span-2">
                                            <Label htmlFor={`dayOfWeek-${assocProc.procedureId}`} className="text-xs">Day of Week</Label>
                                            <Select
                                                value={assocProc.schedule.dayOfWeek?.toString() || '1'}
                                                onValueChange={(value) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.dayOfWeek', parseInt(value))}
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {daysOfWeek.map(day => <SelectItem key={day.value} value={day.value.toString()} className="text-xs">{day.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {assocProc.schedule.type === 'monthly' && (
                                        <div className="space-y-0.5 col-span-2">
                                            <Label htmlFor={`dayOfMonth-${assocProc.procedureId}`} className="text-xs">Day of Month (1-31)</Label>
                                            <Input
                                                id={`dayOfMonth-${assocProc.procedureId}`}
                                                type="number" min="1" max="31"
                                                value={assocProc.schedule.dayOfMonth || ''}
                                                onChange={(e) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.dayOfMonth', e.target.value ? parseInt(e.target.value) : undefined)}
                                                disabled={isSaving} className="h-8 text-xs px-2"
                                            />
                                        </div>
                                    )}
                                    {assocProc.schedule.type === 'customInterval' && (
                                        <>
                                            <div className="space-y-0.5">
                                                <Label htmlFor={`intervalValue-${assocProc.procedureId}`} className="text-xs">Value</Label>
                                                <Input
                                                    id={`intervalValue-${assocProc.procedureId}`}
                                                    type="number" placeholder="Val" min="1"
                                                    value={assocProc.schedule.intervalValue || ''}
                                                    onChange={(e) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                    disabled={isSaving} className="h-8 text-xs px-2"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                 <Label htmlFor={`intervalUnit-${assocProc.procedureId}`} className="text-xs">Unit</Label>
                                                <Select
                                                    value={assocProc.schedule.intervalUnit || 'minutes'}
                                                    onValueChange={(value) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.intervalUnit', value as CustomIntervalUnit)}
                                                    disabled={isSaving}
                                                >
                                                    <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {customIntervalUnits.map(unit => <SelectItem key={unit.value} value={unit.value} className="text-xs">{unit.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
