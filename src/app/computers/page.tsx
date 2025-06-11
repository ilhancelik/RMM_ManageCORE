
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
import { fetchComputers, fetchProcedures, fetchGroups, executeProcedure } from '@/lib/apiClient'; 
import type { Computer, ComputerGroup, Procedure, ProcedureExecution } from '@/types';
import { PlusCircle, ListFilter, Search, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_GROUPS_VALUE = "all-groups";

export default function ComputersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_GROUPS_VALUE);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [computerError, setComputerError] = useState<string | null>(null);
  
  const [groups, setGroups] = useState<ComputerGroup[]>([]); 
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);


  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [isRunProcedureModalOpen, setIsRunProcedureModalOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');
  const [isExecutingProcedure, setIsExecutingProcedure] = useState(false);


  const loadInitialData = useCallback(async () => {
    setIsLoadingComputers(true);
    setComputerError(null);
    setIsLoadingProcedures(true); 
    try {
      const [fetchedComputers, fetchedApiGroups, fetchedApiProcedures] = await Promise.all([
        fetchComputers(),
        fetchGroups(), 
        fetchProcedures() 
      ]);
      setComputers(fetchedComputers);
      setGroups(fetchedApiGroups);
      setAllProcedures(fetchedApiProcedures);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load initial data.';
      setComputerError(errorMessage); 
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive",
      });
      setComputers([]);
      setGroups([]);
      setAllProcedures([]);
    } finally {
      setIsLoadingComputers(false);
      setIsLoadingProcedures(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


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

  const handleRunProcedureOnSelected = async () => {
    if (!selectedProcedureId || selectedComputerIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select a procedure and at least one online computer.",
        variant: "destructive"
      });
      return;
    }

    const procedureToRun = allProcedures.find(p => p.id === selectedProcedureId);
    if (!procedureToRun) {
      toast({ title: "Error", description: "Selected procedure not found.", variant: "destructive" });
      return;
    }
    
    const onlineSelectedComputers = computers.filter(c => selectedComputerIds.includes(c.id) && c.status === 'Online');
    if(onlineSelectedComputers.length === 0){
        toast({ title: "Info", description: "No online computers selected for execution.", variant: "default"});
        return;
    }

    setIsExecutingProcedure(true);
    try {
      await executeProcedure(procedureToRun.id, onlineSelectedComputers.map(c => c.id));
      toast({
        title: "Procedures Execution Queued",
        description: `"${procedureToRun.name}" has been queued for execution on ${onlineSelectedComputers.length} selected computer(s). Check procedure or computer details for status.`
      });
      setIsRunProcedureModalOpen(false);
      setSelectedComputerIds([]);
      setSelectedProcedureId('');
      setProcedureSearchTerm(''); 
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to queue procedure execution.';
        toast({ title: "Error Executing Procedure", description: errorMessage, variant: "destructive"});
    } finally {
        setIsExecutingProcedure(false);
    }
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
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoadingComputers || groups.length === 0}>
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
              <Button variant="outline" disabled={isExecutingProcedure}>
                <Play className="mr-2 h-4 w-4" /> Run Procedure on Selected ({selectedComputerIds.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Procedure on Selected Computers</DialogTitle>
                <DialogDescription>
                  Select a procedure to run on the {selectedComputerIds.length} selected computer(s).
                  Offline computers will be skipped.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <Input 
                  type="search"
                  placeholder="Search procedures..."
                  value={procedureSearchTerm}
                  onChange={(e) => setProcedureSearchTerm(e.target.value)}
                  className="mb-2"
                  disabled={isLoadingProcedures}
                />
                <div>
                    <Label htmlFor="select-procedure">Procedure</Label>
                    <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId} disabled={isLoadingProcedures}>
                    <SelectTrigger id="select-procedure">
                        <SelectValue placeholder={isLoadingProcedures ? "Loading procedures..." : "Select a procedure to run"} />
                    </SelectTrigger>
                    <SelectContent>
                        {isLoadingProcedures ? (
                            <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                            </div>
                        ) : filteredProceduresForDialog.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground">No procedures found.</p>
                        ) : (
                            <ScrollArea className="h-[200px]">
                            {filteredProceduresForDialog.map(proc => (
                                <SelectItem key={proc.id} value={proc.id}>
                                {proc.name}
                                </SelectItem>
                            ))}
                            </ScrollArea>
                        )}
                    </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRunProcedureModalOpen(false); setProcedureSearchTerm(''); }} disabled={isExecutingProcedure}>Cancel</Button>
                <Button onClick={handleRunProcedureOnSelected} disabled={!selectedProcedureId || isLoadingProcedures || isExecutingProcedure}>
                  {isExecutingProcedure && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                  {isExecutingProcedure ? 'Queueing...' : 'Run Procedure'}
                </Button>
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
            {filteredComputers.length === 0 && searchTerm && !isLoadingComputers && ' No computers match your search.'}
             {!isLoadingComputers && computers.length > 0 && selectedGroupId !== ALL_GROUPS_VALUE && groups.length === 0 && ' (Group data not loaded or available from API)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingComputers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading computers...</p>
              </div>
            </div>
          ) : computerError ? (
             <div className="text-center py-8 text-destructive">
                <p>{computerError}</p>
                <Button onClick={loadInitialData} variant="outline" className="mt-4">Retry</Button>
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
         {!isLoadingComputers && !computerError && filteredComputers.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {filteredComputers.length} of {computers.length} computers.
            {computers.length > 0 && <span className="ml-2 text-xs text-blue-500">(Metrics are fetched from API)</span>}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
