
"use client";

import type { Computer, ComputerGroup, Procedure, ProcedureExecution, AssociatedProcedureConfig } from '@/types';
import { 
    mockComputerGroups, 
    mockComputers, 
    mockProcedures, 
    addComputerGroup, 
    updateComputerGroup, 
    addProcedureExecution,
    getProcedureById,
    getComputerById,
    getComputerGroupById
} from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Eye } from 'lucide-react';
import Link from 'next/link';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ComputerGroup[]>([]);
  const [allComputers] = useState<Computer[]>(mockComputers); // Assuming mockComputers doesn't change during session
  const { toast } = useToast();

  // Initialize state from mockData and ensure it updates if mockData changes (e.g. via other pages)
  useEffect(() => {
    setGroups([...mockComputerGroups]); 
  }, []);


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<ComputerGroup | null>(null);
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);

  const triggerAutomatedProcedures = (group: ComputerGroup, newlyAddedComputerIds: string[]) => {
    if (!group.associatedProcedures || newlyAddedComputerIds.length === 0) return;

    let proceduresTriggeredCount = 0;

    group.associatedProcedures.forEach(assocProc => {
      if (assocProc.runOnNewMember) {
        const procedure = getProcedureById(assocProc.procedureId);
        if (!procedure) return;

        newlyAddedComputerIds.forEach(computerId => {
          const computer = getComputerById(computerId);
          if (!computer || computer.status === 'Offline') return; // Only run on online computers

          const newExecution: ProcedureExecution = {
            id: `exec-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            procedureId: procedure.id,
            computerId: computer.id,
            computerName: computer.name,
            status: 'Pending',
            logs: `Automated execution started for "${procedure.name}" on new group member "${computer.name}"...`,
            startTime: new Date().toISOString(),
          };
          addProcedureExecution(newExecution);
          proceduresTriggeredCount++;
          
          // Simulate execution progression (simplified)
          setTimeout(() => {
            const success = Math.random() > 0.2;
             const finalStatus = success ? 'Success' : 'Failed';
             const logUpdate = success ? '\nExecution completed successfully.' : '\nExecution failed (simulated auto-run error).';
             const updatedExecutions = mockProcedureExecutions.map(ex => 
                ex.id === newExecution.id ? {
                    ...ex, 
                    status: finalStatus, 
                    endTime: new Date().toISOString(), 
                    logs: ex.logs + logUpdate,
                    output: success ? "OK" : "Error"
                } : ex
             );
             // This direct mutation is for mock purposes. In a real app, this would be an API call.
             // To reflect in other parts of the app, mockProcedureExecutions in mockData.ts should be 'let'
             // and potentially re-imported or managed via a global state/context.
             // For now, addProcedureExecution handles adding to the global mock array.
          }, 2000 + Math.random() * 1000);
        });
      }
    });
    if (proceduresTriggeredCount > 0) {
        toast({
            title: "Automated Procedures Triggered",
            description: `${proceduresTriggeredCount} procedure(s) are being automatically executed on new group members.`,
        });
    }
  };


  const handleCreateGroup = () => {
    const newGroup: ComputerGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      description: groupDescription,
      computerIds: selectedComputerIds,
      associatedProcedures: [] // New groups start with no associated procedures by default
    };
    addComputerGroup(newGroup); // Update mock data source
    setGroups(prev => [...prev, newGroup]); // Update local state
    
    // For newly created group with members, check if default procedures should run
    // This example assumes no default procedures run on brand new group creation,
    // only when members are added to an *existing* group with `runOnNewMember` procedures.
    // If initial members should trigger, logic would be similar to edit.
    // For simplicity here, we consider selectedComputerIds as "newly added" to this new group.
    // However, a group usually has its procedures configured *after* creation.
    // Let's assume procedures are configured on the group details page.
    // So, for CREATE, no automatic run, as procedures aren't associated yet.

    resetForm();
    setIsCreateModalOpen(false);
    toast({title: "Success", description: `Group "${newGroup.name}" created.`});
  };

  const handleEditGroup = (group: ComputerGroup) => {
    setCurrentGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description);
    setSelectedComputerIds([...group.computerIds]); // Operate on a copy for edit
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = () => {
    if (!currentGroup) return;

    const originalComputerIds = currentGroup.computerIds;
    const newlyAddedComputerIds = selectedComputerIds.filter(id => !originalComputerIds.includes(id));

    const updatedGroupData: ComputerGroup = { 
        ...currentGroup, 
        name: groupName, 
        description: groupDescription, 
        computerIds: selectedComputerIds,
        // associatedProcedures are managed on the group detail page, so we preserve existing ones
        associatedProcedures: currentGroup.associatedProcedures || [] 
    };
    
    updateComputerGroup(updatedGroupData); // Update mock data source
    setGroups(groups.map(g => g.id === currentGroup.id ? updatedGroupData : g)); // Update local state
    
    // Fetch the potentially updated group from mockData to ensure we have the latest associatedProcedures
    const freshGroupData = getComputerGroupById(currentGroup.id);
    if (freshGroupData && newlyAddedComputerIds.length > 0) {
      triggerAutomatedProcedures(freshGroupData, newlyAddedComputerIds);
    }

    resetForm();
    setIsEditModalOpen(false);
    setCurrentGroup(null);
    toast({title: "Success", description: `Group "${updatedGroupData.name}" updated.`});
  };
  
  const handleDeleteGroup = (groupId: string) => {
    // In a real app, you'd call an API. Here we filter the mock data.
    // This change won't persist if not handled in mockData.ts or by re-fetching.
    // For now, just update local state.
    const groupToDelete = mockComputerGroups.find(g => g.id === groupId);
    if (groupToDelete) {
        const updatedMockGroups = mockComputerGroups.filter(g => g.id !== groupId);
        // This is a hacky way to update the global mock data array
        mockComputerGroups.length = 0; 
        Array.prototype.push.apply(mockComputerGroups, updatedMockGroups);
        setGroups(updatedMockGroups); // Update local state
        toast({title: "Success", description: `Group "${groupToDelete.name}" deleted.`});
    }
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedComputerIds([]);
  };

  const handleComputerSelection = (computerId: string) => {
    setSelectedComputerIds(prev => 
      prev.includes(computerId) ? prev.filter(id => id !== computerId) : [...prev, computerId]
    );
  };

  const GroupFormFields = (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input id="name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">Description</Label>
          <Textarea id="description" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label className="text-right col-span-1 pt-2">Computers</Label>
            <div className="col-span-3 max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/30">
                {allComputers.map(computer => (
                    <div key={computer.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                        <Checkbox 
                            id={`comp-groupform-${computer.id}`} 
                            checked={selectedComputerIds.includes(computer.id)}
                            onCheckedChange={() => handleComputerSelection(computer.id)}
                        />
                        <Label htmlFor={`comp-groupform-${computer.id}`} className="font-normal flex-1 cursor-pointer">{computer.name} <span className="text-xs text-muted-foreground">({computer.os})</span></Label>
                    </div>
                ))}
                {allComputers.length === 0 && <p className="text-sm text-muted-foreground p-2">No computers available to add.</p>}
            </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Computer Groups</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Group
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>Organize your computers into logical groups.</DialogDescription>
                </DialogHeader>
                {GroupFormFields}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup}>Create Group</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Groups Yet</CardTitle>
                <CardDescription>Create groups to organize your computers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Group
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate max-w-[80%]">{group.name}</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription className="h-10 overflow-hidden text-ellipsis">{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm font-medium text-foreground">
                  {group.computerIds.length} Computer{group.computerIds.length !== 1 ? 's' : ''}
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {group.computerIds.slice(0,3).map(id => {
                    const computer = allComputers.find(c => c.id === id);
                    return <li key={id}>{computer ? computer.name : 'Unknown Computer'}</li>;
                  })}
                  {group.computerIds.length > 3 && <li>...and {group.computerIds.length-3} more</li>}
                </ul>
                 <p className="text-sm font-medium text-foreground mt-2">
                  {group.associatedProcedures?.length || 0} Associated Procedure{group.associatedProcedures?.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                 <Button variant="ghost" size="sm" asChild>
                    <Link href={`/groups/${group.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                 </Button>
                <Dialog open={isEditModalOpen && currentGroup?.id === group.id} onOpenChange={(isOpen) => { if(!isOpen) setCurrentGroup(null); setIsEditModalOpen(isOpen);}}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Edit Group</DialogTitle>
                            <DialogDescription>Update group details and members.</DialogDescription>
                        </DialogHeader>
                        {GroupFormFields}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setCurrentGroup(null); }}>Cancel</Button>
                            <Button onClick={handleUpdateGroup}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
