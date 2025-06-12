
"use client";

import type { Computer, ScriptType, CustomCommand, ComputerGroup, Procedure } from '@/types';
import { scriptTypes, getComputers, getGroups, addCustomCommand, getCommandHistory, getComputerById, getGroupById, getProcedures, executeMockProcedure } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ListChecks, Loader2, Play } from 'lucide-react';
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

type TargetType = "computer" | "group";
type ExecutionMode = "script" | "procedure";

export default function CommandsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [targetType, setTargetType] = useState<TargetType>("computer");
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("script");
  const [commandScriptType, setCommandScriptType] = useState<ScriptType>('CMD');
  const [commandContent, setCommandContent] = useState('');
  const [selectedProcedureIdForExecution, setSelectedProcedureIdForExecution] = useState<string>('');
  
  const [commandHistory, setCommandHistory] = useState<CustomCommand[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [allComputers, setAllComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [targetComputerSearchTerm, setTargetComputerSearchTerm] = useState('');
  
  const [allGroups, setAllGroups] = useState<ComputerGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [targetGroupSearchTerm, setTargetGroupSearchTerm] = useState('');

  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(true);
  const [procedureSelectSearchTerm, setProcedureSelectSearchTerm] = useState('');

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
    if (computerIdFromQuery && allComputers.some(c => c.id === computerIdFromQuery)) {
      setSelectedComputerId(computerIdFromQuery);
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

  const filteredComputersForSelect = useMemo(() => {
    const online = allComputers.filter(c => c.status === 'Online');
    const offline = allComputers.filter(c => c.status !== 'Online');
    
    const filterLogic = (computer: Computer) => 
        computer.name.toLowerCase().includes(targetComputerSearchTerm.toLowerCase()) ||
        computer.ipAddress.toLowerCase().includes(targetComputerSearchTerm.toLowerCase()) ||
        computer.os.toLowerCase().includes(targetComputerSearchTerm.toLowerCase());

    if (!targetComputerSearchTerm.trim()) {
      return { online, offline, hasSearchResults: true };
    }
    const filteredOnline = online.filter(filterLogic);
    const filteredOffline = offline.filter(filterLogic);
    return { online: filteredOnline, offline: filteredOffline, hasSearchResults: filteredOnline.length > 0 || filteredOffline.length > 0 };
  }, [allComputers, targetComputerSearchTerm]);

  const filteredGroupsForSelect = useMemo(() => {
    if (!targetGroupSearchTerm.trim()) {
      return allGroups;
    }
    return allGroups.filter(group =>
      group.name.toLowerCase().includes(targetGroupSearchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(targetGroupSearchTerm.toLowerCase())
    );
  }, [allGroups, targetGroupSearchTerm]);

  const filteredProceduresForSelect = useMemo(() => {
    if (!procedureSelectSearchTerm.trim()) {
      return allProcedures;
    }
    return allProcedures.filter(proc =>
      proc.name.toLowerCase().includes(procedureSelectSearchTerm.toLowerCase()) ||
      proc.description.toLowerCase().includes(procedureSelectSearchTerm.toLowerCase())
    );
  }, [allProcedures, procedureSelectSearchTerm]);

  const handleSendCommand = () => {
    let targetIdValue: string;
    let targetName: string | undefined;
    let isTargetValid = false;
    
    if (targetType === "computer") {
      if (!selectedComputerId) {
        toast({ title: "Error", description: "Please select a target computer.", variant: "destructive" });
        return;
      }
      targetIdValue = selectedComputerId;
      const computer = getComputerById(selectedComputerId);
      targetName = computer?.name;
      if (computer?.status !== 'Online') {
          toast({ title: "Error", description: `Computer "${targetName}" is offline. Cannot send command.`, variant: "destructive" });
          return;
      }
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
        if (onlineComputersInGroup.length === 0 && executionMode === "procedure") { 
            toast({ title: "Info", description: `No online computers in group "${targetName}" to run procedure.`, variant: "default" });
            return;
        }
         isTargetValid = true; 
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
        addCustomCommand({
          targetId: targetIdValue,
          targetType: targetType,
          command: commandContent,
          scriptType: commandScriptType,
        });
        toast({ title: "Command Sent (Mock)", description: `Custom command sent to ${targetType} "${targetName}". Check history for status.` });
        setCommandContent(''); 
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
            computerIdsForProcedure = [targetIdValue];
        } else { 
            const group = getGroupById(targetIdValue);
            computerIdsForProcedure = group ? getComputers().filter(c => group.computerIds.includes(c.id) && c.status === 'Online').map(c => c.id) : [];
        }

        if (computerIdsForProcedure.length === 0) {
            toast({ title: "Info", description: `No online computers to run procedure "${procedureToRun.name}" on.`, variant: "default"});
            setIsSendingCommand(false);
            return;
        }

        executeMockProcedure(selectedProcedureIdForExecution, computerIdsForProcedure);
        toast({ title: "Procedure Queued (Mock)", description: `Procedure "${procedureToRun.name}" queued for ${targetType} "${targetName}".` });
        setSelectedProcedureIdForExecution('');
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
                               (targetType === 'computer' && !selectedComputerId) || 
                               (targetType === 'group' && !selectedGroupId) || 
                               (executionMode === 'script' && !commandContent.trim()) || 
                               (executionMode === 'procedure' && !selectedProcedureIdForExecution);

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Custom Commands & Procedures</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execute Command or Procedure</CardTitle>
          <CardDescription>Send a custom script or run a pre-defined procedure on a specific computer or group (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Target Type</Label>
            <RadioGroup defaultValue="computer" value={targetType} onValueChange={(value: string) => { setTargetType(value as TargetType); setSelectedComputerId(''); setSelectedGroupId(''); }} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="computer" id="r-computer" />
                <Label htmlFor="r-computer">Single Computer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="r-group" />
                <Label htmlFor="r-group">Computer Group</Label>
              </div>
            </RadioGroup>
          </div>

          {isLoadingComputers && targetType === "computer" && <Skeleton className="h-10 w-full" />}
          {!isLoadingComputers && targetType === "computer" && (
            <div className="space-y-2">
              <Label htmlFor="targetComputer">Target Computer</Label>
              <Input 
                type="search" 
                placeholder="Search online computers..." 
                value={targetComputerSearchTerm} 
                onChange={(e) => setTargetComputerSearchTerm(e.target.value)}
                className="mb-1"
                disabled={isLoadingComputers}
              />
              <Select 
                key={`target-computer-select-${targetComputerSearchTerm}`}
                value={selectedComputerId} 
                onValueChange={setSelectedComputerId}
                disabled={isLoadingComputers || (filteredComputersForSelect.online.length === 0 && filteredComputersForSelect.offline.length === 0 && !!targetComputerSearchTerm)}
              >
                <SelectTrigger id="targetComputer">
                  <SelectValue placeholder={
                     isLoadingComputers ? "Loading computers..." : 
                     (allComputers.filter(c=>c.status === 'Online').length === 0 && !targetComputerSearchTerm) ? "No online computers available" : 
                     (!filteredComputersForSelect.hasSearchResults && !!targetComputerSearchTerm) ? "No computers match search" :
                     "Select an online computer..."
                  }/>
                </SelectTrigger>
                <SelectContent>
                  {filteredComputersForSelect.online.length > 0 && (
                    filteredComputersForSelect.online.map(computer => (
                      <SelectItem key={computer.id} value={computer.id}>
                        {computer.name} ({computer.ipAddress})
                      </SelectItem>
                    ))
                  )}
                  {filteredComputersForSelect.offline.length > 0 && (
                    <>
                      {filteredComputersForSelect.online.length > 0 && <SelectItem value="divider-offline" disabled className="font-bold text-muted-foreground my-1">--- Offline / Other ---</SelectItem>}
                      {filteredComputersForSelect.offline.map(computer => (
                        <SelectItem key={computer.id} value={computer.id} disabled>
                          {computer.name} ({computer.status})
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {!filteredComputersForSelect.hasSearchResults && !!targetComputerSearchTerm && (
                     <SelectItem value="no-results" disabled>No computers match search</SelectItem>
                  )}
                  {filteredComputersForSelect.online.length === 0 && filteredComputersForSelect.offline.length === 0 && !targetComputerSearchTerm && allComputers.length > 0 && (
                     <SelectItem value="no-online" disabled>No online computers available</SelectItem>
                  )}
                   {allComputers.length === 0 && !targetComputerSearchTerm && (
                     <SelectItem value="no-computers" disabled>No computers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingGroups && targetType === "group" && <Skeleton className="h-10 w-full" />}
          {!isLoadingGroups && targetType === "group" && (
            <div className="space-y-2">
              <Label htmlFor="targetGroup">Target Group</Label>
              <Input 
                type="search" 
                placeholder="Search groups..." 
                value={targetGroupSearchTerm} 
                onChange={(e) => setTargetGroupSearchTerm(e.target.value)}
                className="mb-1"
                disabled={isLoadingGroups}
              />
              <Select 
                key={`target-group-select-${targetGroupSearchTerm}`}
                value={selectedGroupId} 
                onValueChange={setSelectedGroupId}
                disabled={isLoadingGroups || (filteredGroupsForSelect.length === 0 && !!targetGroupSearchTerm) || (allGroups.length === 0 && !targetGroupSearchTerm)}
              >
                <SelectTrigger id="targetGroup">
                  <SelectValue placeholder={
                    isLoadingGroups ? "Loading groups..." :
                    (allGroups.length === 0 && !targetGroupSearchTerm) ? "No groups available" :
                    (filteredGroupsForSelect.length === 0 && !!targetGroupSearchTerm) ? "No groups match search" :
                    "Select a group..."
                  }/>
                </SelectTrigger>
                <SelectContent>
                  {filteredGroupsForSelect.length > 0 ? (
                    filteredGroupsForSelect.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.computerIds.length} computer(s))
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-results" disabled>
                      {allGroups.length === 0 && !targetGroupSearchTerm ? "No groups available" : "No groups match your search."}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                <>
                  <Input 
                    type="search" 
                    placeholder="Search procedures..." 
                    value={procedureSelectSearchTerm} 
                    onChange={(e) => setProcedureSelectSearchTerm(e.target.value)}
                    className="mb-1"
                    disabled={isLoadingProcedures}
                  />
                  <Select 
                    key={`select-procedure-${procedureSelectSearchTerm}`}
                    value={selectedProcedureIdForExecution} 
                    onValueChange={setSelectedProcedureIdForExecution}
                    disabled={isLoadingProcedures || (filteredProceduresForSelect.length === 0 && !!procedureSelectSearchTerm) || (allProcedures.length === 0 && !procedureSelectSearchTerm)}
                  >
                    <SelectTrigger id="selectProcedure">
                      <SelectValue placeholder={
                        isLoadingProcedures ? "Loading procedures..." :
                        (allProcedures.length === 0 && !procedureSelectSearchTerm) ? "No procedures available" :
                        (filteredProceduresForSelect.length === 0 && !!procedureSelectSearchTerm) ? "No procedures match search" :
                        "Select a procedure..."
                      }/>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProceduresForSelect.length > 0 ? (
                        filteredProceduresForSelect.map(proc => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.name} ({proc.scriptType})
                          </SelectItem>
                        ))
                      ) : (
                         <SelectItem value="no-results" disabled>
                           {allProcedures.length === 0 && !procedureSelectSearchTerm ? "No procedures available" : "No procedures match your search."}
                         </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
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

    