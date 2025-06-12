
"use client";

import { useParams, useRouter } from 'next/navigation';
import { 
    getGroupById, 
    updateComputerGroup, 
    getProcedures, 
    getComputers as getAllComputers, 
    getMonitors,
    getProcedureById,
    getMonitorById
} from '@/lib/mockData'; 
import type { ComputerGroup, Computer, Procedure, Monitor, AssociatedProcedureConfig, AssociatedMonitorConfig, ScheduleConfig } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Settings, ListChecks, XCircle, Clock, ArrowUp, ArrowDown, Activity, Loader2, Search } from 'lucide-react';
import { ComputerTable } from '@/components/computers/ComputerTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const intervalUnits: ScheduleConfig['intervalUnit'][] = ['minutes', 'hours', 'days'];

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [allComputers, setAllComputers] = useState<Computer[]>([]); 
  const [memberComputers, setMemberComputers] = useState<Computer[]>([]);
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]); 
  const [allMonitors, setAllMonitors] = useState<Monitor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isManageProceduresModalOpen, setIsManageProceduresModalOpen] = useState(false);
  const [currentAssociatedProcedures, setCurrentAssociatedProcedures] = useState<AssociatedProcedureConfig[]>([]);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');


  const [isManageMonitorsModalOpen, setIsManageMonitorsModalOpen] = useState(false);
  const [currentAssociatedMonitors, setCurrentAssociatedMonitors] = useState<AssociatedMonitorConfig[]>([]);
  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');


  const loadGroupDetails = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    // Simulate delay for mock data
    setTimeout(() => {
      try {
        const fetchedGroup = getGroupById(id);
        const fetchedProcedures = getProcedures();
        const fetchedComputers = getAllComputers();
        const fetchedMonitors = getMonitors();
        
        setGroup(fetchedGroup || null);
        setAllProcedures(fetchedProcedures);
        setAllComputers(fetchedComputers);
        setAllMonitors(fetchedMonitors);

        if (fetchedGroup) {
          const computersInGroup = fetchedComputers.filter(c => fetchedGroup.computerIds.includes(c.id));
          setMemberComputers(computersInGroup);
          
          const initialProcedures = (fetchedGroup.associatedProcedures || []).map(ap => ({
            ...ap,
            schedule: ap.schedule || { type: 'disabled' as const } 
          }));
          setCurrentAssociatedProcedures(initialProcedures);

          const initialMonitors = (fetchedGroup.associatedMonitors || []).map(am => {
              const monitorDetails = fetchedMonitors.find(m => m.id === am.monitorId);
              return {
                  ...am,
                  schedule: am.schedule || { 
                      type: 'interval' as const, 
                      intervalValue: monitorDetails?.defaultIntervalValue || 5, 
                      intervalUnit: monitorDetails?.defaultIntervalUnit || 'minutes' 
                  }
              };
          });
          setCurrentAssociatedMonitors(initialMonitors);
        } else {
          setError('Group not found in mock data.');
        }
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load group details from mock.';
          setError(errorMessage);
          toast({ title: "Error Loading Group (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [id, toast]);

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  const filteredProceduresForDialog = useMemo(() => {
    if (!procedureSearchTerm.trim()) {
      return allProcedures;
    }
    const lowerSearchTerm = procedureSearchTerm.toLowerCase();
    return allProcedures.filter(proc =>
      proc.name.toLowerCase().includes(lowerSearchTerm) ||
      proc.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allProcedures, procedureSearchTerm]);

  const filteredMonitorsForDialog = useMemo(() => {
    if (!monitorSearchTerm.trim()) {
      return allMonitors;
    }
    const lowerSearchTerm = monitorSearchTerm.toLowerCase();
    return allMonitors.filter(mon =>
      mon.name.toLowerCase().includes(lowerSearchTerm) ||
      mon.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allMonitors, monitorSearchTerm]);


  const handleProcedureAssociationChange = (procedureId: string, isAssociated: boolean) => {
    setCurrentAssociatedProcedures(prev => {
      if (isAssociated) {
        if (!prev.some(p => p.procedureId === procedureId)) {
          return [...prev, { procedureId, runOnNewMember: false, schedule: { type: 'disabled' } }];
        }
        return prev;
      } else {
        return prev.filter(p => p.procedureId !== procedureId);
      }
    });
  };

  const handleRunOnNewMemberChange = (procedureId: string, runOnNewMember: boolean) => {
    setCurrentAssociatedProcedures(prev => 
      prev.map(p => p.procedureId === procedureId ? { ...p, runOnNewMember } : p)
    );
  };

  const handleProcedureScheduleChange = (
    procedureId: string,
    field: keyof ScheduleConfig | 'type',
    value: any
  ) => {
    setCurrentAssociatedProcedures(prev =>
      prev.map(p => {
        if (p.procedureId === procedureId) {
          const updatedSchedule = { ...(p.schedule || { type: 'disabled' as const }) };
          if (field === 'type') {
            updatedSchedule.type = value as 'disabled' | 'interval';
            if (value === 'disabled') {
              delete updatedSchedule.intervalValue;
              delete updatedSchedule.intervalUnit;
            } else if (value === 'interval' && !updatedSchedule.intervalValue) {
              updatedSchedule.intervalValue = 60; 
              updatedSchedule.intervalUnit = 'minutes'; 
            }
          } else if (field === 'intervalValue') {
            updatedSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
          } else if (field === 'intervalUnit') {
            updatedSchedule.intervalUnit = value as 'minutes' | 'hours' | 'days';
          }
          return { ...p, schedule: updatedSchedule };
        }
        return p;
      })
    );
  };

  const handleMoveProcedure = (currentIndex: number, direction: 'up' | 'down') => {
    setCurrentAssociatedProcedures(prev => {
      const newArray = [...prev];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= newArray.length) return newArray;
      [newArray[currentIndex], newArray[targetIndex]] = [newArray[targetIndex], newArray[currentIndex]];
      return newArray;
    });
  };

  const handleSaveAssociatedProcedures = () => {
    if (!group) return;
    setIsSaving(true);
    try {
      const updatedGroup = updateComputerGroup(group.id, { associatedProcedures: currentAssociatedProcedures });
      if (updatedGroup) {
        setGroup(updatedGroup); 
      }
      setIsManageProceduresModalOpen(false);
      setProcedureSearchTerm('');
      toast({ title: "Success", description: "Associated procedures updated (Mock)." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save associated procedures (Mock).';
      toast({ title: "Error", description: errorMessage, variant: "destructive"});
    } finally {
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  const openManageProceduresModal = () => {
    if (!group) return;
    const initialDialogProcedures = (group.associatedProcedures || []).map(ap => ({
      ...ap,
      schedule: ap.schedule || { type: 'disabled' as const }
    }));
    setCurrentAssociatedProcedures(initialDialogProcedures);
    setProcedureSearchTerm('');
    setIsManageProceduresModalOpen(true);
  };

  const handleMonitorAssociationChange = (monitorId: string, isAssociated: boolean) => {
    setCurrentAssociatedMonitors(prev => {
      if (isAssociated) {
        if (!prev.some(m => m.monitorId === monitorId)) {
          const monitor = allMonitors.find(m => m.id === monitorId); 
          return [...prev, { 
            monitorId, 
            schedule: { 
              type: 'interval', 
              intervalValue: monitor?.defaultIntervalValue || 5, 
              intervalUnit: monitor?.defaultIntervalUnit || 'minutes' 
            } 
          }];
        }
        return prev;
      } else {
        return prev.filter(m => m.monitorId !== monitorId);
      }
    });
  };

  const handleMonitorScheduleChange = (
    monitorId: string,
    field: keyof ScheduleConfig | 'type',
    value: any
  ) => {
    setCurrentAssociatedMonitors(prev =>
      prev.map(m => {
        if (m.monitorId === monitorId) {
          const updatedSchedule = { ...(m.schedule || { type: 'interval' as const, intervalValue: 5, intervalUnit: 'minutes' as const }) };
          if (field === 'type') { 
            updatedSchedule.type = value as 'disabled' | 'interval'; 
             if (value === 'disabled') {
              delete updatedSchedule.intervalValue;
              delete updatedSchedule.intervalUnit;
            } else if (value === 'interval') {
              const monitor = allMonitors.find(mon => mon.id === monitorId);
              updatedSchedule.intervalValue = updatedSchedule.intervalValue || monitor?.defaultIntervalValue || 5;
              updatedSchedule.intervalUnit = updatedSchedule.intervalUnit || monitor?.defaultIntervalUnit || 'minutes';
            }
          } else if (field === 'intervalValue') {
            updatedSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
          } else if (field === 'intervalUnit') {
            updatedSchedule.intervalUnit = value as 'minutes' | 'hours' | 'days';
          }
          return { ...m, schedule: updatedSchedule };
        }
        return m;
      })
    );
  };
  
  const handleSaveAssociatedMonitors = () => {
    if (!group) return;
    setIsSaving(true);
    try {
      const updatedGroup = updateComputerGroup(group.id, { associatedMonitors: currentAssociatedMonitors });
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
      setIsManageMonitorsModalOpen(false);
      setMonitorSearchTerm('');
      toast({ title: "Success", description: "Associated monitors updated (Mock)." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save associated monitors (Mock).';
      toast({ title: "Error", description: errorMessage, variant: "destructive"});
    } finally {
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  const openManageMonitorsModal = () => {
    if (!group) return;
    const initialDialogMonitors = (group.associatedMonitors || []).map(am => {
        const monitorDetails = allMonitors.find(m => m.id === am.monitorId);
        return {
         ...am,
         schedule: am.schedule || { 
             type: 'interval' as const, 
             intervalValue: monitorDetails?.defaultIntervalValue || 5, 
             intervalUnit: monitorDetails?.defaultIntervalUnit || 'minutes' 
            }
        };
    });
    setCurrentAssociatedMonitors(initialDialogMonitors);
    setMonitorSearchTerm('');
    setIsManageMonitorsModalOpen(true);
  };

  const getProcedureNameFromMock = (procedureId: string): string => {
    return getProcedureById(procedureId)?.name || 'Unknown Procedure';
  };
  
  const getMonitorDetailsFromMock = (monitorId: string): Monitor | undefined => {
    return getMonitorById(monitorId);
  }


  if (isLoading) {
    return (
        <div className="container mx-auto py-2">
            <Skeleton className="h-10 w-40 mb-6" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-6 w-1/3" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
                </div>
            </div>
             <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading group details...</p>
            </div>
        </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-destructive">{error} <Button onClick={() => router.push('/groups')} variant="outline" className="mt-4">Back to Groups</Button></div>;
  }
  
  if (!group) {
    return <div className="container mx-auto py-10 text-center">Group not found. <Button onClick={() => router.push('/groups')} variant="outline" className="mt-4">Back to Groups</Button></div>;
  }

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.push('/groups')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                    <div className="flex items-center gap-2">
                        <Users className="h-8 w-8 text-primary" />
                        <CardTitle className="text-3xl font-bold">{group.name}</CardTitle>
                    </div>
                    <CardDescription>{group.description} (Mock Data)</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-sm text-muted-foreground">
                    This group contains {group.computerIds.length} computer{group.computerIds.length !== 1 ? 's' : ''}.
                </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Computers in this Group</CardTitle>
                    <CardDescription>
                        The following computers are members of the "{group.name}" group. (Mock Data)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                {memberComputers.length > 0 ? (
                    <ComputerTable computers={memberComputers} /> 
                ) : (
                    <p className="text-muted-foreground">No computers are currently assigned to this group.</p>
                )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Associated Procedures</CardTitle>
                        <Dialog open={isManageProceduresModalOpen} onOpenChange={(isOpen) => { setIsManageProceduresModalOpen(isOpen); if (!isOpen) setProcedureSearchTerm('');}}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={openManageProceduresModal} disabled={isSaving || isLoading}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[725px]">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Procedures for {group.name}</DialogTitle>
                                <DialogDescription>Select procedures, configure their behavior, schedule, and order (Mock Data).</DialogDescription>
                                </DialogHeader>
                                <div className="py-2 relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                                    <Input 
                                        type="search"
                                        placeholder="Search procedures by name or description..."
                                        value={procedureSearchTerm}
                                        onChange={(e) => setProcedureSearchTerm(e.target.value)}
                                        className="pl-8 peer mb-3"
                                    />
                                </div>
                                <ScrollArea className="max-h-[calc(70vh-250px)] p-1">
                                <div className="space-y-3 py-2">
                                    {filteredProceduresForDialog.length === 0 && <p className="text-muted-foreground p-2 text-center">{allProcedures.length === 0 ? 'No procedures available.' : 'No procedures match your search.'}</p>}
                                    {filteredProceduresForDialog.map(proc => {
                                        const assocIndex = currentAssociatedProcedures.findIndex(ap => ap.procedureId === proc.id);
                                        const isAssociated = assocIndex !== -1;
                                        const config = isAssociated ? currentAssociatedProcedures[assocIndex] : undefined;
                                        
                                        return (
                                            <div key={`proc-dialog-${proc.id}`} className="rounded-md border p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <Label htmlFor={`proc-assoc-${proc.id}`} className="font-medium text-base">{proc.name}</Label>
                                                        <p className="text-xs text-muted-foreground mt-1">{proc.description}</p>
                                                    </div>
                                                    <Checkbox
                                                        id={`proc-assoc-${proc.id}`}
                                                        checked={isAssociated}
                                                        onCheckedChange={(checked) => handleProcedureAssociationChange(proc.id, !!checked)}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                                
                                                {isAssociated && config && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`proc-runnew-${proc.id}`}
                                                            checked={config.runOnNewMember}
                                                            onCheckedChange={(checked) => handleRunOnNewMemberChange(proc.id, !!checked)}
                                                            disabled={isSaving}
                                                        />
                                                        <Label htmlFor={`proc-runnew-${proc.id}`} className="text-sm font-normal">
                                                            Run automatically when a new computer is added to this group
                                                        </Label>
                                                    </div>

                                                    <div className="pt-3 border-t">
                                                        <Label className="text-sm font-semibold text-muted-foreground">Scheduling</Label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center mt-1">
                                                        <Select
                                                            value={config.schedule?.type || 'disabled'}
                                                            onValueChange={(value: 'disabled' | 'interval') => handleProcedureScheduleChange(proc.id, 'type', value)}
                                                            disabled={isSaving}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Select schedule type" /></SelectTrigger>
                                                            <SelectContent>
                                                            <SelectItem value="disabled">Disabled</SelectItem>
                                                            <SelectItem value="interval">Run at Interval</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        </div>
                                                        {config.schedule?.type === 'interval' && (
                                                        <div className="grid grid-cols-2 gap-2 items-end mt-2">
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`proc-interval-val-${proc.id}`} className="text-xs">Interval Value</Label>
                                                                <Input
                                                                    id={`proc-interval-val-${proc.id}`}
                                                                    type="number"
                                                                    placeholder="e.g., 60"
                                                                    min="1"
                                                                    value={config.schedule.intervalValue || ''}
                                                                    onChange={(e) => handleProcedureScheduleChange(proc.id, 'intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`proc-interval-unit-${proc.id}`} className="text-xs">Interval Unit</Label>
                                                                <Select
                                                                    id={`proc-interval-unit-${proc.id}`}
                                                                    value={config.schedule.intervalUnit || 'minutes'}
                                                                    onValueChange={(value: 'minutes' | 'hours' | 'days') => handleProcedureScheduleChange(proc.id, 'intervalUnit', value)}
                                                                    disabled={isSaving}
                                                                >
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {intervalUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        )}
                                                    </div>
                                                    <div className="pt-3 border-t">
                                                      <Label className="text-sm font-semibold text-muted-foreground">Order</Label>
                                                        <div className="flex gap-1 mt-1">
                                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(currentAssociatedProcedures.findIndex(p=>p.procedureId === proc.id), 'up')} disabled={isSaving || currentAssociatedProcedures.findIndex(p=>p.procedureId === proc.id) === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(currentAssociatedProcedures.findIndex(p=>p.procedureId === proc.id), 'down')} disabled={isSaving || currentAssociatedProcedures.findIndex(p=>p.procedureId === proc.id) === currentAssociatedProcedures.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {currentAssociatedProcedures.length > 0 && filteredProceduresForDialog.length > 0 && <Separator className="my-4"/> }
                                    {filteredProceduresForDialog.length > 0 && <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Procedure Execution Order</Label>}
                                    {currentAssociatedProcedures.map((assocProc, index) => {
                                        const procedureName = getProcedureNameFromMock(assocProc.procedureId);
                                        if (!procedureName || procedureName === 'Unknown Procedure') return null;
                                        return (
                                            <div key={`order-proc-${assocProc.procedureId}`} className="flex items-center justify-between p-2 border rounded-md mb-2">
                                                <span className="text-sm">{index + 1}. {procedureName}</span>
                                                <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(index, 'up')} disabled={isSaving || index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(index, 'down')} disabled={isSaving || index === currentAssociatedProcedures.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                </ScrollArea>
                                <DialogFooter>
                                <Button variant="outline" onClick={() => {setIsManageProceduresModalOpen(false); setProcedureSearchTerm('');}} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleSaveAssociatedProcedures} disabled={isSaving || allProcedures.length === 0}>
                                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save Associations
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <CardDescription>Procedures linked to this group, their automation settings, schedule, and order.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!group.associatedProcedures || group.associatedProcedures.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No procedures associated with this group yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {group.associatedProcedures.map((assocProc, index) => {
                                const procedureName = getProcedureNameFromMock(assocProc.procedureId);
                                if (!procedureName  || procedureName === 'Unknown Procedure') return <li key={`proc-display-unknown-${index}`} className="text-sm p-3 border rounded-md space-y-1 text-muted-foreground">Unknown Procedure (ID: {assocProc.procedureId}) - May have been deleted.</li>;
                                return (
                                    <li key={`proc-display-${assocProc.procedureId}`} className="text-sm p-3 border rounded-md space-y-1">
                                        <div className="font-medium">{index + 1}. {procedureName}</div>
                                        {assocProc.runOnNewMember && (<div className="flex items-center text-xs text-green-600"><ListChecks className="mr-1 h-3 w-3" /> Runs on new members</div>)}
                                        {assocProc.schedule && assocProc.schedule.type === 'interval' && (
                                            <div className="flex items-center text-xs text-blue-600">
                                                <Clock className="mr-1 h-3 w-3" />
                                                Runs every {assocProc.schedule.intervalValue || 'N/A'} {assocProc.schedule.intervalUnit || ''}
                                            </div>
                                        )}
                                        {(!assocProc.schedule || assocProc.schedule.type === 'disabled') && !assocProc.runOnNewMember && (
                                             <div className="flex items-center text-xs text-gray-500"><XCircle className="mr-1 h-3 w-3" /> No active automation</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Associated Monitors</CardTitle>
                        <Dialog open={isManageMonitorsModalOpen} onOpenChange={(isOpen) => { setIsManageMonitorsModalOpen(isOpen); if(!isOpen) setMonitorSearchTerm('');}}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={openManageMonitorsModal} disabled={isSaving || isLoading}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[725px]">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Monitors for {group.name}</DialogTitle>
                                <DialogDescription>Select monitors and configure their schedule for this group (Mock Data).</DialogDescription>
                                </DialogHeader>
                                 <div className="py-2 relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                                    <Input 
                                        type="search"
                                        placeholder="Search monitors by name or description..."
                                        value={monitorSearchTerm}
                                        onChange={(e) => setMonitorSearchTerm(e.target.value)}
                                        className="pl-8 peer mb-3"
                                    />
                                </div>
                                <ScrollArea className="max-h-[calc(70vh-250px)] p-1">
                                <div className="space-y-3 py-2">
                                    {filteredMonitorsForDialog.length === 0 && <p className="text-muted-foreground p-2 text-center">{allMonitors.length === 0 ? 'No monitors available.' : 'No monitors match your search.'}</p>}
                                    {filteredMonitorsForDialog.map(mon => { 
                                        const isAssociated = currentAssociatedMonitors.some(am => am.monitorId === mon.id);
                                        const config = currentAssociatedMonitors.find(am => am.monitorId === mon.id);
                                        
                                        return (
                                            <div key={`mon-dialog-${mon.id}`} className="rounded-md border p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <Label htmlFor={`mon-assoc-${mon.id}`} className="font-medium text-base">{mon.name}</Label>
                                                        <p className="text-xs text-muted-foreground mt-1">{mon.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Default: Every {mon.defaultIntervalValue} {mon.defaultIntervalUnit}. Email on alert: {mon.sendEmailOnAlert ? 'Yes' : 'No'}</p>
                                                    </div>
                                                    <Checkbox
                                                        id={`mon-assoc-${mon.id}`}
                                                        checked={isAssociated}
                                                        onCheckedChange={(checked) => handleMonitorAssociationChange(mon.id, !!checked)}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                                
                                                {isAssociated && config && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="pt-3 border-t">
                                                        <Label className="text-sm font-semibold text-muted-foreground">Group Schedule (Overrides Monitor Default)</Label>
                                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center mt-1">
                                                            <Select
                                                                value={config.schedule?.type || 'interval'}
                                                                onValueChange={(value: 'disabled' | 'interval') => handleMonitorScheduleChange(mon.id, 'type', value)}
                                                                disabled={isSaving}
                                                            >
                                                                <SelectTrigger><SelectValue placeholder="Select schedule type" /></SelectTrigger>
                                                                <SelectContent>
                                                                <SelectItem value="disabled">Disabled for this group</SelectItem>
                                                                <SelectItem value="interval">Run at Interval for this group</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {config.schedule?.type === 'interval' && (
                                                        <div className="grid grid-cols-2 gap-2 items-end mt-2">
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`mon-interval-val-${mon.id}`} className="text-xs">Interval Value</Label>
                                                                <Input
                                                                    id={`mon-interval-val-${mon.id}`}
                                                                    type="number"
                                                                    placeholder="e.g., 5"
                                                                    min="1"
                                                                    value={config.schedule.intervalValue || ''}
                                                                    onChange={(e) => handleMonitorScheduleChange(mon.id, 'intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`mon-interval-unit-${mon.id}`} className="text-xs">Interval Unit</Label>
                                                                <Select
                                                                    id={`mon-interval-unit-${mon.id}`}
                                                                    value={config.schedule.intervalUnit || 'minutes'}
                                                                    onValueChange={(value: 'minutes' | 'hours' | 'days') => handleMonitorScheduleChange(mon.id, 'intervalUnit', value)}
                                                                    disabled={isSaving}
                                                                >
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {intervalUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                </ScrollArea>
                                <DialogFooter>
                                <Button variant="outline" onClick={() => { setIsManageMonitorsModalOpen(false); setMonitorSearchTerm('');}} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleSaveAssociatedMonitors} disabled={isSaving || allMonitors.length === 0}>
                                   {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save Monitor Associations
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <CardDescription>Monitors linked to this group and their group-specific schedules.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!group.associatedMonitors || group.associatedMonitors.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No monitors associated with this group yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {group.associatedMonitors.map((assocMon) => {
                                const monitor = getMonitorDetailsFromMock(assocMon.monitorId); 
                                if (!monitor || monitor.name === 'Unknown Monitor') return <li key={`mon-display-unknown-${assocMon.monitorId}`} className="text-sm p-3 border rounded-md space-y-1 text-muted-foreground">Unknown Monitor (ID: {assocMon.monitorId}) - May have been deleted.</li>;
                                return (
                                    <li key={`mon-display-${assocMon.monitorId}`} className="text-sm p-3 border rounded-md space-y-1">
                                        <div className="font-medium">{monitor.name} {monitor.sendEmailOnAlert && <span className="text-xs text-blue-500">(Email Alert Active)</span>}</div>
                                        {assocMon.schedule && assocMon.schedule.type === 'interval' && (
                                            <div className="flex items-center text-xs text-blue-600">
                                                <Clock className="mr-1 h-3 w-3" />
                                                Runs for this group every {assocMon.schedule.intervalValue || 'N/A'} {assocMon.schedule.intervalUnit || ''}
                                            </div>
                                        )}
                                         {assocMon.schedule && assocMon.schedule.type === 'disabled' && (
                                            <div className="flex items-center text-xs text-gray-500"><XCircle className="mr-1 h-3 w-3" /> Disabled for this group</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

