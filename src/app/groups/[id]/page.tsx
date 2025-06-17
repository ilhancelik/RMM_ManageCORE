
"use client";

import { useParams, useRouter } from 'next/navigation';
import {
    getGroupById,
    updateComputerGroup,
    getProcedures,
    getComputers as getAllComputersFromMock,
    getMonitors,
    getProcedureById,
    getMonitorById,
    triggerAutomatedProceduresForNewMember
} from '@/lib/mockData';
import type { ComputerGroup, Computer, Procedure, Monitor, AssociatedProcedureConfig, AssociatedMonitorConfig, ScheduleConfig, ProcedureSystemType, WindowsUpdateScopeOptions } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Settings, ListChecks, XCircle, Clock, ArrowUp, ArrowDown, Activity, Loader2, Search, Save, ListPlus, X, FileCode, HardDrive, RefreshCw, PlusCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

const intervalUnits: ScheduleConfig['intervalUnit'][] = ['minutes', 'hours', 'days'];

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [allComputersForMembership, setAllComputersForMembership] = useState<Computer[]>([]);
  const [allAvailableProcedures, setAllAvailableProcedures] = useState<Procedure[]>([]);
  const [allMonitors, setAllMonitors] = useState<Monitor[]>([]);

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedComputerIds, setEditSelectedComputerIds] = useState<string[]>([]);
  
  // This state now directly manages the procedures shown in the accordion
  const [currentAssociatedProcedures, setCurrentAssociatedProcedures] = useState<AssociatedProcedureConfig[]>([]);
  const [currentAssociatedMonitors, setCurrentAssociatedMonitors] = useState<AssociatedMonitorConfig[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isManageMonitorsModalOpen, setIsManageMonitorsModalOpen] = useState(false);
  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');

  const [isManageComputersModalOpen, setIsManageComputersModalOpen] = useState(false);
  const [computerSearchTerm, setComputerSearchTerm] = useState('');

  const [isAddProceduresToGroupModalOpen, setIsAddProceduresToGroupModalOpen] = useState(false);
  const [addProcToGroupSearchTerm, setAddProcToGroupSearchTerm] = useState('');
  const [tempSelectedProcIdsForAddDialog, setTempSelectedProcIdsForAddDialog] = useState<Set<string>>(new Set());


  const loadGroupDetails = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        const fetchedGroup = getGroupById(id);
        const fetchedProcedures = getProcedures();
        const fetchedAllComputers = getAllComputersFromMock();
        const fetchedMonitors = getMonitors();

        setGroup(fetchedGroup || null);
        setAllAvailableProcedures(fetchedProcedures);
        setAllComputersForMembership(fetchedAllComputers);
        setAllMonitors(fetchedMonitors);

        if (fetchedGroup) {
          setEditName(fetchedGroup.name);
          setEditDescription(fetchedGroup.description);
          setEditSelectedComputerIds([...fetchedGroup.computerIds]);

          setCurrentAssociatedProcedures((fetchedGroup.associatedProcedures || []).map(ap => ({
            ...ap,
            schedule: ap.schedule || { type: 'disabled' as const }
          })));
          
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

  const filteredComputersForMembershipDialog = useMemo(() => {
    if (!computerSearchTerm.trim()) {
      return allComputersForMembership;
    }
    const lowerSearchTerm = computerSearchTerm.toLowerCase();
    return allComputersForMembership.filter(computer =>
      computer.name.toLowerCase().includes(lowerSearchTerm) ||
      (computer.os && computer.os.toLowerCase().includes(lowerSearchTerm)) ||
      (computer.ipAddress && computer.ipAddress.toLowerCase().includes(lowerSearchTerm)) ||
      computer.id.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allComputersForMembership, computerSearchTerm]);

  const filteredMonitorsForDialog = useMemo(() => {
    if (!monitorSearchTerm.trim()) {
        return allMonitors;
    }
    const lowerSearch = monitorSearchTerm.toLowerCase();
    return allMonitors.filter(m => m.name.toLowerCase().includes(lowerSearch) || m.description.toLowerCase().includes(lowerSearch));
  }, [allMonitors, monitorSearchTerm]);

  const filteredProceduresForAddDialog = useMemo(() => {
    if (!addProcToGroupSearchTerm.trim()) {
        return allAvailableProcedures;
    }
    const lowerSearch = addProcToGroupSearchTerm.toLowerCase();
    return allAvailableProcedures.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.description.toLowerCase().includes(lowerSearch));
  }, [allAvailableProcedures, addProcToGroupSearchTerm]);


  const handleSaveChangesToMock = () => {
    if (!group || !editName.trim()) {
        toast({ title: "Error", description: "Group name cannot be empty.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        const oldComputerIds = new Set(group.computerIds);
        const payload: Partial<Omit<ComputerGroup, 'id'>> = {
            name: editName,
            description: editDescription,
            computerIds: editSelectedComputerIds,
            associatedProcedures: currentAssociatedProcedures, // Use the state directly
            associatedMonitors: currentAssociatedMonitors, // Use the state directly
        };
        const updatedGroup = updateComputerGroup(group.id, payload);
        
        if (updatedGroup) {
            setGroup(updatedGroup);
            setEditName(updatedGroup.name);
            setEditDescription(updatedGroup.description);
            setEditSelectedComputerIds([...updatedGroup.computerIds]);
            setCurrentAssociatedProcedures([...(updatedGroup.associatedProcedures || []).map(ap => ({...ap, schedule: ap.schedule || { type: 'disabled'}}))]);

            const defaultMonitorSchedule = (monitorId?: string): ScheduleConfig => {
                const monitorDetails = allMonitors.find(m => m.id === monitorId);
                return {
                    type: 'interval' as const,
                    intervalValue: monitorDetails?.defaultIntervalValue || 15,
                    intervalUnit: monitorDetails?.defaultIntervalUnit || 'minutes'
                };
            };
            setCurrentAssociatedMonitors([...(updatedGroup.associatedMonitors || []).map(am => ({...am, schedule: am.schedule || defaultMonitorSchedule(am.monitorId)}))]);

            updatedGroup.computerIds.forEach(compId => {
                if (!oldComputerIds.has(compId)) {
                    triggerAutomatedProceduresForNewMember(compId, updatedGroup.id);
                }
            });
            toast({ title: "Success", description: `Group "${editName}" updated (Mock).` });
        } else {
          toast({ title: "Error", description: "Failed to update group in mock data.", variant: "destructive" });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save group details (Mock).';
        toast({ title: "Error Saving Group", description: errorMessage, variant: "destructive" });
    } finally {
        setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleComputerMembershipChangeInDialog = (computerId: string, checked: boolean) => {
    setEditSelectedComputerIds(prev => {
        if (checked) {
            return [...prev, computerId];
        } else {
            return prev.filter(id => id !== computerId);
        }
    });
  };

  const handleSaveComputerMembershipDialog = () => {
    setIsManageComputersModalOpen(false);
    setComputerSearchTerm('');
    toast({ title: "Membership Updated", description: "Computer selections staged. Click 'Save All Changes' to persist." });
  };

  // === Inline Associated Procedures Logic ===
  const handleAssociatedProcedureRunOnNewMemberChange = (procedureId: string, runOnNewMember: boolean) => {
    setCurrentAssociatedProcedures(prev =>
      prev.map(p => p.procedureId === procedureId ? { ...p, runOnNewMember } : p)
    );
  };

  const handleAssociatedProcedureScheduleChange = (procedureId: string, field: keyof ScheduleConfig | 'type', value: any) => {
    setCurrentAssociatedProcedures(prev =>
      prev.map(p => {
        if (p.procedureId === procedureId) {
          let newSchedule = { ...(p.schedule || { type: 'disabled' as const }) };
          if (field === 'type') {
            newSchedule.type = value;
            if (value === 'disabled') {
              delete newSchedule.intervalValue;
              delete newSchedule.intervalUnit;
            } else if (value === 'interval' && (!newSchedule.intervalValue || !newSchedule.intervalUnit)) {
              newSchedule.intervalValue = 24;
              newSchedule.intervalUnit = 'hours';
            }
          } else if (field === 'intervalValue') {
            newSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
          } else if (field === 'intervalUnit') {
            newSchedule.intervalUnit = value;
          }
          return { ...p, schedule: newSchedule };
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
    toast({ title: "Procedure Unstaged", description: "Procedure removed from this group's associations. Save changes to persist."});
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
    setIsAddProceduresToGroupModalOpen(false);
    setAddProcToGroupSearchTerm('');
    if (proceduresToAdd.length > 0) {
        toast({ title: "Procedures Staged", description: `${proceduresToAdd.length} procedure(s) added to group. Configure them below and save changes.`});
    }
  };

  // === Associated Monitors Modal Logic (remains as modal for now) ===
  const openManageMonitorsModal = () => {
    if (!group) return;
    const initialMonitors = (currentAssociatedMonitors || []).map(am => { // Use state not group.associatedMonitors
        const md = allMonitors.find(m => m.id === am.monitorId);
        return {...am, schedule: am.schedule || { type: 'interval', intervalValue: md?.defaultIntervalValue || 15, intervalUnit: md?.defaultIntervalUnit || 'minutes'}}
    });
    // setCurrentAssociatedMonitors(initialMonitors); // This line might be redundant if currentAssociatedMonitors is already up-to-date
    setIsManageMonitorsModalOpen(true);
  };

  const handleModalMonitorSelectionChange = (monitorId: string, isSelected: boolean) => {
    setCurrentAssociatedMonitors(prev => {
        const monitorDetails = allMonitors.find(m => m.id === monitorId);
        if (isSelected) {
            if (!prev.find(m => m.monitorId === monitorId)) {
                return [...prev, {
                    monitorId,
                    schedule: {
                        type: 'interval',
                        intervalValue: monitorDetails?.defaultIntervalValue || 15,
                        intervalUnit: monitorDetails?.defaultIntervalUnit || 'minutes'
                    }
                }];
            }
        } else {
            return prev.filter(m => m.monitorId !== monitorId);
        }
        return prev;
    });
  };

  const handleModalMonitorScheduleChange = (monitorId: string, field: keyof ScheduleConfig | 'type', value: any) => {
    setCurrentAssociatedMonitors(prev =>
      prev.map(m => {
        if (m.monitorId === monitorId) {
          let newSchedule = { ...(m.schedule || { type: 'interval' as const, intervalValue: 15, intervalUnit: 'minutes' as const }) };
          const monitorDetails = allMonitors.find(mon => mon.id === monitorId);

          if (field === 'type') {
            newSchedule.type = value;
            if (value === 'disabled') {
              delete newSchedule.intervalValue;
              delete newSchedule.intervalUnit;
            } else if (value === 'interval' && (!newSchedule.intervalValue || !newSchedule.intervalUnit)) {
              newSchedule.intervalValue = monitorDetails?.defaultIntervalValue || 15;
              newSchedule.intervalUnit = monitorDetails?.defaultIntervalUnit || 'minutes';
            }
          } else if (field === 'intervalValue') {
            newSchedule.intervalValue = value ? parseInt(value, 10) : undefined;
          } else if (field === 'intervalUnit') {
            newSchedule.intervalUnit = value;
          }
          return { ...m, schedule: newSchedule };
        }
        return m;
      })
    );
  };

  const handleModalApplyAssociatedMonitors = () => {
    // Changes are already in currentAssociatedMonitors state, so this modal "Apply"
    // just closes the modal. Main "Save All Changes" persists.
    setIsManageMonitorsModalOpen(false); setMonitorSearchTerm('');
    toast({ title: "Associated Monitors Staged", description: "Changes to associated monitors are staged. Click 'Save All Changes' to persist." });
  };
  // === End Associated Monitors Modal Logic ===


  const getProcedureNameFromMock = (procedureId: string): string => getProcedureById(procedureId)?.name || 'Unknown Procedure';
  const getMonitorDetailsFromMock = (monitorId: string): Monitor | undefined => getMonitorById(monitorId);

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

  const formatSchedule = (schedule?: ScheduleConfig): string => {
    if (!schedule || schedule.type === 'disabled') return 'Disabled';
    if (schedule.type === 'interval' && schedule.intervalValue && schedule.intervalUnit) {
        return `Every ${schedule.intervalValue} ${schedule.intervalUnit}`;
    }
    return 'Not Configured';
  };


  if (isLoading) {
    return (
        <div className="container mx-auto py-2">
            <Skeleton className="h-10 w-40 mb-6" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-32 mt-4" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
                </div>
            </div>
             <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading group details...</p></div>
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
        <Button variant="outline" onClick={() => router.push('/groups')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
        </Button>
        <Button onClick={handleSaveChangesToMock} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" /> }
            {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-primary" />
                      <CardTitle className="text-3xl font-bold">Edit Group</CardTitle>
                  </div>
                  <CardDescription>Modify the group's details and manage its members. (Mock Data)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="editGroupName">Group Name</Label>
                        <Input id="editGroupName" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
                    </div>
                    <div>
                        <Label htmlFor="editGroupDescription">Description</Label>
                        <Textarea id="editGroupDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={isSaving} rows={3}/>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Member Computers ({editSelectedComputerIds.length})</CardTitle>
                        <Dialog open={isManageComputersModalOpen} onOpenChange={(isOpen) => { setIsManageComputersModalOpen(isOpen); if (!isOpen) setComputerSearchTerm(''); }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isSaving || isLoading}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage Members
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                    <DialogTitle>Manage Member Computers for {group.name}</DialogTitle>
                                    <DialogDescription>Select computers to include in this group. (Mock Data)</DialogDescription>
                                </DialogHeader>
                                <div className="py-2 relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                                    <Input
                                        type="search"
                                        placeholder="Search computers by name, OS, IP..."
                                        value={computerSearchTerm}
                                        onChange={(e) => setComputerSearchTerm(e.target.value)}
                                        className="pl-8 peer mb-3"
                                    />
                                </div>
                                <ScrollArea className="max-h-[calc(70vh-250px)] p-1">
                                    <div className="space-y-2 py-1">
                                        {filteredComputersForMembershipDialog.length === 0 && <p className="text-muted-foreground p-2 text-center">{allComputersForMembership.length === 0 ? 'No computers available.' : 'No computers match your search.'}</p>}
                                        {filteredComputersForMembershipDialog.map(computer => (
                                            <div key={`comp-member-dialog-${computer.id}`} className="flex items-center space-x-3 p-2 hover:bg-muted/20 rounded-md">
                                                <Checkbox
                                                    id={`comp-check-dialog-${computer.id}`}
                                                    checked={editSelectedComputerIds.includes(computer.id)}
                                                    onCheckedChange={(checked) => handleComputerMembershipChangeInDialog(computer.id, !!checked)}
                                                    disabled={isSaving}
                                                />
                                                <Label htmlFor={`comp-check-dialog-${computer.id}`} className="font-normal cursor-pointer flex-1">
                                                    {computer.name} <span className="text-xs text-muted-foreground">({computer.os} - {computer.status})</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setIsManageComputersModalOpen(false); setComputerSearchTerm(''); }} disabled={isSaving}>Cancel</Button>
                                    <Button onClick={handleSaveComputerMembershipDialog} disabled={isSaving}>
                                        Apply Membership Changes
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>Computers currently part of this group. Click "Manage Members" to change. Staged changes require "Save All Changes" to persist.</CardDescription>
                </CardHeader>
                <CardContent>
                    {editSelectedComputerIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No computers currently in this group.</p>
                    ) : (
                        <ScrollArea className="h-40">
                            <ul className="space-y-1">
                                {editSelectedComputerIds.map(compId => {
                                    const computer = allComputersForMembership.find(c => c.id === compId);
                                    return (
                                        <li key={`display-member-${compId}`} className="text-sm p-1.5 border-b border-border/50 last:border-b-0">
                                            {computer ? `${computer.name} (${computer.os} - ${computer.status})` : `Unknown Computer (ID: ${compId})`}
                                        </li>
                                    );
                                })}
                            </ul>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            {/* ASSOCIATED PROCEDURES - Inline Accordion Management */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Associated Procedures</CardTitle>
                        <Dialog open={isAddProceduresToGroupModalOpen} onOpenChange={(isOpen) => { setIsAddProceduresToGroupModalOpen(isOpen); if(!isOpen) { setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}}}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isSaving || isLoading}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Procedure to Group
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
                                    <Button variant="outline" onClick={() => { setIsAddProceduresToGroupModalOpen(false); setAddProcToGroupSearchTerm(''); setTempSelectedProcIdsForAddDialog(new Set());}} disabled={isSaving}>Cancel</Button>
                                    <Button onClick={handleAddProceduresToGroupDialogSubmit} disabled={isSaving || tempSelectedProcIdsForAddDialog.size === 0}>
                                        Add Selected ({tempSelectedProcIdsForAddDialog.size}) to Group
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>Procedures linked to this group, their automation, schedule, and order. Changes are staged until "Save All Changes".</CardDescription>
                </CardHeader>
                <CardContent>
                    {currentAssociatedProcedures.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No procedures associated. Click "Add Procedure to Group" to add.</p>
                    ) : (
                        <Accordion type="multiple" className="w-full space-y-2">
                            {currentAssociatedProcedures.map((assocProc, index) => {
                                const procedureDetails = getProcedureById(assocProc.procedureId);
                                if (!procedureDetails) return (
                                    <div key={`error-proc-${index}`} className="p-3 border rounded-md text-destructive text-sm">
                                        Error: Associated procedure with ID {assocProc.procedureId} not found. It might have been deleted.
                                    </div>
                                );
                                return (
                                    <AccordionItem value={assocProc.procedureId} key={assocProc.procedureId} className="border rounded-md bg-background hover:bg-muted/30 transition-colors">
                                        <AccordionTrigger className="p-3 hover:no-underline">
                                            <div className="flex items-center gap-2 flex-1 text-left">
                                                <span className="font-mono text-xs w-6 text-muted-foreground">{(index + 1)}.</span>
                                                {getProcedureSystemTypeIcon(procedureDetails.procedureSystemType)}
                                                <span className="font-medium">{procedureDetails.name}</span>
                                                <Badge variant="outline" size="sm" className="text-xs">{getProcedureSystemTypeLabel(procedureDetails.procedureSystemType)}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground mr-2">{formatSchedule(assocProc.schedule)}</div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-3 border-t space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`runOnNew-${assocProc.procedureId}`}
                                                    checked={assocProc.runOnNewMember}
                                                    onCheckedChange={(checked) => handleAssociatedProcedureRunOnNewMemberChange(assocProc.procedureId, !!checked)}
                                                    disabled={isSaving}
                                                />
                                                <Label htmlFor={`runOnNew-${assocProc.procedureId}`} className="font-normal">Run on new members joining this group</Label>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-muted-foreground">Schedule Execution</Label>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={assocProc.schedule?.type || 'disabled'}
                                                        onValueChange={(value: 'disabled' | 'interval') => handleAssociatedProcedureScheduleChange(assocProc.procedureId, 'type', value)}
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
                                                                onChange={(e) => handleAssociatedProcedureScheduleChange(assocProc.procedureId, 'intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                                disabled={isSaving} className="w-20 h-9 text-sm"
                                                            />
                                                            <Select
                                                                value={assocProc.schedule.intervalUnit || 'minutes'}
                                                                onValueChange={(value: 'minutes' | 'hours' | 'days') => handleAssociatedProcedureScheduleChange(assocProc.procedureId, 'intervalUnit', value)}
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
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleMoveAssociatedProcedure(index, 'up')} disabled={isSaving || index === 0}><ArrowUp className="mr-1 h-4 w-4" /> Move Up</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleMoveAssociatedProcedure(index, 'down')} disabled={isSaving || index === currentAssociatedProcedures.length - 1}><ArrowDown className="mr-1 h-4 w-4" /> Move Down</Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleRemoveAssociatedProcedure(assocProc.procedureId)} disabled={isSaving}><X className="mr-1 h-4 w-4" /> Remove from Group</Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* ASSOCIATED MONITORS - Stays as modal for now */}
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
                            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Monitors for {group.name}</DialogTitle>
                                <DialogDescription>Select monitors and configure their schedule for this group. Applied changes are staged.</DialogDescription>
                                </DialogHeader>
                                 <div className="py-2 relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                                    <Input
                                        type="search"
                                        placeholder="Search available monitors..."
                                        value={monitorSearchTerm}
                                        onChange={(e) => setMonitorSearchTerm(e.target.value)}
                                        className="pl-8 peer mb-3"
                                    />
                                </div>
                                <ScrollArea className="flex-grow p-1">
                                <div className="space-y-3 py-2">
                                     {filteredMonitorsForDialog.length === 0 && <p className="text-muted-foreground p-2 text-center">{allMonitors.length === 0 ? 'No monitors available.' : 'No monitors match your search.'}</p>}
                                    {filteredMonitorsForDialog.map(mon => {
                                        const isAssociated = currentAssociatedMonitors.some(am => am.monitorId === mon.id);
                                        const config = currentAssociatedMonitors.find(am => am.monitorId === mon.id);

                                        return (
                                            <div key={`mon-dialog-${mon.id}`} className="rounded-md border p-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <Label htmlFor={`mon-assoc-${mon.id}`} className="font-medium text-base">{mon.name}</Label>
                                                         <p className="text-xs text-muted-foreground">{mon.description}</p>
                                                    </div>
                                                    <Checkbox
                                                        id={`mon-assoc-${mon.id}`}
                                                        checked={isAssociated}
                                                        onCheckedChange={(checked) => handleModalMonitorSelectionChange(mon.id, !!checked)}
                                                        disabled={isSaving}
                                                    />
                                                </div>

                                                {isAssociated && config && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="pt-3 border-t">
                                                        <Label className="text-sm font-semibold text-muted-foreground">Group Schedule</Label>
                                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center mt-1">
                                                            <Select
                                                                value={config.schedule?.type || 'interval'}
                                                                onValueChange={(value: 'disabled' | 'interval') => handleModalMonitorScheduleChange(mon.id, 'type', value)}
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
                                                                    onChange={(e) => handleModalMonitorScheduleChange(mon.id, 'intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`mon-interval-unit-${mon.id}`} className="text-xs">Interval Unit</Label>
                                                                <Select
                                                                    id={`mon-interval-unit-${mon.id}`}
                                                                    value={config.schedule.intervalUnit || 'minutes'}
                                                                    onValueChange={(value: 'minutes' | 'hours' | 'days') => handleModalMonitorScheduleChange(mon.id, 'intervalUnit', value)}
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
                                <DialogFooter className="pt-4">
                                <Button variant="outline" onClick={() => { setIsManageMonitorsModalOpen(false); setMonitorSearchTerm('');}} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleModalApplyAssociatedMonitors} disabled={isSaving || allMonitors.length === 0}>
                                  Apply Monitor Associations
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <CardDescription>Monitors linked to this group and their group-specific schedules. Staged changes require "Save All Changes" to persist.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!currentAssociatedMonitors || currentAssociatedMonitors.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No monitors associated with this group yet. Click 'Manage' to add.</p>
                    ) : (
                         <ScrollArea className="h-40">
                            <ul className="space-y-2">
                                {currentAssociatedMonitors.map((assocMon) => {
                                    const monitor = getMonitorDetailsFromMock(assocMon.monitorId);
                                    if (!monitor || monitor.name === 'Unknown Monitor') return <li key={`mon-display-unknown-${assocMon.monitorId}`} className="text-sm p-2.5 border rounded-md space-y-0.5 text-muted-foreground">Unknown Monitor (ID: {assocMon.monitorId}) - May have been deleted.</li>;
                                    return (
                                        <li key={`mon-display-${assocMon.monitorId}`} className="text-sm p-2.5 border rounded-md space-y-0.5">
                                            <div className="font-medium">{monitor.name} {monitor.sendEmailOnAlert && <Badge variant="outline" className="ml-2 text-xs">Email Alert</Badge>}</div>
                                             <div className="flex items-center text-xs gap-3 pl-1">
                                                {assocMon.schedule && assocMon.schedule.type !== 'disabled' && (
                                                    <div className="flex items-center text-blue-600">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {formatSchedule(assocMon.schedule)}
                                                    </div>
                                                )}
                                                 {(!assocMon.schedule || assocMon.schedule.type === 'disabled') && (
                                                    <div className="flex items-center text-xs text-gray-500"><XCircle className="mr-1 h-3 w-3" /> Disabled for this group</div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}

