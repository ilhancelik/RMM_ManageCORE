
"use client";

import type { Computer, ScriptType, CustomCommand } from '@/types';
import { mockComputers, scriptTypes } from '@/lib/mockData';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CommandsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [commandScriptType, setCommandScriptType] = useState<ScriptType>('CMD');
  const [commandContent, setCommandContent] = useState('');
  const [commandHistory, setCommandHistory] = useState<CustomCommand[]>([]);

  useEffect(() => {
    const computerIdFromQuery = searchParams.get('computerId');
    if (computerIdFromQuery && mockComputers.some(c => c.id === computerIdFromQuery)) {
      setSelectedComputerId(computerIdFromQuery);
    } else if (mockComputers.length > 0) {
      //setSelectedComputerId(mockComputers[0].id); // Default to first computer if none from query
    }
  }, [searchParams]);


  const handleSendCommand = () => {
    if (!selectedComputerId) {
      toast({ title: "Error", description: "Please select a target computer.", variant: "destructive" });
      return;
    }
    if (!commandContent.trim()) {
      toast({ title: "Error", description: "Command content cannot be empty.", variant: "destructive" });
      return;
    }

    const newCommand: CustomCommand = {
        id: `cmd-${Date.now()}`,
        computerId: selectedComputerId,
        command: commandContent,
        scriptType: commandScriptType,
        status: 'Pending',
        executedAt: new Date().toISOString(),
    };

    setCommandHistory(prev => [newCommand, ...prev]);
    
    // Simulate sending and response
    setTimeout(() => {
        setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? {...cmd, status: 'Sent'} : cmd));
    }, 500);

    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success
        const computer = mockComputers.find(c => c.id === selectedComputerId);
        setCommandHistory(prev => prev.map(cmd => cmd.id === newCommand.id ? {
            ...cmd, 
            status: success ? 'Success' : 'Failed',
            output: success ? `Command executed successfully on ${computer?.name || 'N/A'}. Output: OK` : `Failed to execute on ${computer?.name || 'N/A'}. Error: Simulated execution failure.`
        } : cmd));
    }, 2000 + Math.random() * 1500);

    toast({ title: "Command Sent", description: `Custom command sent to ${mockComputers.find(c => c.id === selectedComputerId)?.name}.` });
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

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Custom Commands</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execute Custom Command</CardTitle>
          <CardDescription>Send a single command or script to a specific computer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={handleSendCommand} disabled={!selectedComputerId || !commandContent.trim()}>
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
                            <TableHead>Computer</TableHead>
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
                                <TableCell>{mockComputers.find(c=>c.id === cmd.computerId)?.name || 'N/A'}</TableCell>
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
