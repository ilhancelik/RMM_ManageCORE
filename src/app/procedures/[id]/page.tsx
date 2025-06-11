
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { mockComputers, scriptTypes } from '@/lib/mockData'; // mockComputers remains for selection UI simulation
import type { Procedure, Computer, ProcedureExecution, ScriptType } from '@/types';
import { improveProcedure, type ImproveProcedureInput } from '@/ai/flows/improve-procedure';
import { fetchProcedureById, updateProcedure, fetchExecutions, executeProcedure, fetchComputers as fetchAllComputersForSelection } from '@/lib/apiClient';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Sparkles, Edit, Save, Bot, Terminal, ListChecks, Copy, Check, Loader2 } from 'lucide-react';
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

// const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000; // No longer needed here for filtering mock

export default function ProcedureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isPendingAI, startAITransition] = useTransition();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScriptType, setEditScriptType] = useState<ScriptType>('CMD');
  const [editScriptContent, setEditScriptContent] = useState('');

  const [targetComputers, setTargetComputers] = useState<Computer[]>([]); // For selection
  const [isLoadingTargetComputers, setIsLoadingTargetComputers] = useState(true);
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [executions, setExecutions] = useState<ProcedureExecution[]>([]); 
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [aiInputLogs, setAiInputLogs] = useState('');
  const [improvedScript, setImprovedScript] = useState('');
  const [improvementExplanation, setImprovementExplanation] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [copiedImprovedScript, setCopiedImprovedScript] = useState(false);
  const [copiedExplanation, setCopiedExplanation] = useState(false);

  const loadProcedureAndExecutions = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsLoadingExecutions(true);
    setError(null);
    try {
      const fetchedProcedure = await fetchProcedureById(id);
      setProcedure(fetchedProcedure);
      if (fetchedProcedure) {
        setEditName(fetchedProcedure.name);
        setEditDescription(fetchedProcedure.description);
        setEditScriptType(fetchedProcedure.scriptType);
        setEditScriptContent(fetchedProcedure.scriptContent);
        
        const fetchedExecs = await fetchExecutions({ procedureId: id });
        setExecutions(fetchedExecs);
      } else {
        setError('Procedure not found.');
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load procedure details or executions.';
        setError(errorMessage);
        toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingExecutions(false);
    }
  }, [id, toast]);

  const loadTargetComputers = useCallback(async () => {
    setIsLoadingTargetComputers(true);
    try {
      const computers = await fetchAllComputersForSelection(); // Using the renamed function
      setTargetComputers(computers.filter(c => c.status === 'Online')); // Only show online for selection
    } catch (err) {
      toast({ title: "Error Loading Computers", description: err instanceof Error ? err.message : "Could not load computers for selection.", variant: "destructive" });
      setTargetComputers([]);
    } finally {
      setIsLoadingTargetComputers(false);
    }
  }, [toast]);


  useEffect(() => {
    loadProcedureAndExecutions();
    loadTargetComputers(); // Load computers for selection when component mounts or id changes
  }, [loadProcedureAndExecutions, loadTargetComputers]);

  const refreshExecutions = useCallback(async () => {
    if (!procedure) return;
    setIsLoadingExecutions(true);
    try {
      const fetchedExecs = await fetchExecutions({ procedureId: procedure.id });
      setExecutions(fetchedExecs);
    } catch (err) {
      toast({ title: "Error Refreshing Executions", description: err instanceof Error ? err.message : "Could not refresh execution history.", variant: "destructive" });
    } finally {
      setIsLoadingExecutions(false);
    }
  }, [procedure, toast]);

  const handleSave = async () => {
    if (!procedure) return;
    setIsSaving(true);
    try {
      const updatedData: Partial<Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: editName,
        description: editDescription,
        scriptType: editScriptType,
        scriptContent: editScriptContent,
      };
      const updatedProc = await updateProcedure(procedure.id, updatedData);
      setProcedure(updatedProc); 
      setEditName(updatedProc.name);
      setEditDescription(updatedProc.description);
      setEditScriptType(updatedProc.scriptType);
      setEditScriptContent(updatedProc.scriptContent);
      setIsEditing(false);
      toast({ title: "Procedure Saved", description: `${updatedProc.name} has been updated.` });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving.';
        toast({ title: "Error Saving Procedure", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    if (procedure) {
        setEditName(procedure.name);
        setEditDescription(procedure.description);
        setEditScriptType(procedure.scriptType);
        setEditScriptContent(procedure.scriptContent);
    }
    setIsEditing(false);
  }

  const handleExecuteProcedure = async () => {
    if (!procedure || selectedComputerIds.length === 0) {
        toast({ title: "Execution Error", description: "Please select at least one computer.", variant: "destructive"});
        return;
    }
    setIsExecuting(true);
    try {
      await executeProcedure(procedure.id, selectedComputerIds);
      toast({ title: "Procedure Execution Queued", description: `${procedure.name} has been queued for execution on ${selectedComputerIds.length} computer(s). Status will update in history.`});
      setSelectedComputerIds([]); // Clear selection
      // Wait a bit for API to process then refresh history
      setTimeout(() => {
        refreshExecutions();
      }, 2000); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ title: "Error Executing Procedure", description: errorMessage, variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
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

    startAITransition(async () => {
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
  
  const handleComputerSelection = (computerId: string) => {
    setSelectedComputerIds(prev =>
      prev.includes(computerId) ? prev.filter(id => id !== computerId) : [...prev, computerId]
    );
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
  
  const defaultTab = searchParams.get('tab') || 'details';

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
         <Button variant="outline" onClick={() => router.push('/procedures')} className="mb-6" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procedures
        </Button>
        <Card className="mb-6">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardHeader>
        </Card>
        <Skeleton className="h-10 w-full mb-4" /> {/* TabsList skeleton */}
        <Card>
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading procedure details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/procedures')} variant="outline" className="mt-4">
            Back to Procedures
        </Button>
        <Button onClick={loadProcedureAndExecutions} variant="link" className="mt-2">Retry</Button>
      </div>
    );
  }

  if (!procedure) {
     return (
        <div className="container mx-auto py-10 text-center">
            <p>Procedure not found. It might have been deleted.</p>
            <Button onClick={() => router.push('/procedures')} variant="outline" className="mt-4">
                Back to Procedures
            </Button>
        </div>
     );
  }


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
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isSaving}>
                <Edit className="mr-2 h-4 w-4" /> Edit Procedure
              </Button>
            )}
            {isEditing && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
          </div>
        </CardHeader>
        {isEditing && (
            <CardContent>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editName" className="text-right">Name</Label>
                        <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" disabled={isSaving} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editDescription" className="text-right">Description</Label>
                        <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="col-span-3" disabled={isSaving} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editScriptType" className="text-right">Script Type</Label>
                        <Select value={editScriptType} onValueChange={(value: ScriptType) => setEditScriptType(value)} disabled={isSaving}>
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
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="editScriptContent" className="text-right pt-2">Script Content</Label>
                        <Textarea
                        id="editScriptContent"
                        value={editScriptContent}
                        onChange={(e) => setEditScriptContent(e.target.value)}
                        className="col-span-3 font-code"
                        rows={10}
                        disabled={isSaving}
                        />
                    </div>
                </div>
            </CardContent>
        )}
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => router.replace(`/procedures/${id}?tab=${value}`)}>
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
                 <CardDescription>Select online computers to run this procedure on.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTargetComputers ? (
                  <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                ) : targetComputers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No online computers available for selection.</p>
                ) : (
                  <ScrollArea className="h-72 border rounded-md p-2">
                    {targetComputers.map(computer => (
                      <div key={computer.id} className="flex items-center space-x-2 p-1">
                        <Checkbox
                          id={`comp-exec-${computer.id}`}
                          checked={selectedComputerIds.includes(computer.id)}
                          onCheckedChange={() => handleComputerSelection(computer.id)}
                          disabled={isExecuting}
                        />
                        <Label htmlFor={`comp-exec-${computer.id}`}>
                          {computer.name}
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleExecuteProcedure} disabled={selectedComputerIds.length === 0 || isExecuting || isLoadingTargetComputers} className="w-full">
                  {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                  {isExecuting ? 'Queueing...' : <><Play className="mr-2 h-4 w-4" /> Run on Selected ({selectedComputerIds.length})</> }
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Execution History</CardTitle>
                  <CardDescription>Status of past and current executions for this procedure (from API).</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={refreshExecutions} disabled={isLoadingExecutions}>
                  {isLoadingExecutions ? <Loader2 className="h-4 w-4 animate-spin"/> : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingExecutions && executions.length === 0 ? (
                  <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : executions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ListChecks className="mx-auto h-10 w-10 mb-2" />
                        No executions found for this procedure.
                    </div>
                ) : (
                <ScrollArea className="h-[20rem]"> 
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
                        {executions.map(exec => (
                            <TableRow key={exec.id}>
                            <TableCell>{exec.computerName || exec.computerId}</TableCell>
                            <TableCell>
                                <Badge variant={exec.status === 'Success' ? 'default' : exec.status === 'Failed' ? 'destructive': 'secondary'} 
                                    className={exec.status === 'Success' ? 'bg-green-500 hover:bg-green-600' : exec.status === 'Failed' ? 'bg-red-500 hover:bg-red-600' : exec.status === 'Pending' || exec.status === 'Running' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                                    {exec.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{exec.startTime ? new Date(exec.startTime).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => {
                                     toast({ title: `Logs for ${exec.computerName || exec.computerId}`, description: <ScrollArea className="max-h-60"><pre className="text-xs whitespace-pre-wrap">{exec.logs}\nOutput: {exec.output || 'N/A'}</pre></ScrollArea> , duration: 15000});
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
                <Label htmlFor="aiInputLogs">Execution Logs (Optional, from last 30 days API data)</Label>
                <Textarea
                  id="aiInputLogs"
                  value={aiInputLogs}
                  onChange={(e) => setAiInputLogs(e.target.value)}
                  placeholder="Paste relevant execution logs here or load recent ones..."
                  rows={5}
                  className="font-mono text-xs"
                />
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {
                    const recentLogs = executions.slice(0, 5).map(e => `Execution ID: ${e.id}\nComputer: ${e.computerName || e.computerId}\nStatus: ${e.status}\nStart: ${e.startTime}\nEnd: ${e.endTime}\nLogs:\n${e.logs}\nOutput: ${e.output || 'N/A'}\n---`).join('\n\n');
                    setAiInputLogs(recentLogs || "No recent execution logs found from API for this procedure.");
                    if (recentLogs) toast({title: "Loaded recent logs", description: "Up to 5 most recent execution logs loaded."});
                 }}>
                    Load recent execution logs
                 </Button>
              </div>
              <Button onClick={handleImproveProcedure} disabled={isImproving || isPendingAI}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isImproving || isPendingAI ? 'Analyzing...' : 'Get AI Suggestions'}
              </Button>

              {(isImproving || isPendingAI) && (
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

              {!isImproving && !isPendingAI && (improvedScript || improvementExplanation) && (
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
