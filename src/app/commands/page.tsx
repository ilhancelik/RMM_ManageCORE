
"use client";

import type { Computer, ScriptType, CustomCommand, ComputerGroup, Procedure } from '@/types';
import { scriptTypes, getComputers, getGroups, addCustomCommand, getCommandHistory, getComputerById, getGroupById, getProcedures, executeMockProcedure } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ListChecks, Loader2, Play, ChevronsUpDown, Check, X, UserCircle, Shield } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from '@/lib/utils';


type TargetType = "computer" | "group";
type ExecutionMode = "script" | "procedure";

export default function CommandsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [targetType, setTargetType] = useState<TargetType>("computer");
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const [executionMode, setExecutionMode] = useState<ExecutionMode>("script");
  const [commandScriptType, setCommandScriptType] = useState<ScriptType>('CMD');
  const [commandContent, setCommandContent] = useState('');
  const [runAsUser, setRunAsUser] = useState(false);
  const [selectedProcedureIdForExecution, setSelectedProcedureIdForExecution] = useState<string>('');

  const [commandHistory, setCommandHistory] = useState<CustomCommand[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [allComputers, setAllComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [targetComputerSearchTerm, setTargetComputerSearchTerm] = useState('');
  const [openComputerMultiSelectPopover, setOpenComputerMultiSelectPopover] = useState(false);


  const [allGroups, setAllGroups] = useState<ComputerGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [targetGroupSearchTerm, setTargetGroupSearchTerm] = useState('');
  const [openGroupSelectPopover, setOpenGroupSelectPopover] = useState(false);

  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(true);
  const [procedureSelectSearchTerm, setProcedureSelectSearchTerm] = useState('');
  const [openProcedureSelectPopover, setOpenProcedureSelectPopover] = useState(false);

  const [isSendingCommand, setIsSendingCommand] = useState(false);

  const loadInitialData = useCallback(() => {
    setIsLoadingHistory(true);
    setIsLoadingComputers(true);
    setIsLoadingGroups(true);
    setIsLoadingProcedures(true);
    setHistoryError(null);

    setTimeout(() => {
        try {
            const fetchedHistory = getCommandHistory();
            const fetchedComputers = getComputers();
            const fetchedGroups = getGroups();
            const fetchedProcedures = getProcedures();

            setCommandHistory(fetchedHistory);
            setAllComputers(fetchedComputers);
            setAllGroups(fetchedGroups);
            setAllProcedures(fetchedProcedures);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load data for commands page (Mock).";
            setHistoryError(errorMessage);
            toast({ title: "Error Loading Data (Mock)", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
            setIsLoadingComputers(false);
            setIsLoadingGroups(false);
            setIsLoadingProcedures(false);
        }
    }, 500);
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const computerIdFromQuery = searchParams.get('computerId');
    if (computerIdFromQuery && allComputers.some(c => c.id === computerIdFromQuery && c.status === 'Online')) {
      setSelectedComputerIds([computerIdFromQuery]);
      setTargetType("computer");
    }
  }, [searchParams, allComputers]);

  const refreshCommandHistory = useCallback(() => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    setTimeout(() => {
        try {
            const fetchedHistory = getCommandHistory();
            setCommandHistory(fetchedHistory);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to refresh command history (Mock).";
            setHistoryError(errorMessage);
            toast({ title: "Error Refreshing History (Mock)", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
        }
    }, 300);
  }, [toast]);

  const onlineComputersList = useMemo(() => {
    return allComputers.filter(computer => computer.status === 'Online');
  }, [allComputers]);


  const handleSendCommand = () => {
    let targetIdValue: string | string[];
    let targetName: string | undefined;
    let isTargetValid = false;
    let numTargets = 0;

    if (targetType === "computer") {
      if (selectedComputerIds.length === 0) {
        toast({ title: "Error", description: "Please select at least one target computer.", variant: "destructive" });
        return;
      }
      targetIdValue = selectedComputerIds;
      numTargets = selectedComputerIds.length;
      targetName = `${numTargets} computer(s)`;
      isTargetValid = true;
    } else { 
      if (!selectedGroupId) {
        toast({ title: "Error", description: "Please select a target group.", variant: "destructive" });
        return;
      }
      targetIdValue = selectedGroupId;
      const group = getGroupById(selectedGroupId);
      targetName = group?.name;
      if (group) {
        const onlineComputersInGroup = getComputers().filter(c => group.computerIds.includes(c.id) && c.status === 'Online');
        if (onlineComputersInGroup.length === 0 && executionMode === "script") { 
            toast({ title: "Info", description: `No online computers in group "${targetName}" to run custom script.`, variant: "default" });
            return;
        }
         isTargetValid = true;
         numTargets = onlineComputersInGroup.length;
      }
    }

    if (!isTargetValid) {
        toast({ title: "Error", description: "Invalid target selected.", variant: "destructive"});
        return;
    }

    setIsSendingCommand(true);
    if (executionMode === "script") {
      if (!commandContent.trim()) {
        toast({ title: "Error", description: "Command content cannot be empty for custom scripts.", variant: "destructive" });
        setIsSendingCommand(false);
        return;
      }
      try {
        if (targetType === 'computer') {
            let commandsSentCount = 0;
            (targetIdValue as string[]).forEach(computerId => {
                const computer = getComputerById(computerId);
                if (computer && computer.status === 'Online') {
                    addCustomCommand({
                        targetId: computerId,
                        targetType: 'computer',
                        command: commandContent,
                        scriptType: commandScriptType,
                        runAsUser: runAsUser,
                    });
                    commandsSentCount++;
                } else if (computer) {
                    toast({ title: "Skipped Offline", description: `Command not sent to offline computer "${computer.name}".`, variant: "default"});
                }
            });
            if (commandsSentCount > 0) {
                toast({ title: "Commands Sent (Mock)", description: `Custom command sent to ${commandsSentCount} online computer(s). Check history for status.` });
                setCommandContent('');
                setSelectedComputerIds([]);
            } else {
                 toast({ title: "No Commands Sent", description: "No online computers were selected or available to send the command.", variant: "default" });
            }
        } else { 
            addCustomCommand({
              targetId: targetIdValue as string,
              targetType: targetType,
              command: commandContent,
              scriptType: commandScriptType,
              runAsUser: runAsUser,
            });
            toast({ title: "Command Sent (Mock)", description: `Custom command sent to group "${targetName}". Will execute on ${numTargets > 0 ? numTargets : 'available online'} member(s). Check history.` });
            setCommandContent('');
            setSelectedGroupId(''); 
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send command (Mock).";
        toast({ title: "Error Sending Command", description: errorMessage, variant: "destructive" });
      }
    } else { 
      if (!selectedProcedureIdForExecution) {
        toast({ title: "Error", description: "Please select a procedure to execute.", variant: "destructive" });
        setIsSendingCommand(false);
        return;
      }
      try {
        const procedureToRun = allProcedures.find(p => p.id === selectedProcedureIdForExecution);
        if (!procedureToRun) {
            toast({title: "Error", description: "Selected procedure not found.", variant: "destructive"});
            setIsSendingCommand(false);
            return;
        }

        let computerIdsForProcedure: string[] = [];
        if (targetType === 'computer') {
            computerIdsForProcedure = (targetIdValue as string[]).filter(compId => {
                const comp = getComputerById(compId);
                const isOnline = comp && comp.status === 'Online';
                if (!isOnline && comp) toast({title: "Skipped Offline", description: `Procedure will not run on offline computer "${comp.name}".`});
                return isOnline;
            });
        } else { 
            const group = getGroupById(targetIdValue as string);
            computerIdsForProcedure = group ? getComputers().filter(c => group.computerIds.includes(c.id) && c.status === 'Online').map(c => c.id) : [];
        }

        if (computerIdsForProcedure.length === 0) {
            toast({ title: "Info", description: `No online computers to run procedure "${procedureToRun.name}" on.`, variant: "default"});
            setIsSendingCommand(false);
            return;
        }

        executeMockProcedure(selectedProcedureIdForExecution, computerIdsForProcedure);
        toast({ title: "Procedure Queued (Mock)", description: `Procedure "${procedureToRun.name}" queued for ${computerIdsForProcedure.length} computer(s).` });
        setSelectedProcedureIdForExecution('');
        if (targetType === 'computer') setSelectedComputerIds([]);
        else setSelectedGroupId(''); 
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to execute procedure (Mock).";
        toast({ title: "Error Executing Procedure", description: errorMessage, variant: "destructive" });
      }
    }

    setTimeout(() => {
      refreshCommandHistory();
      setIsSendingCommand(false);
    }, 1500);
  };

  const getStatusBadgeVariant = (status?: CustomCommand['status']) => {
    switch (status) {
      case 'Success': return 'bg-green-500 hover:bg-green-600';
      case 'Failed': return 'bg-red-500 hover:bg-red-600';
      case 'Sent': return 'bg-blue-500 hover:bg-blue-600';
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'secondary';
    }
  };

  const getTargetName = (command: CustomCommand): string => {
    if (command.targetType === 'group') {
      const group = allGroups.find(g => g.id === command.targetId);
      let name = group ? `Group: ${group.name}` : `Group ID: ${command.targetId}`;
      if (command.computerId && command.computerId !== command.targetId) {
        const computer = allComputers.find(c => c.id === command.computerId);
        name += computer ? ` (on ${computer.name})` : ` (on Comp ID: ${command.computerId})`;
      }
      return name;
    } else {
      const computer = allComputers.find(c => c.id === command.targetId);
      return computer ? computer.name : `Computer ID: ${command.targetId}`;
    }
  };

  const isSendButtonDisabled = isSendingCommand ||
                               isLoadingComputers ||
                               isLoadingGroups ||
                               isLoadingProcedures ||
                               (targetType === 'computer' && selectedComputerIds.length === 0) ||
                               (targetType === 'group' && !selectedGroupId) ||
                               (executionMode === 'script' && !commandContent.trim()) ||
                               (executionMode === 'procedure' && !selectedProcedureIdForExecution);

  const handleComputerSelectionToggle = (computerId: string) => {
    setSelectedComputerIds((prevSelected) =>
      prevSelected.includes(computerId)
        ? prevSelected.filter((id) => id !== computerId)
        : [...prevSelected, computerId]
    );
  };


  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Custom Commands & Procedures</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execute Command or Procedure</CardTitle>
          <CardDescription>Send a custom script or run a pre-defined procedure on specific computers or groups (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Target Type</Label>
            <RadioGroup defaultValue="computer" value={targetType} onValueChange={(value: string) => { setTargetType(value as TargetType); setSelectedComputerIds([]); setSelectedGroupId(''); }} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="computer" id="r-computer" />
                <Label htmlFor="r-computer">Computer(s)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="r-group" />
                <Label htmlFor="r-group">Computer Group</Label>
              </div>
            </RadioGroup>
          </div>

          {targetType === "computer" && (
            <div className="space-y-2">
              <Label htmlFor="targetComputerMultiSelect">Target Computer(s)</Label>
              <Popover open={openComputerMultiSelectPopover} onOpenChange={setOpenComputerMultiSelectPopover}>
                <PopoverTrigger asChild>
                  <Button
                    id="targetComputerMultiSelect"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComputerMultiSelectPopover}
                    className="w-full justify-between"
                    disabled={isLoadingComputers}
                  >
                    <span className="truncate">
                      {selectedComputerIds.length === 0
                        ? "Select online computer(s)..."
                        : `${selectedComputerIds.length} computer(s) selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command
                    filter={(value, search) => {
                      const computer = allComputers.find(c => c.id === value);
                      if (!computer || computer.status !== 'Online') return 0;
                      if (search.trim() === '') return 1;
                      const searchTermLower = search.toLowerCase();
                      if (computer.name.toLowerCase().includes(searchTermLower)) return 1;
                      if (computer.ipAddress.toLowerCase().includes(searchTermLower)) return 1;
                      if (computer.os.toLowerCase().includes(searchTermLower)) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search online computers..."
                      value={targetComputerSearchTerm}
                      onValueChange={setTargetComputerSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingComputers ? "Loading..." : 
                         onlineComputersList.length === 0 ? "No online computers available." : "No computers match your search."}
                      </CommandEmpty>
                      <CommandGroup>
                        {onlineComputersList.map((computer) => (
                          <CommandItem
                            key={computer.id}
                            value={computer.id}
                            onSelect={() => {
                              handleComputerSelectionToggle(computer.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedComputerIds.includes(computer.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {computer.name} ({computer.ipAddress})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedComputerIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedComputerIds.map(id => {
                    const computer = allComputers.find(c => c.id === id);
                    return computer ? (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {computer.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => handleComputerSelectionToggle(id)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {computer.name}</span>
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}


          {isLoadingGroups && targetType === "group" && <Skeleton className="h-10 w-full" />}
          {!isLoadingGroups && targetType === "group" && (
            <div className="space-y-2">
              <Label htmlFor="targetGroup">Target Group</Label>
              <Popover open={openGroupSelectPopover} onOpenChange={setOpenGroupSelectPopover}>
                <PopoverTrigger asChild>
                  <Button
                    id="targetGroupTrigger"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openGroupSelectPopover}
                    className="w-full justify-between"
                    disabled={isLoadingGroups || allGroups.length === 0}
                  >
                    <span className="truncate">
                      {selectedGroupId
                        ? allGroups.find(group => group.id === selectedGroupId)?.name
                        : "Select a group..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command
                     filter={(value, search) => {
                      const group = allGroups.find(g => g.id === value);
                      if (!group) return 0;
                      if (search.trim() === '') return 1;
                      const searchTermLower = search.toLowerCase();
                      if (group.name.toLowerCase().includes(searchTermLower)) return 1;
                      if (group.description.toLowerCase().includes(searchTermLower)) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search groups..."
                      value={targetGroupSearchTerm}
                      onValueChange={setTargetGroupSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingGroups ? "Loading..." : 
                         allGroups.length === 0 ? "No groups available." : "No groups match search."}
                      </CommandEmpty>
                      <CommandGroup>
                        {allGroups.map((group) => (
                          <CommandItem
                            key={group.id}
                            value={group.id}
                            onSelect={() => {
                              setSelectedGroupId(group.id);
                              setOpenGroupSelectPopover(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {group.name} ({group.computerIds.length} computer(s))
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div>
            <Label>Execution Mode</Label>
            <RadioGroup value={executionMode} onValueChange={(value) => setExecutionMode(value as ExecutionMode)} className="flex space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="script" id="mode-script" />
                    <Label htmlFor="mode-script">Custom Script</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="procedure" id="mode-procedure" />
                    <Label htmlFor="mode-procedure">Pre-defined Procedure</Label>
                </div>
            </RadioGroup>
          </div>

          {executionMode === "script" && (
            <>
              <div>
                <Label htmlFor="commandScriptType">Script Type</Label>
                <Select value={commandScriptType} onValueChange={(value: ScriptType) => setCommandScriptType(value)}>
                  <SelectTrigger id="commandScriptType">
                    <SelectValue placeholder="Select script type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scriptTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                    id="runAsUser"
                    checked={runAsUser}
                    onCheckedChange={(checked) => setRunAsUser(checked === true)}
                />
                <Label htmlFor="runAsUser" className="font-normal">Run As User (otherwise runs as SYSTEM)</Label>
              </div>
              <div>
                <Label htmlFor="commandContent">Command / Script</Label>
                <Textarea
                  id="commandContent"
                  value={commandContent}
                  onChange={(e) => setCommandContent(e.target.value)}
                  placeholder={`Enter ${commandScriptType} command or script here...`}
                  rows={8}
                  className="font-code"
                />
              </div>
            </>
          )}

          {executionMode === "procedure" && (
            <div className="space-y-2">
              <Label htmlFor="selectProcedure">Select Procedure</Label>
               {isLoadingProcedures && <Skeleton className="h-10 w-full" />}
               {!isLoadingProcedures && (
                 <Popover open={openProcedureSelectPopover} onOpenChange={setOpenProcedureSelectPopover}>
                    <PopoverTrigger asChild>
                    <Button
                        id="selectProcedureTrigger"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openProcedureSelectPopover}
                        className="w-full justify-between"
                        disabled={isLoadingProcedures || allProcedures.length === 0}
                    >
                        <span className="truncate">
                        {selectedProcedureIdForExecution
                            ? allProcedures.find(proc => proc.id === selectedProcedureIdForExecution)?.name
                            : "Select a procedure..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command
                       filter={(value, search) => {
                        const proc = allProcedures.find(p => p.id === value);
                        if (!proc) return 0;
                        if (search.trim() === '') return 1;
                        const searchTermLower = search.toLowerCase();
                        if (proc.name.toLowerCase().includes(searchTermLower)) return 1;
                        if (proc.description.toLowerCase().includes(searchTermLower)) return 1;
                        return 0;
                      }}
                    >
                        <CommandInput
                        placeholder="Search procedures..."
                        value={procedureSelectSearchTerm}
                        onValueChange={setProcedureSelectSearchTerm}
                        />
                        <CommandList>
                        <CommandEmpty>
                          {isLoadingProcedures ? "Loading..." : 
                           allProcedures.length === 0 ? "No procedures available." : "No procedures match search."}
                        </CommandEmpty>
                        <CommandGroup>
                            {allProcedures.map((proc) => (
                            <CommandItem
                                key={proc.id}
                                value={proc.id}
                                onSelect={() => {
                                setSelectedProcedureIdForExecution(proc.id);
                                setOpenProcedureSelectPopover(false);
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProcedureIdForExecution === proc.id ? "opacity-100" : "opacity-0"
                                )}
                                />
                                {proc.name} ({proc.scriptType})
                            </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                    </Command>
                    </PopoverContent>
                </Popover>
               )}
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSendCommand}
            disabled={isSendButtonDisabled}
          >
            {isSendingCommand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (executionMode === 'script' ? <Send className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />)}
            {isSendingCommand ? 'Sending...' : (executionMode === 'script' ? 'Send Command' : 'Run Procedure')}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Command & Procedure History (Mock Data)</CardTitle>
                <CardDescription>Recent custom commands and procedure executions initiated from this page.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshCommandHistory} disabled={isLoadingHistory}>
                {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin"/> : "Refresh"}
            </Button>
        </CardHeader>
        <CardContent>
           {isLoadingHistory ? (
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
             </div>
           ) : historyError ? (
              <p className="text-destructive text-center py-4">{historyError}</p>
           ): commandHistory.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="mx-auto h-10 w-10 mb-2" />
                No commands or procedure executions found in mock data.
            </div>
           ) : (
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Context</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Executed At</TableHead>
                            <TableHead>Command/Procedure</TableHead>
                            <TableHead>Output/Log Snippet</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commandHistory.map(cmd => (
                            <TableRow key={cmd.id}>
                                <TableCell>{getTargetName(cmd)}</TableCell>
                                <TableCell>{cmd.scriptType}</TableCell>
                                <TableCell>{cmd.runAsUser ? <div className="flex items-center gap-1"><UserCircle className="h-4 w-4 text-blue-500" />User</div> : <div className="flex items-center gap-1"><Shield className="h-4 w-4 text-gray-500"/>System</div>}</TableCell>
                                <TableCell>
                                    <Badge variant="default" className={getStatusBadgeVariant(cmd.status)}>{cmd.status || 'Unknown'}</Badge>
                                </TableCell>
                                <TableCell>{cmd.executedAt ? new Date(cmd.executedAt).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell><pre className="text-xs whitespace-pre-wrap break-all max-w-xs">{cmd.command}</pre></TableCell>
                                <TableCell><pre className="text-xs whitespace-pre-wrap break-all max-w-xs">{cmd.output || 'N/A'}</pre></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
