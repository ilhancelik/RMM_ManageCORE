
"use client";

import type { Computer, ComputerGroup } from '@/types';
import { getGroups, addComputerGroup, deleteComputerGroup, getComputers, triggerAutomatedProceduresForNewMember } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupTable } from '@/components/groups/GroupTable';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ComputerGroup[]>([]);
  const [allComputers, setAllComputers] = useState<Computer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupSelectedComputerIds, setNewGroupSelectedComputerIds] = useState<string[]>([]);

  const loadInitialData = useCallback(() => {
    setIsLoading(true);
    setIsLoadingComputers(true);
    setError(null);
    setTimeout(() => {
      try {
        setGroups(getGroups());
        setAllComputers(getComputers());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load group data from mocks.';
        setError(errorMessage);
        toast({ title: "Error Loading Data (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
        setIsLoadingComputers(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const resetCreateForm = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupSelectedComputerIds([]);
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleCreateGroupSubmit = () => {
    if (!newGroupName.trim()) {
        toast({title: "Validation Error", description: "Group name is required.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
      const groupPayload = {
        name: newGroupName,
        description: newGroupDescription,
        computerIds: newGroupSelectedComputerIds,
        associatedProcedures: [], 
        associatedMonitors: [],
      };

      const newGroup = addComputerGroup(groupPayload);
      newGroup.computerIds.forEach(compId => {
          triggerAutomatedProceduresForNewMember(compId, newGroup.id);
      });
      toast({title: "Success", description: `Group "${newGroupName}" created (Mock).`});
      
      setTimeout(() => {
        resetCreateForm();
        setIsCreateModalOpen(false);
        loadInitialData(); 
        setIsSubmitting(false);
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Creating Group", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteGroup = (groupId: string, groupNameText: string) => {
     if (!window.confirm(`Are you sure you want to delete group "${groupNameText}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true); 
    try {
        deleteComputerGroup(groupId);
        toast({title: "Success", description: `Group "${groupNameText}" deleted (Mock).`});
        setTimeout(() => {
          loadInitialData(); 
          setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting Group", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleComputerSelectionInCreateDialog = (computerId: string) => {
    setNewGroupSelectedComputerIds(prev => 
      prev.includes(computerId) ? prev.filter(id => id !== computerId) : [...prev, computerId]
    );
  };

  const CreateGroupFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="newGroupName" className="text-right">Name</Label>
        <Input id="newGroupName" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="col-span-3" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="newGroupDescription" className="text-right">Description</Label>
        <Textarea id="newGroupDescription" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} className="col-span-3" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-4 items-start gap-4 pt-2">
          <Label className="text-right col-span-1 pt-2">Computers</Label>
          <div className="col-span-3 max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/30">
              {isLoadingComputers ? (
                 <div className="p-2 text-sm text-muted-foreground flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading computers...</div>
              ) : allComputers.length === 0 ? (
                 <p className="text-sm text-muted-foreground p-2">No computers available to add.</p>
              ) : (
                allComputers.map(computer => (
                    <div key={computer.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                        <Checkbox 
                            id={`comp-creategroup-${computer.id}`} 
                            checked={newGroupSelectedComputerIds.includes(computer.id)}
                            onCheckedChange={() => handleComputerSelectionInCreateDialog(computer.id)}
                            disabled={isSubmitting}
                        />
                        <Label htmlFor={`comp-creategroup-${computer.id}`} className="font-normal flex-1 cursor-pointer">{computer.name} <span className="text-xs text-muted-foreground">({computer.os})</span></Label>
                    </div>
                ))
              )}
          </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-36" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading groups...</p></div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-destructive">{error} <Button onClick={loadInitialData} variant="outline" className="mt-4">Retry</Button></div>;
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Computer Groups</h1>
        <Button onClick={handleOpenCreateModal} disabled={isSubmitting || isLoadingComputers}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => { if(!isSubmitting) setIsCreateModalOpen(isOpen); if(!isOpen) resetCreateForm();}}>
          <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>Organize your computers into logical groups (Mock Data).</DialogDescription>
              </DialogHeader>
              {CreateGroupFormFields}
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }} disabled={isSubmitting}>Cancel</Button>
                  <Button onClick={handleCreateGroupSubmit} disabled={isSubmitting || isLoadingComputers}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
            <CardTitle>All Computer Groups</CardTitle>
            <CardDescription>
                View and manage all computer groups.
                {!isLoading && groups.length === 0 && ' No groups found.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
            ) : error ? (
                <p className="text-destructive text-center py-4">{error}</p>
            ) : groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4" />
                    <p className="font-semibold">No Groups Yet</p>
                    <p className="text-sm">Create groups to organize your computers.</p>
                    <Button onClick={handleOpenCreateModal} disabled={isSubmitting || isLoadingComputers} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Group
                    </Button>
                </div>
            ) : (
                <GroupTable 
                    groups={groups} 
                    onDelete={handleDeleteGroup}
                    disabled={isSubmitting}
                />
            )}
        </CardContent>
        {!isLoading && !error && groups.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                Showing {groups.length} groups.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
    
