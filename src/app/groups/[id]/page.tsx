
"use client";

import { useParams, useRouter } from 'next/navigation';
import { mockComputerGroups, mockComputers } from '@/lib/mockData';
import type { ComputerGroup, Computer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Edit, Trash2, PlusCircle } from 'lucide-react';
import { ComputerTable } from '@/components/computers/ComputerTable';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [group, setGroup] = useState<ComputerGroup | null>(null);
  const [memberComputers, setMemberComputers] = useState<Computer[]>([]);

  useEffect(() => {
    const foundGroup = mockComputerGroups.find(g => g.id === id) || null;
    setGroup(foundGroup);
    if (foundGroup) {
      const computersInGroup = mockComputers.filter(c => foundGroup.computerIds.includes(c.id));
      setMemberComputers(computersInGroup);
    }
  }, [id]);


  if (!group) {
    return <div className="container mx-auto py-10 text-center">Group not found.</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-bold">{group.name}</CardTitle>
              </div>
              <CardDescription>{group.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {/* TODO: Edit functionality */}}>
                <Edit className="mr-2 h-4 w-4" /> Edit Group
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {/* TODO: Delete functionality */}}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Group
              </Button>
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
                {/* <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add/Remove Computers
                </Button> */}
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
  );
}
