
"use client";

import type { Computer, ScriptType, CustomCommand, ComputerGroup } from '@/types';
import { scriptTypes } from '@/lib/mockData'; // scriptTypes is static and can remain
import { fetchComputers, fetchGroups, sendCustomCommand, fetchCommandHistory } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, TerminalSquare, ListChecks, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type TargetType = "computer" | "group";
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default function CommandsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [targetType, setTargetType] = useState<TargetType>("computer");
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [commandScriptType, setCommandScriptType] = useState<ScriptType>('CMD');
  const [commandContent, setCommandContent] = useState('');
  
  const [commandHistory, setCommandHistory] = useState<CustomCommand[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [allComputers, setAllComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  
  const [allGroups, setAllGroups] = useState<ComputerGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const [isSendingCommand, setIsSendingCommand] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsLoadingHistory(true);
    setIsLoadingComputers(true);
    setIsLoadingGroups(true);
    setHistoryError(null);

    try {
      const [fetchedHistory, fetchedComputers, fetchedGroups] = await Promise.all([
        fetchCommandHistory(),
        fetchComputers(),
        fetchGroups()
      ]);
      
      // Filter history for last 30 days client-side if API doesn't do it
      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_IN_MS;
      const recentCommands = fetchedHistory.filter(cmd => {
          const cmdTime = new Date(cmd.executedAt || 0).getTime();
          return cmdTime >= thirtyDaysAgo;
      }).sort((a,b) => new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime());
      setCommandHistory(recentCommands);
      
      setAllComputers(fetchedComputers);
      setAllGroups(fetchedGroups);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data for commands page.";
      setHistoryError(errorMessage); // General error for now
      toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingComputers(false);
      setIsLoadingGroups(false);
    }
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

  const refreshCommandHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const fetchedHistory = await fetchCommandHistory();
      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_IN_MS;
      const recentCommands = fetchedHistory.filter(cmd => {
          const cmdTime = new Date(cmd.executedAt || new Date().toISOString()).getTime(); 
          return cmdTime >= thirtyDaysAgo;
      }).sort((a,b) => new Date(b.executedAt || 0).getTime() - new Date(a.executedAt || 0).getTime());
      setCommandHistory(recentCommands);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh command history.";
      setHistoryError(errorMessage);
      toast({ title: "Error Refreshing History", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast]);

  const handleSendCommand = async () => {
    let targetIdValue: string;
    let targetName: string | undefined;
    
    if (targetType === "computer") {
      if (!selectedComputerId) {
        toast({ title: "Error", description: "Please select a target computer.", variant: "destructive" });
        return;
      }
      targetIdValue = selectedComputerId;
      targetName = allComputers.find(c => c.id === selectedComputerId)?.name;
    } else { // targetType === "group"
      if (!selectedGroupId) {
        toast({ title: "Error", description: "Please select a target group.", variant: "destructive" });
        return;
      }
      targetIdValue = selectedGroupId;
      targetName = allGroups.find(g => g.id === selectedGroupId)?.name;
      const group = allGroups.find(g => g.id === selectedGroupId);
      if (group) {
        const onlineComputersInGroup = allComputers.filter(c => group.computerIds.includes(c.id) && c.status === 'Online');
        if (onlineComputersInGroup.length === 0) {
            toast({ title: "Info", description: `No online computers in group "${targetName}". Command not sent to group members.`, variant: "default" });
            // Depending on API, it might still log a "command sent to group" entry.
            // Or you might prevent sending entirely here. Let's assume API handles group expansion.
        }
      }
    }

    if (!commandContent.trim()) {
      toast({ title: "Error", description: "Command content cannot be empty.", variant: "destructive" });
      return;
    }
    
    setIsSendingCommand(true);
    try {
      await sendCustomCommand({
        targetId: targetIdValue,
        targetType: targetType,
        command: commandContent,
        scriptType: commandScriptType,
      });
      toast({ title: "Command Sent", description: `Custom command sent to ${targetType} "${targetName}". Check history for status.` });
      setCommandContent(''); 
      // Refresh history after a short delay to allow API to process
      setTimeout(() => {
        refreshCommandHistory();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send command.";
      toast({ title: "Error Sending Command", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSendingCommand(false);
    }
  };

  const getStatusBadgeVariant = (status?: CustomCommand['status']) => {
    switch (status) {
      case 'Success': return 'bg-green-500 hover:bg-green-600';
      case 'Failed': return 'bg-red-500 hover:bg-red-600';
      case 'Sent': return 'bg-blue-500 hover:bg-blue-600'; // Or any color for 'Sent' if different from 'Pending'
      case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600'; // Or any color for 'Pending'
      default: return 'secondary';
    }
  };
  
  const getTargetName = (command: CustomCommand): string => {
    if (command.targetType === 'group') {
      const group = allGroups.find(g => g.id === command.targetId);
      let name = group ? `Group: ${group.name}` : `Group ID: ${command.targetId}`;
      if (command.computerId) { // If API specifies which computer in the group it ran on
        const computer = allComputers.find(c => c.id === command.computerId);
        name += computer ? ` (on ${computer.name})` : ` (on Comp ID: ${command.computerId})`;
      }
      return name;
    } else { // computer
      const computer = allComputers.find(c => c.id === command.targetId);
      return computer ? computer.name : `Computer ID: ${command.targetId}`;
    }
  };


  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Custom Commands</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execute Custom Command</CardTitle>
          <CardDescription>Send a single command or script to a specific computer or an entire group. (Uses API)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Target Type</Label>
            <RadioGroup defaultValue="computer" value={targetType} onValueChange={(value: string) => setTargetType(value as TargetType)} className="flex space-x-4 mt-2">
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
            <div>
              <Label htmlFor="targetComputer">Target Computer</Label>
              <Select value={selectedComputerId} onValueChange={setSelectedComputerId} disabled={allComputers.filter(c => c.status === 'Online').length === 0}>
                <SelectTrigger id="targetComputer">
                  <SelectValue placeholder={allComputers.filter(c => c.status === 'Online').length === 0 ? "No online computers" : "Select an online computer"} />
                </SelectTrigger>
                <SelectContent>
                  {allComputers.filter(c => c.status === 'Online').map(computer => (
                    <SelectItem key={computer.id} value={computer.id}>
                      {computer.name} ({computer.ipAddress})
                    </SelectItem>
                  ))}
                  {allComputers.filter(c => c.status !== 'Online').length > 0 && allComputers.filter(c => c.status === 'Online').length > 0 && <React.Fragment><SelectItem value="disabled-sep" disabled>--- Offline ---</SelectItem></React.Fragment>}
                  {allComputers.filter(c => c.status !== 'Online').map(computer => (
                    <SelectItem key={computer.id} value={computer.id} disabled>
                      {computer.name} ({computer.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingGroups && targetType === "group" && <Skeleton className="h-10 w-full" />}
          {!isLoadingGroups && targetType === "group" && (
            <div>
              <Label htmlFor="targetGroup">Target Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={allGroups.length === 0}>
                <SelectTrigger id="targetGroup">
                  <SelectValue placeholder={allGroups.length === 0 ? "No groups available" : "Select a group"} />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.computerIds.length} computer(s))
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSendCommand} 
            disabled={isSendingCommand || isLoadingComputers || isLoadingGroups || (!selectedComputerId && targetType === 'computer') || (!selectedGroupId && targetType === 'group') || !commandContent.trim()}
          >
            {isSendingCommand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isSendingCommand ? 'Sending...' : 'Send Command'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Command History (Last 30 Days - from API)</CardTitle>
                <CardDescription>Recent custom commands executed.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshCommandHistory} disabled={isLoadingHistory}>
                {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin"/> : "Refresh"}
            </Button>
        </CardHeader>
        <CardContent>
           {isLoadingHistory ? (
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
           ) : historyError ? (
              <p className="text-destructive text-center py-4">{historyError}</p>
           ): commandHistory.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="mx-auto h-10 w-10 mb-2" />
                No commands found in the last 30 days.
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
                            <TableHead>Command</TableHead>
                            <TableHead>Output</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commandHistory.map(cmd => (
                            <TableRow key={cmd.id}>
                                <TableCell>
                                  {getTargetName(cmd)}
                                </TableCell>
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
