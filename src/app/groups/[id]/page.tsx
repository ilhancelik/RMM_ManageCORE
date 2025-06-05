
"use client";

import { useParams, useRouter } from 'next/navigation';
import { mockComputerGroups, mockComputers, mockProcedures, updateComputerGroup, getProcedureById, getComputerGroupById } from '@/lib/mockData';
import type { ComputerGroup, Computer, Procedure, AssociatedProcedureConfig } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Edit, Trash2, PlusCircle, Settings, ListChecks, XCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [memberComputers, setMemberComputers] = useState<Computer[]>([]);
  const [isManageProceduresModalOpen, setIsManageProceduresModalOpen] = useState(false);
  const [
    currentAssociatedProcedures, 
    setCurrentAssociatedProcedures
  ] = useState<AssociatedProcedureConfig[]>([]);

  useEffect(() => {
    const foundGroup = getComputerGroupById(id) || null;
    setGroup(foundGroup);
    if (foundGroup) {
      const computersInGroup = mockComputers.filter(c => foundGroup.computerIds.includes(c.id));
      setMemberComputers(computersInGroup);
      setCurrentAssociatedProcedures(foundGroup.associatedProcedures || []);
    }
  }, [id]);

  const handleProcedureAssociationChange = (procedureId: string, isAssociated: boolean) => {
    if (isAssociated) {
      setCurrentAssociatedProcedures(prev => [...prev, { procedureId, runOnNewMember: false }]);
    } else {
      setCurrentAssociatedProcedures(prev => prev.filter(p => p.procedureId !== procedureId));
    }
  };

  const handleRunOnNewMemberChange = (procedureId: string, runOnNewMember: boolean) => {
    setCurrentAssociatedProcedures(prev => 
      prev.map(p => p.procedureId === procedureId ? { ...p, runOnNewMember } : p)
    );
  };

  const handleSaveAssociatedProcedures = () => {
    if (!group) return;
    const updatedGroup = { ...group, associatedProcedures: currentAssociatedProcedures };
    updateComputerGroup(updatedGroup); // Update mock data
    setGroup(updatedGroup); // Update local state
    setIsManageProceduresModalOpen(false);
    toast({ title: "Success", description: "Associated procedures updated." });
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
                    {/* Edit/Delete buttons can be added back here if needed, similar to original */}
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
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Associated Procedures</CardTitle>
                        <Dialog open={isManageProceduresModalOpen} onOpenChange={setIsManageProceduresModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setCurrentAssociatedProcedures(group.associatedProcedures || [])}>
                                    <Settings className="mr-2 h-4 w-4" /> Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                <DialogTitle>Manage Associated Procedures for {group.name}</DialogTitle>
                                <DialogDescription>Select procedures to associate with this group and configure their behavior.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[400px] p-1">
                                <div className="space-y-3 py-2">
                                    {mockProcedures.map(proc => {
                                    const isAssociated = currentAssociatedProcedures.some(ap => ap.procedureId === proc.id);
                                    const config = currentAssociatedProcedures.find(ap => ap.procedureId === proc.id);
                                    return (
                                        <div key={proc.id} className="rounded-md border p-3">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`proc-assoc-${proc.id}`} className="font-medium">{proc.name}</Label>
                                                <Checkbox
                                                    id={`proc-assoc-${proc.id}`}
                                                    checked={isAssociated}
                                                    onCheckedChange={(checked) => handleProcedureAssociationChange(proc.id, !!checked)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{proc.description}</p>
                                            {isAssociated && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <Checkbox
                                                id={`proc-runnew-${proc.id}`}
                                                checked={config?.runOnNewMember || false}
                                                onCheckedChange={(checked) => handleRunOnNewMemberChange(proc.id, !!checked)}
                                                />
                                                <Label htmlFor={`proc-runnew-${proc.id}`} className="text-sm font-normal">
                                                Run automatically when a new computer is added to this group
                                                </Label>
                                            </div>
                                            )}
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
                     <CardDescription>Procedures linked to this group and their automation settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!group.associatedProcedures || group.associatedProcedures.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No procedures associated with this group yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {group.associatedProcedures.map(assocProc => {
                                const procedure = getProcedureById(assocProc.procedureId);
                                if (!procedure) return null;
                                return (
                                    <li key={assocProc.procedureId} className="text-sm p-3 border rounded-md">
                                        <div className="font-medium">{procedure.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {assocProc.runOnNewMember ? (
                                                <span className="flex items-center text-green-600"><ListChecks className="mr-1 h-3 w-3" /> Runs on new members</span>
                                            ) : (
                                                <span className="flex items-center text-gray-500"><XCircle className="mr-1 h-3 w-3" /> Does not run on new members</span>
                                            )}
                                        </div>
                                        {/* Future: Display scheduleConfig here */}
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
