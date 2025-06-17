
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
import { ArrowLeft, Users, Settings, ListChecks, XCircle, Clock, ArrowUp, ArrowDown, Activity, Loader2, Search, Save, ListPlus, X, FileCode, HardDrive, RefreshCw } from 'lucide-react';
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

  // Edit state for group details and membership
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedComputerIds, setEditSelectedComputerIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isManageProceduresModalOpen, setIsManageProceduresModalOpen] = useState(false);
  const [currentAssociatedProcedures, setCurrentAssociatedProcedures] = useState<AssociatedProcedureConfig[]>([]);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');
  const [tempSelectedProcIdsInModal, setTempSelectedProcIdsInModal] = useState<Set<string>>(new Set());


  const [isManageMonitorsModalOpen, setIsManageMonitorsModalOpen] = useState(false);
  const [currentAssociatedMonitors, setCurrentAssociatedMonitors] = useState<AssociatedMonitorConfig[]>([]);
  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');

  const [isManageComputersModalOpen, setIsManageComputersModalOpen] = useState(false);
  const [computerSearchTerm, setComputerSearchTerm] = useState('');


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

          const initialProcedures = (fetchedGroup.associatedProcedures || []).map(ap => ({
            ...ap,
            schedule: ap.schedule || { type: 'disabled' as const }
          }));
          setCurrentAssociatedProcedures(initialProcedures);
          setTempSelectedProcIdsInModal(new Set(initialProcedures.map(p => p.procedureId)));


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


  const filteredAvailableProceduresForDialog = useMemo(() => {
    if (!procedureSearchTerm.trim()) {
        return allAvailableProcedures;
    }
    const lowerSearch = procedureSearchTerm.toLowerCase();
    return allAvailableProcedures.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.description.toLowerCase().includes(lowerSearch));
  }, [allAvailableProcedures, procedureSearchTerm]);

  const filteredMonitorsForDialog = useMemo(() => {
    if (!monitorSearchTerm.trim()) {
        return allMonitors;
    }
    const lowerSearch = monitorSearchTerm.toLowerCase();
    return allMonitors.filter(m => m.name.toLowerCase().includes(lowerSearch) || m.description.toLowerCase().includes(lowerSearch));
  }, [allMonitors, monitorSearchTerm]);

  const orderedAssociatedProceduresInModal = useMemo(() => {
    // Ensure getProcedureById is stable or memoized if it's part of component state
    return currentAssociatedProcedures.map(ap => ({
        ...ap,
        details: getProcedureById(ap.procedureId)
    })).filter(ap => ap.details && tempSelectedProcIdsInModal.has(ap.procedureId));
  }, [currentAssociatedProcedures, tempSelectedProcIdsInModal]);

  const handleSaveChangesToMock = () => {
    if (!group || !editName.trim()) {
        toast({ title: "Error", description: "Group name cannot be empty.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        const oldComputerIds = new Set(group.computerIds);
        // Use the 'group' state for associatedProcedures and associatedMonitors as they are staged there
        // by the "Apply" buttons in their respective modals.
        const payload: Partial<Omit<ComputerGroup, 'id'>> = {
            name: editName,
            description: editDescription,
            computerIds: editSelectedComputerIds,
            associatedProcedures: group.associatedProcedures,
            associatedMonitors: group.associatedMonitors,
        };
        const updatedGroup = updateComputerGroup(group.id, payload);
        if (updatedGroup) {
            setGroup(updatedGroup);
            // Re-initialize edit states from the updated group to reflect persisted data
            setEditName(updatedGroup.name);
            setEditDescription(updatedGroup.description);
            setEditSelectedComputerIds([...updatedGroup.computerIds]);
            // setCurrentAssociatedProcedures and setCurrentAssociatedMonitors are managed by their modals' apply actions now
            // So, they should reflect the group state after "Save All Changes".
            setCurrentAssociatedProcedures([...(updatedGroup.associatedProcedures || []).map(ap => ({...ap, schedule: ap.schedule || { type: 'disabled'}}))]);
            setTempSelectedProcIdsInModal(new Set((updatedGroup.associatedProcedures || []).map(p => p.procedureId)));

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
        }
        toast({ title: "Success", description: `Group "${editName}" updated (Mock).` });
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
    // Changes are stored in editSelectedComputerIds, main "Save All Changes" will persist them.
    toast({ title: "Membership Updated", description: "Computer selections updated. Click 'Save All Changes' to persist." });
  };

  // === Associated Procedures Modal Logic ===
  const openManageProceduresModal = () => {
      if (!group) return;
      // Initialize modal's local state from the main group state
      setCurrentAssociatedProcedures([...(group.associatedProcedures || []).map(ap => ({...ap, schedule: ap.schedule || {type: 'disabled'}}))]);
      setTempSelectedProcIdsInModal(new Set((group.associatedProcedures || []).map(p => p.procedureId)));
      setIsManageProceduresModalOpen(true);
  };

  const handleModalProcedureSelectionChange = (procedureId: string, isSelected: boolean) => {
    setTempSelectedProcIdsInModal(prev => {
        const newSet = new Set(prev);
        if (isSelected) {
            newSet.add(procedureId);
        } else {
            newSet.delete(procedureId);
        }
        return newSet;
    });
    // Update currentAssociatedProcedures based on tempSelectedProcIdsInModal
    setCurrentAssociatedProcedures(prevCurrent => {
        const procDetails = getProcedureById(procedureId);
        if (isSelected) {
            if (!prevCurrent.find(p => p.procedureId === procedureId)) {
                return [...prevCurrent, { procedureId, runOnNewMember: false, schedule: { type: 'disabled'} }];
            }
            return prevCurrent;
        } else {
            return prevCurrent.filter(p => p.procedureId !== procedureId);
        }
    });
  };

  const handleModalRunOnNewMemberChange = (procedureId: string, runOnNewMember: boolean) => {
      setCurrentAssociatedProcedures(prev =>
        prev.map(p => p.procedureId === procedureId ? { ...p, runOnNewMember } : p)
      );
  };

  const handleModalProcedureScheduleChange = (procedureId: string, field: keyof ScheduleConfig | 'type', value: any) => {
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

  const handleModalMoveProcedure = (currentIndex: number, direction: 'up' | 'down') => {
    setCurrentAssociatedProcedures(prev => {
        const newArray = [...prev];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= newArray.length) return prev;
        [newArray[currentIndex], newArray[targetIndex]] = [newArray[targetIndex], newArray[currentIndex]];
        return newArray;
    });
  };

  const handleModalApplyAssociatedProcedures = () => {
    // Update only the 'associatedProcedures' part of the main group state.
    // The main 'Save All Changes' button will persist everything.
    setGroup(prevGroup => ({...prevGroup!, associatedProcedures: currentAssociatedProcedures }));
    setIsManageProceduresModalOpen(false); setProcedureSearchTerm('');
    toast({ title: "Associated Procedures Staged", description: "Changes to associated procedures are staged. Click 'Save All Changes' to persist." });
  };
  // === End Associated Procedures Modal Logic ===


  // === Associated Monitors Modal Logic (similar to procedures) ===
  const openManageMonitorsModal = () => {
    if (!group) return;
    const initialMonitors = (group.associatedMonitors || []).map(am => {
        const md = allMonitors.find(m => m.id === am.monitorId);
        return {...am, schedule: am.schedule || { type: 'interval', intervalValue: md?.defaultIntervalValue || 15, intervalUnit: md?.defaultIntervalUnit || 'minutes'}}
    });
    setCurrentAssociatedMonitors(initialMonitors);
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
    setGroup(prevGroup => ({...prevGroup!, associatedMonitors: currentAssociatedMonitors}));
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
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Associated Procedures</CardTitle>
                        <Dialog open={isManageProceduresModalOpen} onOpenChange={(isOpen) => { setIsManageProceduresModalOpen(isOpen); if (!isOpen) setProcedureSearchTerm('');}}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={openManageProceduresModal} disabled={isSaving || isLoading}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Procedures for {group.name}</DialogTitle>
                                <DialogDescription>Select procedures, configure their behavior, schedule, and order. Applied changes here are staged until the main group is saved.</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                                    {/* Left: Available Procedures */}
                                    <div className="flex flex-col space-y-3 overflow-hidden">
                                        <Label className="text-base font-semibold">Available Procedures</Label>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground peer-focus:text-primary" />
                                            <Input
                                                type="search"
                                                placeholder="Search available procedures..."
                                                value={procedureSearchTerm}
                                                onChange={(e) => setProcedureSearchTerm(e.target.value)}
                                                className="pl-8 peer"
                                            />
                                        </div>
                                        <ScrollArea className="flex-grow border rounded-md p-2">
                                          {filteredAvailableProceduresForDialog.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">{allAvailableProcedures.length === 0 ? 'No procedures available.' : 'No procedures match your search.'}</p>}
                                          {filteredAvailableProceduresForDialog.map(proc => (
                                            <div key={`avail-proc-${proc.id}`} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                                                <Checkbox
                                                    id={`avail-proc-check-${proc.id}`}
                                                    checked={tempSelectedProcIdsInModal.has(proc.id)}
                                                    onCheckedChange={(checked) => handleModalProcedureSelectionChange(proc.id, !!checked)}
                                                />
                                                <Label htmlFor={`avail-proc-check-${proc.id}`} className="font-normal cursor-pointer flex-1">
                                                    {proc.name}
                                                    <span className="text-xs text-muted-foreground ml-1">({getProcedureSystemTypeLabel(proc.procedureSystemType)})</span>
                                                </Label>
                                            </div>
                                          ))}
                                        </ScrollArea>
                                    </div>
                                    {/* Right: Configured Procedures */}
                                    <div className="flex flex-col space-y-3 overflow-hidden">
                                        <Label className="text-base font-semibold">Associated & Configured ({orderedAssociatedProceduresInModal.length})</Label>
                                        <ScrollArea className="flex-grow border rounded-md p-2">
                                            {orderedAssociatedProceduresInModal.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">No procedures selected or associated yet.</p>}
                                            {orderedAssociatedProceduresInModal.map((assocProc, index) => {
                                                if (!assocProc.details) return null;
                                                return (
                                                    <div key={`cfg-proc-${assocProc.procedureId}`} className="border p-3 rounded-md mb-3 space-y-3 bg-background shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium">{index + 1}. {assocProc.details.name}</div>
                                                            <div className="flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleModalMoveProcedure(index, 'up')} disabled={isSaving || index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleModalMoveProcedure(index, 'down')} disabled={isSaving || index === orderedAssociatedProceduresInModal.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleModalProcedureSelectionChange(assocProc.procedureId, false)}><X className="h-4 w-4" /></Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`proc-runnew-${assocProc.procedureId}`}
                                                                checked={assocProc.runOnNewMember}
                                                                onCheckedChange={(checked) => handleModalRunOnNewMemberChange(assocProc.procedureId, !!checked)}
                                                                disabled={isSaving}
                                                            />
                                                            <Label htmlFor={`proc-runnew-${assocProc.procedureId}`} className="text-sm font-normal">Run on new members</Label>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-semibold text-muted-foreground">Schedule</Label>
                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    value={assocProc.schedule?.type || 'disabled'}
                                                                    onValueChange={(value: 'disabled' | 'interval') => handleModalProcedureScheduleChange(assocProc.procedureId, 'type', value)}
                                                                    disabled={isSaving}
                                                                >
                                                                    <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
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
                                                                            onChange={(e) => handleModalProcedureScheduleChange(assocProc.procedureId, 'intervalValue', e.target.value ? parseInt(e.target.value) : undefined)}
                                                                            disabled={isSaving} className="w-20 h-9"
                                                                        />
                                                                        <Select
                                                                            value={assocProc.schedule.intervalUnit || 'minutes'}
                                                                            onValueChange={(value: 'minutes' | 'hours' | 'days') => handleModalProcedureScheduleChange(assocProc.procedureId, 'intervalUnit', value)}
                                                                            disabled={isSaving}
                                                                        >
                                                                            <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {intervalUnits.map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </ScrollArea>
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button variant="outline" onClick={() => {setIsManageProceduresModalOpen(false); setProcedureSearchTerm('');}} disabled={isSaving}>Cancel</Button>
                                    <Button onClick={handleModalApplyAssociatedProcedures} disabled={isSaving}>
                                    Apply Procedure Associations
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <CardDescription>Procedures linked to this group, their automation settings, schedule, and order. Staged changes require "Save All Changes" to persist.</CardDescription>
                </CardHeader>
                <CardContent>
                     {(!group.associatedProcedures || group.associatedProcedures.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No procedures associated with this group yet. Click 'Manage' to add.</p>
                    ) : (
                        <ScrollArea className="h-48">
                            <ul className="space-y-2">
                                {group.associatedProcedures.map((assocProc, index) => {
                                    const procedureDetails = getProcedureById(assocProc.procedureId);
                                    if (!procedureDetails) return <li key={`proc-display-unknown-${index}`} className="text-sm p-2.5 border rounded-md space-y-0.5 text-muted-foreground">Unknown Procedure (ID: {assocProc.procedureId}) - May have been deleted.</li>;
                                    return (
                                        <li key={`proc-display-${assocProc.procedureId}`} className="text-sm p-2.5 border rounded-md space-y-0.5">
                                            <div className="font-medium flex items-center">
                                                {index + 1}. {getProcedureSystemTypeIcon(procedureDetails.procedureSystemType)} {procedureDetails.name}
                                                <Badge variant="outline" className="ml-2 text-xs">{getProcedureSystemTypeLabel(procedureDetails.procedureSystemType)}</Badge>
                                            </div>
                                            <div className="flex items-center text-xs gap-3 pl-1">
                                                {assocProc.runOnNewMember && (<div className="flex items-center text-green-600"><ListPlus className="mr-1 h-3 w-3" /> Runs on new members</div>)}
                                                {assocProc.schedule && assocProc.schedule.type !== 'disabled' && (
                                                    <div className="flex items-center text-blue-600">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {formatSchedule(assocProc.schedule)}
                                                    </div>
                                                )}
                                            </div>
                                            {(!assocProc.schedule || assocProc.schedule.type === 'disabled') && !assocProc.runOnNewMember && (
                                                <div className="flex items-center text-xs text-gray-500 pl-1"><XCircle className="mr-1 h-3 w-3" /> No active automation</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </ScrollArea>
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
                    {(!group.associatedMonitors || group.associatedMonitors.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No monitors associated with this group yet. Click 'Manage' to add.</p>
                    ) : (
                         <ScrollArea className="h-40">
                            <ul className="space-y-2">
                                {group.associatedMonitors.map((assocMon) => {
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
