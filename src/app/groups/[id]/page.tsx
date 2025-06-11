
"use client";

import { useParams, useRouter } from 'next/navigation';
import { 
    mockComputerGroups, 
    mockComputers, 
    mockProcedures, 
    mockMonitors, // Import mockMonitors
    updateComputerGroup, 
    getProcedureById, 
    getMonitorById, // Import getMonitorById
    getComputerGroupById 
} from '@/lib/mockData';
import type { ComputerGroup, Computer, Procedure, Monitor, AssociatedProcedureConfig, AssociatedMonitorConfig, ScheduleConfig } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Edit, Trash2, PlusCircle, Settings, ListChecks, XCircle, Clock, ArrowUp, ArrowDown, Activity } from 'lucide-react'; // Added Activity
import { ComputerTable } from '@/components/computers/ComputerTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
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

const intervalUnits: ScheduleConfig['intervalUnit'][] = ['minutes', 'hours', 'days'];

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [memberComputers, setMemberComputers] = useState<Computer[]>([]);
  
  const [isManageProceduresModalOpen, setIsManageProceduresModalOpen] = useState(false);
  const [currentAssociatedProcedures, setCurrentAssociatedProcedures] = useState<AssociatedProcedureConfig[]>([]);

  const [isManageMonitorsModalOpen, setIsManageMonitorsModalOpen] = useState(false);
  const [currentAssociatedMonitors, setCurrentAssociatedMonitors] = useState<AssociatedMonitorConfig[]>([]);


  useEffect(() => {
    const foundGroup = getComputerGroupById(id) || null;
    setGroup(foundGroup);
    if (foundGroup) {
      const computersInGroup = mockComputers.filter(c => foundGroup.computerIds.includes(c.id));
      setMemberComputers(computersInGroup);
      
      const initialProcedures = (foundGroup.associatedProcedures || []).map(ap => ({
        ...ap,
        schedule: ap.schedule || { type: 'disabled' as const } 
      }));
      setCurrentAssociatedProcedures(initialProcedures);

      const initialMonitors = (foundGroup.associatedMonitors || []).map(am => ({
        ...am,
        schedule: am.schedule || { type: 'disabled' as const }
      }));
      setCurrentAssociatedMonitors(initialMonitors);
    }
  }, [id]);

  // Procedure Association Handlers
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
              updatedSchedule.intervalValue = 60; // Default value
              updatedSchedule.intervalUnit = 'minutes'; // Default unit
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
    const updatedGroup = { ...group, associatedProcedures: currentAssociatedProcedures };
    updateComputerGroup(updatedGroup);
    setGroup(updatedGroup); 
    setIsManageProceduresModalOpen(false);
    toast({ title: "Success", description: "Associated procedures updated." });
  };

  const openManageProceduresModal = () => {
    if (!group) return;
    const initialDialogProcedures = (group.associatedProcedures || []).map(ap => ({
      ...ap,
      schedule: ap.schedule || { type: 'disabled' as const }
    }));
    setCurrentAssociatedProcedures(initialDialogProcedures);
    setIsManageProceduresModalOpen(true);
  };

  // Monitor Association Handlers
  const handleMonitorAssociationChange = (monitorId: string, isAssociated: boolean) => {
    setCurrentAssociatedMonitors(prev => {
      if (isAssociated) {
        if (!prev.some(m => m.monitorId === monitorId)) {
          const monitor = getMonitorById(monitorId);
          return [...prev, { 
            monitorId, 
            schedule: { 
              type: 'interval', // Default to interval for monitors
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
          if (field === 'type') { // Though for monitors, it's usually always interval based or uses monitor default implicitly.
            updatedSchedule.type = value as 'disabled' | 'interval'; // Keep disabled for flexibility
             if (value === 'disabled') {
              delete updatedSchedule.intervalValue;
              delete updatedSchedule.intervalUnit;
            } else if (value === 'interval') {
              const monitor = getMonitorById(monitorId);
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
    const updatedGroup = { ...group, associatedMonitors: currentAssociatedMonitors };
    updateComputerGroup(updatedGroup);
    setGroup(updatedGroup);
    setIsManageMonitorsModalOpen(false);
    toast({ title: "Success", description: "Associated monitors updated." });
  };

  const openManageMonitorsModal = () => {
    if (!group) return;
    const initialDialogMonitors = (group.associatedMonitors || []).map(am => ({
      ...am,
      schedule: am.schedule || { type: 'interval' as const, intervalValue: getMonitorById(am.monitorId)?.defaultIntervalValue || 5, intervalUnit: getMonitorById(am.monitorId)?.defaultIntervalUnit || 'minutes' }
    }));
    setCurrentAssociatedMonitors(initialDialogMonitors);
    setIsManageMonitorsModalOpen(true);
  };


  if (!group) {
    return <div className="container mx-auto py-10 text-center">Group not found.</div>;
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
                    <CardDescription>{group.description}</CardDescription>
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
                    <div className="flex justify-between items-center">
                        <CardTitle>Computers in this Group</CardTitle>
                    </div>
                    <CardDescription>
                        The following computers are members of the "{group.name}" group.
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
            {/* Associated Procedures Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Associated Procedures</CardTitle>
                        <Dialog open={isManageProceduresModalOpen} onOpenChange={setIsManageProceduresModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={openManageProceduresModal}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[725px]">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Procedures for {group.name}</DialogTitle>
                                <DialogDescription>Select procedures, configure their behavior, schedule, and order.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[calc(80vh-200px)] p-1">
                                <div className="space-y-3 py-2">
                                    {mockProcedures.map(proc => {
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
                                                    />
                                                </div>
                                                
                                                {isAssociated && config && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`proc-runnew-${proc.id}`}
                                                            checked={config.runOnNewMember}
                                                            onCheckedChange={(checked) => handleRunOnNewMemberChange(proc.id, !!checked)}
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
                                                                />
                                                            </div>
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`proc-interval-unit-${proc.id}`} className="text-xs">Interval Unit</Label>
                                                                <Select
                                                                    id={`proc-interval-unit-${proc.id}`}
                                                                    value={config.schedule.intervalUnit || 'minutes'}
                                                                    onValueChange={(value: 'minutes' | 'hours' | 'days') => handleProcedureScheduleChange(proc.id, 'intervalUnit', value)}
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
                                    {currentAssociatedProcedures.length > 0 && <Separator className="my-4"/> }
                                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Procedure Order</Label>
                                    {currentAssociatedProcedures.map((assocProc, index) => {
                                        const procedure = getProcedureById(assocProc.procedureId);
                                        if (!procedure) return null;
                                        return (
                                            <div key={`order-proc-${assocProc.procedureId}`} className="flex items-center justify-between p-2 border rounded-md mb-2">
                                                <span className="text-sm">{index + 1}. {procedure.name}</span>
                                                <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveProcedure(index, 'down')} disabled={index === currentAssociatedProcedures.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                </ScrollArea>
                                <DialogFooter>
                                <Button variant="outline" onClick={() => setIsManageProceduresModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveAssociatedProcedures}>Save Associations</Button>
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
                                const procedure = getProcedureById(assocProc.procedureId);
                                if (!procedure) return null;
                                return (
                                    <li key={`proc-display-${assocProc.procedureId}`} className="text-sm p-3 border rounded-md space-y-1">
                                        <div className="font-medium">{index + 1}. {procedure.name}</div>
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

            {/* Associated Monitors Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Associated Monitors</CardTitle>
                        <Dialog open={isManageMonitorsModalOpen} onOpenChange={setIsManageMonitorsModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={openManageMonitorsModal}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[725px]">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Monitors for {group.name}</DialogTitle>
                                <DialogDescription>Select monitors and configure their schedule for this group.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[calc(80vh-200px)] p-1">
                                <div className="space-y-3 py-2">
                                    {mockMonitors.map(mon => {
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
                                                    />
                                                </div>
                                                
                                                {isAssociated && config && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="pt-3 border-t">
                                                        <Label className="text-sm font-semibold text-muted-foreground">Group Schedule (Overrides Monitor Default)</Label>
                                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center mt-1">
                                                            <Select
                                                                value={config.schedule?.type || 'interval'} // Monitors usually interval
                                                                onValueChange={(value: 'disabled' | 'interval') => handleMonitorScheduleChange(mon.id, 'type', value)}
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
                                                                />
                                                            </div>
                                                            <div className='space-y-1'>
                                                                <Label htmlFor={`mon-interval-unit-${mon.id}`} className="text-xs">Interval Unit</Label>
                                                                <Select
                                                                    id={`mon-interval-unit-${mon.id}`}
                                                                    value={config.schedule.intervalUnit || 'minutes'}
                                                                    onValueChange={(value: 'minutes' | 'hours' | 'days') => handleMonitorScheduleChange(mon.id, 'intervalUnit', value)}
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
                                <Button variant="outline" onClick={() => setIsManageMonitorsModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveAssociatedMonitors}>Save Monitor Associations</Button>
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
                                const monitor = getMonitorById(assocMon.monitorId);
                                if (!monitor) return null;
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

