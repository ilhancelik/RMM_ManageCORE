
"use client";

import { ComputerTable } from '@/components/computers/ComputerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { mockComputerGroups, mockProcedures, addProcedureExecution, getProcedureById } from '@/lib/mockData'; // Keep for groups, procedures for now
import { fetchComputers } from '@/lib/apiClient'; // Import fetchComputers
import type { Computer, ComputerGroup, Procedure, ProcedureExecution } from '@/types';
import { PlusCircle, ListFilter, Search, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_GROUPS_VALUE = "all-groups";

export default function ComputersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_GROUPS_VALUE);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const groups: ComputerGroup[] = mockComputerGroups; // Keep using mock for now
  const allProcedures: Procedure[] = mockProcedures; // Keep using mock for now

  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [isRunProcedureModalOpen, setIsRunProcedureModalOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');

  useEffect(() => {
    const loadComputers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedComputers = await fetchComputers();
        setComputers(fetchedComputers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load computers.');
        toast({
          title: "Error Loading Computers",
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: "destructive",
        });
        setComputers([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadComputers();
    // TODO: Add polling or WebSocket for real-time updates if needed
    // For now, we fetch once on mount.
  }, [toast]);


  const filteredComputers = useMemo(() => {
    let filtered = computers;

    if (selectedGroupId !== ALL_GROUPS_VALUE) {
      filtered = filtered.filter(computer =>
        computer.groupIds?.includes(selectedGroupId)
      );
    }

    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(computer =>
        computer.name.toLowerCase().includes(lowerSearchTerm) ||
        (computer.os && computer.os.toLowerCase().includes(lowerSearchTerm)) ||
        (computer.ipAddress && computer.ipAddress.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return filtered;
  }, [computers, selectedGroupId, searchTerm]);

  const handleComputerSelection = (computerId: string, checked: boolean) => {
    setSelectedComputerIds(prev => {
      if (checked) {
        return [...prev, computerId];
      } else {
        return prev.filter(id => id !== computerId);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const onlineComputerIds = filteredComputers
        .filter(computer => computer.status === 'Online')
        .map(computer => computer.id);
      setSelectedComputerIds(onlineComputerIds);
    } else {
      setSelectedComputerIds([]);
    }
  };

  const handleRunProcedureOnSelected = () => {
    // This will need to be updated to call an API endpoint
    // For now, it uses mockData logic
    if (!selectedProcedureId || selectedComputerIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a procedure and at least one online computer.",
        variant: "destructive"
      });
      return;
    }

    const procedureToRun = getProcedureById(selectedProcedureId);
    if (!procedureToRun) {
      toast({ title: "Error", description: "Selected procedure not found.", variant: "destructive" });
      return;
    }
    
    let executionsCreated = 0;
    selectedComputerIds.forEach(computerId => {
      const computer = computers.find(c => c.id === computerId);
      if (computer && computer.status === 'Online') {
        const newExecution: ProcedureExecution = {
          id: `exec-batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          procedureId: procedureToRun.id,
          computerId: computer.id,
          computerName: computer.name,
          status: 'Pending',
          logs: `Batch execution started for "${procedureToRun.name}" on "${computer.name}"...`,
          startTime: new Date().toISOString(),
        };
        addProcedureExecution(newExecution); 
        executionsCreated++;
        
        // Simulating execution - replace with API calls and status polling/websockets
        setTimeout(() => {
          const mockExec = mockProcedureExecutions.find(e => e.id === newExecution.id);
          if (mockExec) mockExec.status = 'Running';
        }, 1000);
        setTimeout(() => {
          const mockExec = mockProcedureExecutions.find(e => e.id === newExecution.id);
          if (mockExec) {
            const success = Math.random() > 0.2;
            mockExec.status = success ? 'Success' : 'Failed';
            mockExec.endTime = new Date().toISOString();
            mockExec.logs += success ? '\nExecution completed successfully.' : '\nExecution failed (simulated batch-run error).';
            mockExec.output = success ? "OK" : "Error";
          }
        }, 3000 + Math.random() * 1500);
      }
    });

    if (executionsCreated > 0) {
      toast({
        title: "Procedures Initiated (Simulated)",
        description: `"${procedureToRun.name}" is being executed on ${executionsCreated} selected computer(s). This is currently simulated.`
      });
    } else {
       toast({
        title: "No eligible computers",
        description: "No online computers were selected or found for procedure execution.",
        variant: "default"
      });
    }

    setIsRunProcedureModalOpen(false);
    setSelectedComputerIds([]);
    setSelectedProcedureId('');
    setProcedureSearchTerm(''); 
  };

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


  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Managed Computers</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search computers..."
              className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="groupFilter" className="text-sm font-medium sr-only sm:not-sr-only">Filter by Group:</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger id="groupFilter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GROUPS_VALUE}>All Groups</SelectItem>
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
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Computer</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {selectedComputerIds.length > 0 && (
        <div className="mb-4 flex justify-start">
          <Dialog open={isRunProcedureModalOpen} onOpenChange={(isOpen) => {
            setIsRunProcedureModalOpen(isOpen);
            if (!isOpen) setProcedureSearchTerm(''); 
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Play className="mr-2 h-4 w-4" /> Run Procedure on Selected ({selectedComputerIds.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Procedure on Selected Computers</DialogTitle>
                <DialogDescription>
                  Select a procedure to run on the {selectedComputerIds.length} selected computer(s).
                  Offline computers will be skipped. This is currently simulated.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <Input 
                  type="search"
                  placeholder="Search procedures..."
                  value={procedureSearchTerm}
                  onChange={(e) => setProcedureSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div>
                    <Label htmlFor="select-procedure">Procedure</Label>
                    <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId}>
                    <SelectTrigger id="select-procedure">
                        <SelectValue placeholder="Select a procedure to run" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[200px]">
                        {filteredProceduresForDialog.length === 0 && (
                            <p className="p-2 text-sm text-muted-foreground">No procedures found.</p>
                        )}
                        {filteredProceduresForDialog.map(proc => (
                            <SelectItem key={proc.id} value={proc.id}>
                            {proc.name}
                            </SelectItem>
                        ))}
                        </ScrollArea>
                    </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRunProcedureModalOpen(false); setProcedureSearchTerm(''); }}>Cancel</Button>
                <Button onClick={handleRunProcedureOnSelected} disabled={!selectedProcedureId}>Run Procedure</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGroupId !== ALL_GROUPS_VALUE ? `${groups.find(g => g.id === selectedGroupId)?.name || 'Selected Group'} Computers` : 'All Computers'}
            {searchTerm && ` (Filtered by "${searchTerm}")`}
          </CardTitle>
          <CardDescription>
            {selectedGroupId !== ALL_GROUPS_VALUE
              ? `Viewing computers in the "${groups.find(g => g.id === selectedGroupId)?.name || 'selected'}" group.`
              : 'View and manage all connected computers.'}
            {filteredComputers.length === 0 && searchTerm && !isLoading && ' No computers match your search.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading computers...</p>
              </div>
            </div>
          ) : error ? (
             <div className="text-center py-8 text-destructive">
                <p>{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Retry</Button>
             </div>
          ) : filteredComputers.length > 0 ? (
            <ComputerTable 
              computers={filteredComputers} 
              selectedComputerIds={selectedComputerIds}
              onComputerSelect={handleComputerSelection}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm && `No computers found matching "${searchTerm}".`}
              {!searchTerm && selectedGroupId !== ALL_GROUPS_VALUE && `No computers found in the selected group.`}
              {!searchTerm && selectedGroupId === ALL_GROUPS_VALUE && (computers.length === 0 ? `No computers found. Ensure your API at ${process.env.NEXT_PUBLIC_API_BASE_URL}/computers is running and returning data.` : `No computers found.`)}
            </p>
          )}
        </CardContent>
         {!isLoading && !error && filteredComputers.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {filteredComputers.length} of {computers.length} computers.
            {computers.length > 0 && <span className="ml-2 text-xs text-blue-500">(Metrics are fetched from API)</span>}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
