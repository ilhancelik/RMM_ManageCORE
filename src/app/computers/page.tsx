
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
import { getComputers, getProcedures, getGroups, executeMockProcedure } from '@/lib/mockData'; 
import type { Computer, ComputerGroup, Procedure } from '@/types';
import { PlusCircle, ListFilter, Search, Play, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [isLoadingProceduresOrGroups, setIsLoadingProceduresOrGroups] = useState(true); 

  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [isRunProcedureModalOpen, setIsRunProcedureModalOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [procedureSearchTerm, setProcedureSearchTerm] = useState(''); // For dialog procedure search
  const [isExecutingProcedure, setIsExecutingProcedure] = useState(false);

  // Popover states for Comboboxes
  const [openGroupFilterPopover, setOpenGroupFilterPopover] = useState(false);
  const [openProcedureDialogPopover, setOpenProcedureDialogPopover] = useState(false);


  const loadInitialData = useCallback(() => {
    setIsLoadingComputers(true);
    setComputerError(null);
    setIsLoadingProceduresOrGroups(true); 
    setTimeout(() => {
      try {
        setComputers(getComputers());
        setGroups(getGroups());
        setAllProcedures(getProcedures());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load initial data from mocks.';
        setComputerError(errorMessage); 
        toast({
          title: "Error Loading Data (Mock)",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingComputers(false);
        setIsLoadingProceduresOrGroups(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  const filteredComputers = useMemo(() => {
    let filtered = computers;

    if (selectedGroupId !== ALL_GROUPS_VALUE) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        filtered = filtered.filter(computer =>
          computer.groupIds?.includes(selectedGroupId)
        );
      }
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
  }, [computers, selectedGroupId, searchTerm, groups]);

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
      executeMockProcedure(procedureToRun.id, onlineSelectedComputers.map(c => c.id));
      toast({
        title: "Procedures Execution Queued (Mock)",
        description: `"${procedureToRun.name}" has been queued for execution on ${onlineSelectedComputers.length} selected computer(s). Check procedure or computer details for status.`
      });
      setIsRunProcedureModalOpen(false);
      setSelectedComputerIds([]);
      setSelectedProcedureId('');
      setProcedureSearchTerm(''); 
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to queue procedure execution (Mock).';
        toast({ title: "Error Executing Procedure", description: errorMessage, variant: "destructive"});
    } finally {
        setTimeout(() => setIsExecutingProcedure(false), 1000);
    }
  };


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
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-1">
                <ListFilter className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="groupFilterPopover" className="text-sm font-medium sr-only sm:not-sr-only">Filter by Group:</Label>
            </div>
            <div className="w-full sm:w-[180px] space-y-1">
                <Popover open={openGroupFilterPopover} onOpenChange={setOpenGroupFilterPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      id="groupFilterPopover"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openGroupFilterPopover}
                      className="w-full justify-between h-10"
                      disabled={isLoadingProceduresOrGroups || groups.length === 0}
                    >
                      {selectedGroupId === ALL_GROUPS_VALUE
                        ? (groups.length === 0 ? "No groups available" : "All Groups")
                        : groups.find(group => group.id === selectedGroupId)?.name || "Select a group..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search groups..." />
                      <CommandList>
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            key={ALL_GROUPS_VALUE}
                            value="All Groups"
                            onSelect={() => {
                              setSelectedGroupId(ALL_GROUPS_VALUE);
                              setOpenGroupFilterPopover(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroupId === ALL_GROUPS_VALUE ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Groups
                          </CommandItem>
                          {groups.map(group => (
                            <CommandItem
                              key={group.id}
                              value={group.name}
                              onSelect={() => {
                                setSelectedGroupId(group.id);
                                setOpenGroupFilterPopover(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {group.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>
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
                <div>
                    <Label htmlFor="select-procedure-dialog">Procedure</Label>
                    <Popover open={openProcedureDialogPopover} onOpenChange={setOpenProcedureDialogPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          id="select-procedure-dialog"
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProcedureDialogPopover}
                          className="w-full justify-between"
                          disabled={isLoadingProceduresOrGroups || allProcedures.length === 0}
                        >
                          {selectedProcedureId
                            ? allProcedures.find(proc => proc.id === selectedProcedureId)?.name
                            : allProcedures.length === 0 ? "No procedures available" : "Select a procedure..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search procedures..." 
                            value={procedureSearchTerm} // Controlled input for dialog search
                            onValueChange={setProcedureSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>No procedure found.</CommandEmpty>
                            <CommandGroup>
                              {allProcedures
                                .filter(proc => proc.name.toLowerCase().includes(procedureSearchTerm.toLowerCase()) || proc.description.toLowerCase().includes(procedureSearchTerm.toLowerCase()))
                                .map(proc => (
                                <CommandItem
                                  key={proc.id}
                                  value={proc.name}
                                  onSelect={() => {
                                    setSelectedProcedureId(proc.id);
                                    setOpenProcedureDialogPopover(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProcedureId === proc.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {proc.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsRunProcedureModalOpen(false); setProcedureSearchTerm(''); }} disabled={isExecutingProcedure}>Cancel</Button>
                <Button onClick={handleRunProcedureOnSelected} disabled={!selectedProcedureId || isLoadingProceduresOrGroups || isExecutingProcedure}>
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
              : 'View and manage all connected computers (Mock Data).'}
            {filteredComputers.length === 0 && searchTerm && !isLoadingComputers && ' No computers match your search.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingComputers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading computers...</p>
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
              {!searchTerm && selectedGroupId === ALL_GROUPS_VALUE && (computers.length === 0 ? `No computers found in mock data.` : `No computers found.`)}
            </p>
          )}
        </CardContent>
         {!isLoadingComputers && !computerError && filteredComputers.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {filteredComputers.length} of {computers.length} computers.
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

    