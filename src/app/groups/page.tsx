
"use client";

import type { Computer, ComputerGroup } from '@/types';
import { mockComputerGroups, mockComputers } from '@/lib/mockData';
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
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ComputerGroup[]>(mockComputerGroups);
  const [allComputers] = useState<Computer[]>(mockComputers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<ComputerGroup | null>(null);
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);

  const handleCreateGroup = () => {
    const newGroup: ComputerGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      description: groupDescription,
      computerIds: selectedComputerIds,
    };
    setGroups([...groups, newGroup]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const handleEditGroup = (group: ComputerGroup) => {
    setCurrentGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description);
    setSelectedComputerIds(group.computerIds);
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = () => {
    if (!currentGroup) return;
    const updatedGroup = { ...currentGroup, name: groupName, description: groupDescription, computerIds: selectedComputerIds };
    setGroups(groups.map(g => g.id === currentGroup.id ? updatedGroup : g));
    resetForm();
    setIsEditModalOpen(false);
    setCurrentGroup(null);
  };
  
  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
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
        <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-1">Computers</Label>
            <div className="col-span-3 max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {allComputers.map(computer => (
                    <div key={computer.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`comp-${computer.id}`} 
                            checked={selectedComputerIds.includes(computer.id)}
                            onCheckedChange={() => handleComputerSelection(computer.id)}
                        />
                        <Label htmlFor={`comp-${computer.id}`}>{computer.name}</Label>
                    </div>
                ))}
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
                  <CardTitle>{group.name}</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>{group.description}</CardDescription>
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
