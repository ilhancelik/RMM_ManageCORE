
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useTransition } from 'react';
import { mockProcedures, mockComputers, mockProcedureExecutions, scriptTypes } from '@/lib/mockData';
import type { Procedure, Computer, ProcedureExecution, ScriptType } from '@/types';
import { improveProcedure, type ImproveProcedureInput } from '@/ai/flows/improve-procedure';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Sparkles, Edit, Save, Bot, Terminal, ListChecks, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProcedureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScriptType, setEditScriptType] = useState<ScriptType>('CMD');
  const [editScriptContent, setEditScriptContent] = useState('');

  // Execution state
  const [selectedComputers, setSelectedComputers] = useState<string[]>([]);
  const [executions, setExecutions] = useState<ProcedureExecution[]>([]);
  
  // AI Improvement state
  const [aiInputLogs, setAiInputLogs] = useState('');
  const [improvedScript, setImprovedScript] = useState('');
  const [improvementExplanation, setImprovementExplanation] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [copiedImprovedScript, setCopiedImprovedScript] = useState(false);
  const [copiedExplanation, setCopiedExplanation] = useState(false);

  useEffect(() => {
    const foundProcedure = mockProcedures.find(p => p.id === id) || null;
    setProcedure(foundProcedure);
    if (foundProcedure) {
      setEditName(foundProcedure.name);
      setEditDescription(foundProcedure.description);
      setEditScriptType(foundProcedure.scriptType);
      setEditScriptContent(foundProcedure.scriptContent);
      
      // Load executions for this procedure
      setExecutions(mockProcedureExecutions.filter(exec => exec.procedureId === id));
    }
  }, [id]);

  const handleSave = () => {
    if (!procedure) return;
    const updatedProcedure: Procedure = {
      ...procedure,
      name: editName,
      description: editDescription,
      scriptType: editScriptType,
      scriptContent: editScriptContent,
      updatedAt: new Date().toISOString(),
    };
    setProcedure(updatedProcedure);
    // Here you would typically call an API to save the procedure
    // For mock data, we can update the mockProcedures array if needed, or just reflect in state
    const index = mockProcedures.findIndex(p => p.id === id);
    if (index !== -1) mockProcedures[index] = updatedProcedure;
    
    setIsEditing(false);
    toast({ title: "Procedure Saved", description: `${updatedProcedure.name} has been updated.` });
  };

  const handleComputerSelection = (computerId: string) => {
    setSelectedComputers(prev =>
      prev.includes(computerId) ? prev.filter(id => id !== computerId) : [...prev, computerId]
    );
  };

  const handleExecuteProcedure = () => {
    if (!procedure || selectedComputers.length === 0) {
        toast({ title: "Execution Error", description: "Please select at least one computer.", variant: "destructive"});
        return;
    }
    const newExecs: ProcedureExecution[] = selectedComputers.map(compId => {
      const computer = mockComputers.find(c => c.id === compId);
      return {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        procedureId: procedure.id,
        computerId: compId,
        computerName: computer?.name || 'Unknown Computer',
        status: 'Pending' as const, // Cast to literal type
        logs: `Execution started for ${procedure.name} on ${computer?.name || compId}...`,
        startTime: new Date().toISOString(),
      };
    });
    setExecutions(prev => [...newExecs, ...prev]);
    // Simulate execution
    newExecs.forEach(exec => {
        setTimeout(() => {
            setExecutions(prev => prev.map(e => e.id === exec.id ? {...e, status: 'Running'} : e));
        }, 1000);
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            setExecutions(prev => prev.map(e => e.id === exec.id ? {
                ...e, 
                status: success ? 'Success' : 'Failed',
                endTime: new Date().toISOString(),
                logs: `${e.logs}\n${success ? 'Execution completed successfully.' : 'Execution failed. Error: Simulated error.'}`,
                output: success ? 'Output: OK' : 'Output: Error XYZ'
            } : e));
        }, 3000 + Math.random() * 2000);
    });
    toast({ title: "Procedure Execution Started", description: `Executing ${procedure.name} on ${selectedComputers.length} computer(s).`});
    setSelectedComputers([]);
  };

  const handleImproveProcedure = async () => {
    if (!procedure) return;
    setIsImproving(true);
    setAiError(null);
    setImprovedScript('');
    setImprovementExplanation('');

    const input: ImproveProcedureInput = {
      procedureScript: procedure.scriptContent,
      executionLogs: aiInputLogs || "No specific execution logs provided for this improvement cycle. Analyze based on script itself.",
    };

    startTransition(async () => {
      try {
        const result = await improveProcedure(input);
        if (result) {
          setImprovedScript(result.improvedScript);
          setImprovementExplanation(result.explanation);
          toast({ title: "AI Improvement Complete", description: "Suggestions generated." });
        } else {
          throw new Error("AI service returned an empty response.");
        }
      } catch (error) {
        console.error("AI Improvement Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI processing.";
        setAiError(errorMessage);
        toast({ title: "AI Improvement Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsImproving(false);
      }
    });
  };

  const copyToClipboard = (text: string, type: 'script' | 'explanation') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'script') {
        setCopiedImprovedScript(true);
        setTimeout(() => setCopiedImprovedScript(false), 2000);
      } else {
        setCopiedExplanation(true);
        setTimeout(() => setCopiedExplanation(false), 2000);
      }
      toast({ title: "Copied to clipboard!"});
    }).catch(err => {
      toast({ title: "Copy failed", description: err.message, variant: "destructive"});
    });
  };

  if (!procedure) {
    return (
      <div className="container mx-auto py-2">
         <Button variant="outline" onClick={() => router.push('/procedures')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procedures
        </Button>
        <Card>
            <CardHeader><CardTitle>Loading Procedure...</CardTitle></CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  const defaultTab = searchParams.get('tab') || 'details';

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.push('/procedures')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procedures
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{isEditing ? editName : procedure.name}</CardTitle>
              <CardDescription>{isEditing ? editDescription : procedure.description}</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Procedure
              </Button>
            )}
            {isEditing && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setIsEditing(false); /* Reset changes if needed */ }}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </div>
            )}
          </div>
        </CardHeader>
        {isEditing && (
            <CardContent>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editName" className="text-right">Name</Label>
                        <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editDescription" className="text-right">Description</Label>
                        <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editScriptType" className="text-right">Script Type</Label>
                        <Select value={editScriptType} onValueChange={(value: ScriptType) => setEditScriptType(value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select script type" />
                        </SelectTrigger>
                        <SelectContent>
                            {scriptTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editScriptContent" className="text-right">Script Content</Label>
                        <Textarea
                        id="editScriptContent"
                        value={editScriptContent}
                        onChange={(e) => setEditScriptContent(e.target.value)}
                        className="col-span-3 font-code"
                        rows={10}
                        />
                    </div>
                </div>
            </CardContent>
        )}
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="execute">Execute</TabsTrigger>
          <TabsTrigger value="improve">Improve with AI</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Procedure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Script Type</Label>
                <p className="font-semibold">{procedure.scriptType}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Script Content</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/40">
                  <pre className="text-sm font-code whitespace-pre-wrap">{procedure.scriptContent}</pre>
                </ScrollArea>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Created At</Label>
                <p>{new Date(procedure.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Updated</Label>
                <p>{new Date(procedure.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execute">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Target Computers</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 border rounded-md p-2">
                  {mockComputers.map(computer => (
                    <div key={computer.id} className="flex items-center space-x-2 p-1">
                      <Checkbox
                        id={`comp-exec-${computer.id}`}
                        checked={selectedComputers.includes(computer.id)}
                        onCheckedChange={() => handleComputerSelection(computer.id)}
                        disabled={computer.status === 'Offline'}
                      />
                      <Label htmlFor={`comp-exec-${computer.id}`} className={computer.status === 'Offline' ? 'text-muted-foreground italic' : ''}>
                        {computer.name} ({computer.status})
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={handleExecuteProcedure} disabled={selectedComputers.length === 0} className="w-full">
                  <Play className="mr-2 h-4 w-4" /> Run on Selected ({selectedComputers.length})
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Status of past and current executions for this procedure.</CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ListChecks className="mx-auto h-10 w-10 mb-2" />
                        No executions yet for this procedure.
                    </div>
                ) : (
                <ScrollArea className="h-[20rem]"> {/* approx 320px */}
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Computer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {executions.sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()).map(exec => (
                            <TableRow key={exec.id}>
                            <TableCell>{exec.computerName}</TableCell>
                            <TableCell>
                                <Badge variant={exec.status === 'Success' ? 'default' : exec.status === 'Failed' ? 'destructive': 'secondary'} 
                                    className={exec.status === 'Success' ? 'bg-green-500 hover:bg-green-600' : exec.status === 'Failed' ? 'bg-red-500 hover:bg-red-600' : ''}>
                                    {exec.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{exec.startTime ? new Date(exec.startTime).toLocaleTimeString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => {
                                     toast({ title: `Logs for ${exec.computerName}`, description: <pre className="text-xs max-h-60 overflow-auto">{exec.logs}\nOutput: {exec.output || 'N/A'}</pre> , duration: 15000});
                                }}>View Log</Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                 )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="improve">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <CardTitle>AI-Powered Procedure Improvement</CardTitle>
              </div>
              <CardDescription>
                Analyze execution logs and the current script to get AI-powered suggestions for improvement and safety checks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="aiInputLogs">Execution Logs (Optional)</Label>
                <Textarea
                  id="aiInputLogs"
                  value={aiInputLogs}
                  onChange={(e) => setAiInputLogs(e.target.value)}
                  placeholder="Paste relevant execution logs here to help the AI understand context..."
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={handleImproveProcedure} disabled={isImproving || isPending}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isImproving || isPending ? 'Analyzing...' : 'Get AI Suggestions'}
              </Button>

              {isImproving || isPending && (
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                </div>
              )}

              {aiError && (
                <Alert variant="destructive" className="mt-4">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{aiError}</AlertDescription>
                </Alert>
              )}

              {!isImproving && !isPending && (improvedScript || improvementExplanation) && (
                <div className="space-y-6 mt-6 border-t pt-6">
                  {improvedScript && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-lg font-semibold">Improved Script</Label>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(improvedScript, 'script')}>
                            {copiedImprovedScript ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copiedImprovedScript ? 'Copied!' : 'Copy Script'}
                        </Button>
                      </div>
                      <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/40">
                        <pre className="text-sm font-code whitespace-pre-wrap">{improvedScript}</pre>
                      </ScrollArea>
                       <Button size="sm" className="mt-2" onClick={() => { setEditScriptContent(improvedScript); toast({title: "Script updated in editor."}); router.replace(`/procedures/${id}?tab=details`); setIsEditing(true); }}>
                            Use this Script
                        </Button>
                    </div>
                  )}
                  {improvementExplanation && (
                    <div>
                       <div className="flex justify-between items-center mb-2">
                            <Label className="text-lg font-semibold">Explanation</Label>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(improvementExplanation, 'explanation')}>
                                {copiedExplanation ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copiedExplanation ? 'Copied!' : 'Copy Explanation'}
                            </Button>
                        </div>
                      <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/40">
                        <p className="text-sm whitespace-pre-wrap">{improvementExplanation}</p>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
