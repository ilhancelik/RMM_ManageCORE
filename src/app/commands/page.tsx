
"use client";

import type { Computer, ScriptType, CustomCommand, ComputerGroup } from '@/types';
import { mockComputers, mockComputerGroups, scriptTypes, addCustomCommand, updateCustomCommand, mockCustomCommands } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, TerminalSquare, ListChecks } from 'lucide-react';
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
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type TargetType = "computer" | "group";

export default function CommandsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [targetType, setTargetType] = useState<TargetType>("computer");
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [commandScriptType, setCommandScriptType] = useState<ScriptType>('CMD');
  const [commandContent, setCommandContent] = useState('');
  const [commandHistory, setCommandHistory] = useState<CustomCommand[]>(mockCustomCommands);

  useEffect(() => {
    setCommandHistory(mockCustomCommands); // Keep history in sync
  }, []);


  useEffect(() => {
    const computerIdFromQuery = searchParams.get('computerId');
    if (computerIdFromQuery && mockComputers.some(c => c.id === computerIdFromQuery)) {
      setSelectedComputerId(computerIdFromQuery);
      setTargetType("computer");
    }
  }, [searchParams]);

  const handleSendCommand = () => {
    let targetId: string;
    let targetName: string | undefined;
    let computersToCommand: Computer[] = [];

    if (targetType === "computer") {
      if (!selectedComputerId) {
        toast({ title: "Error", description: "Please select a target computer.", variant: "destructive" });
        return;
      }
      targetId = selectedComputerId;
      const computer = mockComputers.find(c => c.id === selectedComputerId);
      targetName = computer?.name;
      if (computer) computersToCommand.push(computer);
    } else { // targetType === "group"
      if (!selectedGroupId) {
        toast({ title: "Error", description: "Please select a target group.", variant: "destructive" });
        return;
      }
      targetId = selectedGroupId;
      const group = mockComputerGroups.find(g => g.id === selectedGroupId);
      targetName = group?.name;
      if (group) {
        computersToCommand = mockComputers.filter(c => group.computerIds.includes(c.id) && c.status === 'Online');
        if (computersToCommand.length === 0) {
          toast({ title: "Info", description: `No online computers in group "${targetName}". Command not sent.`, variant: "default" });
          return;
        }
      }
    }

    if (!commandContent.trim()) {
      toast({ title: "Error", description: "Command content cannot be empty.", variant: "destructive" });
      return;
    }

    const baseCommandInfo = {
      command: commandContent,
      scriptType: commandScriptType,
      executedAt: new Date().toISOString(),
      targetType: targetType,
    };
    
    if (targetType === 'group' && computersToCommand.length > 0) {
        toast({ title: "Command Batch Sending", description: `Sending command to ${computersToCommand.length} computer(s) in group "${targetName}".` });
        computersToCommand.forEach(computer => {
            const newCommand: CustomCommand = {
                ...baseCommandInfo,
                id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                computerId: computer.id, // For history display purposes
                targetId: computer.id, // Actual target for this specific command instance
                status: 'Pending',
            };
            addCustomCommand(newCommand);
            setCommandHistory(prev => [newCommand, ...prev]); // Update local state immediately

            setTimeout(() => {
                updateCustomCommand({ id: newCommand.id, status: 'Sent' });
                setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? {...cmd, status: 'Sent'} : cmd));
            }, 500);

            setTimeout(() => {
                const success = Math.random() > 0.2; // 80% success
                const finalStatus = success ? 'Success' : 'Failed';
                const output = success ? `Command executed successfully on ${computer.name}. Output: OK` : `Failed to execute on ${computer.name}. Error: Simulated execution failure.`;
                updateCustomCommand({id: newCommand.id, status: finalStatus, output });
                setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? { ...cmd, status: finalStatus, output } : cmd));
            }, 2000 + Math.random() * 1500);
        });

    } else if (targetType === 'computer' && computersToCommand.length === 1) {
        const computer = computersToCommand[0];
        const newCommand: CustomCommand = {
            ...baseCommandInfo,
            id: `cmd-${Date.now()}`,
            computerId: computer.id,
            targetId: computer.id,
            status: 'Pending',
        };
        addCustomCommand(newCommand);
        setCommandHistory(prev => [newCommand, ...prev]);

        setTimeout(() => {
            updateCustomCommand({ id: newCommand.id, status: 'Sent' });
            setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? {...cmd, status: 'Sent'} : cmd));
        }, 500);

        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success
            const finalStatus = success ? 'Success' : 'Failed';
            const outputMessage = success ? `Command executed successfully on ${computer.name}. Output: OK` : `Failed to execute on ${computer.name}. Error: Simulated execution failure.`;
            updateCustomCommand({id: newCommand.id, status: finalStatus, output: outputMessage });
            setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? { ...cmd, status: finalStatus, output: outputMessage } : cmd));
        }, 2000 + Math.random() * 1500);
        toast({ title: "Command Sent", description: `Custom command sent to ${computer.name}.` });
    }
    
    setCommandContent(''); // Optionally clear content after sending
  };

  const getStatusBadgeVariant = (status: CustomCommand['status']) => {
    switch (status) {
      case 'Success': return 'bg-green-500 hover:bg-green-600';
      case 'Failed': return 'bg-red-500 hover:bg-red-600';
      case 'Sent': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'secondary';
    }
  };
  
  const getTargetName = (cmd: CustomCommand): string => {
    if (cmd.targetType === 'group') {
        return mockComputerGroups.find(g => g.id === cmd.targetId)?.name || cmd.targetId;
    }
    return mockComputers.find(c => c.id === cmd.targetId)?.name || cmd.targetId;
  };


  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Custom Commands</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execute Custom Command</CardTitle>
          <CardDescription>Send a single command or script to a specific computer or an entire group.</CardDescription>
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

          {targetType === "computer" && (
            <div>
              <Label htmlFor="targetComputer">Target Computer</Label>
              <Select value={selectedComputerId} onValueChange={setSelectedComputerId}>
                <SelectTrigger id="targetComputer">
                  <SelectValue placeholder="Select a computer" />
                </SelectTrigger>
                <SelectContent>
                  {mockComputers.filter(c => c.status === 'Online').map(computer => (
                    <SelectItem key={computer.id} value={computer.id}>
                      {computer.name} ({computer.ipAddress})
                    </SelectItem>
                  ))}
                  {mockComputers.filter(c => c.status !== 'Online').map(computer => (
                    <SelectItem key={computer.id} value={computer.id} disabled>
                      {computer.name} ({computer.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "group" && (
            <div>
              <Label htmlFor="targetGroup">Target Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger id="targetGroup">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {mockComputerGroups.map(group => (
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
            disabled={(!selectedComputerId && targetType === 'computer') || (!selectedGroupId && targetType === 'group') || !commandContent.trim()}
          >
            <Send className="mr-2 h-4 w-4" /> Send Command
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Command History</CardTitle>
          <CardDescription>Recent custom commands executed.</CardDescription>
        </CardHeader>
        <CardContent>
           {commandHistory.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="mx-auto h-10 w-10 mb-2" />
                No commands sent yet.
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
                                  {cmd.targetType === 'group' ? `Group: ${mockComputerGroups.find(g => g.id === cmd.targetId)?.name || 'N/A'}` : mockComputers.find(c => c.id === cmd.targetId)?.name || 'N/A'}
                                  {cmd.targetType === 'group' && ` (on ${mockComputers.find(c=>c.id === cmd.computerId)?.name})`}
                                </TableCell>
                                <TableCell>{cmd.scriptType}</TableCell>
                                <TableCell>
                                    <Badge variant="default" className={getStatusBadgeVariant(cmd.status)}>{cmd.status}</Badge>
                                </TableCell>
                                <TableCell>{cmd.executedAt ? new Date(cmd.executedAt).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell><pre className="text-xs truncate max-w-xs">{cmd.command}</pre></TableCell>
                                <TableCell><pre className="text-xs truncate max-w-xs">{cmd.output || 'N/A'}</pre></TableCell>
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
