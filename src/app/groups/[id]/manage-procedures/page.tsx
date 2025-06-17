
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGroupById, updateComputerGroup, getProcedures, getProcedureById } from '@/lib/mockData';
import type { ComputerGroup, Procedure, AssociatedProcedureConfig, ScheduleConfig, ProcedureSystemType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, PlusCircle, Search, Trash2, ArrowUp, ArrowDown, FileCode, HardDrive, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const intervalUnits: ScheduleConfig['intervalUnit'][] = ['minutes', 'hours', 'days'];

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
      const updatedGroupData = { ...group, associatedProcedures: currentAssociatedProcedures };
      updateComputerGroup(group.id, updatedGroupData);
      toast({ title: "Success", description: "Associated procedures updated for the group." });
      // Optionally navigate back or refresh data
      // router.push(`/groups/${group.id}`); 
      loadData(); // Re-fetch to confirm
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
            let newSchedule = { ...(p.schedule || { type: 'disabled' as const }) };
            if (scheduleField === 'type') {
              newSchedule.type = value;
              if (value === 'disabled') {
                delete newSchedule.intervalValue;
                delete newSchedule.intervalUnit;
              } else if (value === 'interval' && (!newSchedule.intervalValue || !newSchedule.intervalUnit)) {
                newSchedule.intervalValue = 24; // Default interval
                newSchedule.intervalUnit = 'hours';
              }
            } else if (scheduleField === 'intervalValue') {
              newSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
            } else if (scheduleField === 'intervalUnit') {
              newSchedule.intervalUnit = value;
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
        <div className="flex justify-center items-center py-12"><Save className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading procedure management...</p></div>
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
        <Button variant="outline" onClick={() => router.push(`/groups/${groupId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Group Details
        </Button>
        <div className="flex items-center gap-4">
            <Dialog open={isAddProceduresModalOpen} onOpenChange={(isOpen) => { setIsAddProceduresModalOpen(isOpen); if(!isOpen) { setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}}}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={isSaving}>
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
                            className="pl-8 peer mb-3"
                        />
                    </div>
                    <ScrollArea className="h-72 border rounded-md p-2">
                        {filteredProceduresForAddDialog.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">{allAvailableProcedures.length === 0 ? 'No procedures available.' : 'No procedures match your search.'}</p>}
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
                                <Label htmlFor={`add-proc-check-${proc.id}`} className={cn("font-normal cursor-pointer flex-1", currentAssociatedProcedures.some(ap => ap.procedureId === proc.id) && "text-muted-foreground line-through")}>
                                    {proc.name}
                                    <span className="text-xs text-muted-foreground ml-1">({getProcedureSystemTypeLabel(proc.procedureSystemType)})</span>
                                    {currentAssociatedProcedures.some(ap => ap.procedureId === proc.id) && <span className="text-xs text-muted-foreground italic"> (Already in group)</span>}
                                </Label>
                            </div>
                        ))}
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => { setIsAddProceduresModalOpen(false); setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleAddProceduresToGroupDialogSubmit} disabled={isSaving || tempSelectedProcIdsForAddDialog.size === 0}>
                            Add Selected ({tempSelectedProcIdsForAddDialog.size}) to List
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button onClick={handleSaveAssociatedProcedures} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Associated Procedures'}
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Associated Procedures for: {group.name}</CardTitle>
          <CardDescription>
            Configure procedures linked to this group, their automation, schedule, and execution order.
            Changes are saved when you click "Save Associated Procedures".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssociatedProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No procedures currently associated with this group. Click "Add Procedures to Group" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {currentAssociatedProcedures.map((assocProc, index) => {
                const procedureDetails = getProcedureById(assocProc.procedureId);
                if (!procedureDetails) {
                  return (
                    <div key={`error-proc-${assocProc.procedureId}`} className="p-3 border rounded-md text-destructive text-sm bg-destructive/10">
                      Error: Associated procedure with ID {assocProc.procedureId} not found. It might have been deleted. Consider removing it.
                       <Button variant="destructive" size="xs" className="ml-2" onClick={() => handleRemoveAssociatedProcedure(assocProc.procedureId)}>Remove</Button>
                    </div>
                  );
                }
                return (
                  <Card key={assocProc.procedureId} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <span className="font-mono text-sm text-muted-foreground mr-2">{(index + 1)}.</span>
                          {getProcedureSystemTypeIcon(procedureDetails.procedureSystemType)}
                          {procedureDetails.name}
                          <Badge variant="outline" className="ml-2 text-xs">{getProcedureSystemTypeLabel(procedureDetails.procedureSystemType)}</Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground ml-7">{procedureDetails.description}</p>
                      </div>
                       <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveAssociatedProcedure(index, 'up')} disabled={isSaving || index === 0} title="Move Up">
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveAssociatedProcedure(index, 'down')} disabled={isSaving || index === currentAssociatedProcedures.length - 1} title="Move Down">
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveAssociatedProcedure(assocProc.procedureId)} disabled={isSaving} title="Remove from Group">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-3"/>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={`runOnNew-${assocProc.procedureId}`}
                                checked={assocProc.runOnNewMember}
                                onCheckedChange={(checked) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'runOnNewMember', !!checked)}
                                disabled={isSaving}
                            />
                            <Label htmlFor={`runOnNew-${assocProc.procedureId}`} className="font-normal text-sm">Run on new members joining this group</Label>
                        </div>
                        
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground">Schedule Execution</Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={assocProc.schedule?.type || 'disabled'}
                                    onValueChange={(value: 'disabled' | 'interval') => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.type', value)}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                        <SelectItem value="interval">Run at Interval</SelectItem>
                                    </SelectContent>
                                </Select>
                                {assocProc.schedule?.type === 'interval' && (
                                    <>
                                        <Input
                                            type="number" placeholder="Val" min="1"
                                            value={assocProc.schedule.intervalValue || ''}
                                            onChange={(e) => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                            disabled={isSaving} className="w-20 h-9 text-sm"
                                        />
                                        <Select
                                            value={assocProc.schedule.intervalUnit || 'minutes'}
                                            onValueChange={(value: 'minutes' | 'hours' | 'days') => handleAssociatedProcedureConfigChange(assocProc.procedureId, 'schedule.intervalUnit', value)}
                                            disabled={isSaving}
                                        >
                                            <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {intervalUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>
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

