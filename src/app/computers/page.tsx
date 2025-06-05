
"use client";

import { ComputerTable } from '@/components/computers/ComputerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockComputers, mockComputerGroups } from '@/lib/mockData';
import type { Computer, ComputerGroup } from '@/types';
import { PlusCircle, ListFilter } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

export default function ComputersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // Empty string for 'All Groups'

  const computers: Computer[] = mockComputers;
  const groups: ComputerGroup[] = mockComputerGroups;

  const filteredComputers = useMemo(() => {
    if (!selectedGroupId) {
      return computers; // Show all if no group is selected
    }
    return computers.filter(computer => 
      computer.groupIds?.includes(selectedGroupId)
    );
  }, [computers, selectedGroupId]);

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Managed Computers</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="groupFilter" className="text-sm font-medium">Filter by Group:</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="groupFilter" className="w-[200px]">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Groups</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild>
            <Link href="/computers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Computer
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGroupId ? `${groups.find(g => g.id === selectedGroupId)?.name || 'Selected Group'} Computers` : 'All Computers'}
          </CardTitle>
          <CardDescription>
            {selectedGroupId 
              ? `Viewing computers in the "${groups.find(g => g.id === selectedGroupId)?.name || 'selected'}" group.`
              : 'View and manage all connected computers.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComputers.length > 0 ? (
            <ComputerTable computers={filteredComputers} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {selectedGroupId ? `No computers found in the selected group.` : `No computers found.`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
