
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { scriptTypes, getProcedureById, updateProcedureInMock, getExecutions, executeMockProcedure, getComputers, getProcedureExecutionsForProcedure } from '@/lib/mockData';
import type { Procedure, Computer, ProcedureExecution, ScriptType } from '@/types';
import { improveProcedure, type ImproveProcedureInput } from '@/ai/flows/improve-procedure';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Sparkles, Edit, Save, Bot, Terminal, ListChecks, Copy, Check, Loader2, UserCircle, Shield, HardDrive, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [isPendingAI, startAITransition] = useTransition();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScriptType, setEditScriptType] = useState<ScriptType>('PowerShell');
  const [editScriptContent, setEditScriptContent] = useState('');
  const [editRunAsUser, setEditRunAsUser] = useState(false);
  const [editSoftwareUpdateMode, setEditSoftwareUpdateMode] = useState<'all' | 'specific'>('all');
  const [editSpecificSoftware, setEditSpecificSoftware] = useState('');


  const [allComputers, setAllComputers] = useState<Computer[]>([]);
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

  const loadProcedureAndRelatedData = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setIsLoadingExecutions(true);
    setIsLoadingTargetComputers(true);
    setError(null);

    setTimeout(() => {
      try {
        const fetchedProcedure = getProcedureById(id);
        setProcedure(fetchedProcedure || null);

        if (fetchedProcedure) {
          setEditName(fetchedProcedure.name);
          setEditDescription(fetchedProcedure.description);
          if (fetchedProcedure.procedureSystemType === 'CustomScript' || !fetchedProcedure.procedureSystemType) {
            setEditScriptType(fetchedProcedure.scriptType);
            setEditScriptContent(fetchedProcedure.scriptContent);
            setEditRunAsUser(fetchedProcedure.runAsUser || false);
          } else if (fetchedProcedure.procedureSystemType === 'SoftwareUpdate') {
            setEditSoftwareUpdateMode(fetchedProcedure.softwareUpdateMode || 'all');
            setEditSpecificSoftware(fetchedProcedure.specificSoftwareToUpdate || '');
          }
          
          setExecutions(getExecutions({ procedureId: id }));
          setAllComputers(getComputers().filter(c => c.status === 'Online'));
        } else {
          setError('Procedure not found in mock data.');
        }
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load procedure details from mock.';
          setError(errorMessage);
          toast({ title: "Error Loading Data (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
        setIsLoadingExecutions(false);
        setIsLoadingTargetComputers(false);
      }
    }, 300);
  }, [id, toast]);

  useEffect(() => {
    loadProcedureAndRelatedData();
  }, [loadProcedureAndRelatedData]);

  const refreshExecutions = useCallback(() => {
    if (!procedure) return;
    setIsLoadingExecutions(true);
    setTimeout(() => { 
        setExecutions(getExecutions({ procedureId: procedure.id }));
        setIsLoadingExecutions(false);
        toast({ title: "Execution history refreshed (Mock)"});
    }, 300);
  }, [procedure, toast]);

  const handleSave = () => {
    if (!procedure) return;
    setIsSaving(true);
    try {
      let updatedData: Partial<Procedure>;
      if (procedure.procedureSystemType === 'CustomScript' || !procedure.procedureSystemType) {
        updatedData = {
          name: editName,
          description: editDescription,
          scriptType: editScriptType,
          scriptContent: editScriptContent,
          runAsUser: editRunAsUser,
        };
      } else if (procedure.procedureSystemType === 'SoftwareUpdate') {
        updatedData = {
          name: editName,
          description: editDescription,
          softwareUpdateMode: editSoftwareUpdateMode,
          specificSoftwareToUpdate: editSoftwareUpdateMode === 'specific' ? editSpecificSoftware : '',
        };
      } else { // WindowsUpdate
        updatedData = { 
          name: editName,
          description: editDescription,
        };
      }
      
      const updatedProc = updateProcedureInMock(procedure.id, updatedData);
      if (updatedProc) {
        setProcedure(updatedProc); 
        setEditName(updatedProc.name);
        setEditDescription(updatedProc.description);
        if (updatedProc.procedureSystemType === 'CustomScript' || !updatedProc.procedureSystemType) {
            setEditScriptType(updatedProc.scriptType);
            setEditScriptContent(updatedProc.scriptContent);
            setEditRunAsUser(updatedProc.runAsUser || false);
        } else if (updatedProc.procedureSystemType === 'SoftwareUpdate') {
            setEditSoftwareUpdateMode(updatedProc.softwareUpdateMode || 'all');
            setEditSpecificSoftware(updatedProc.specificSoftwareToUpdate || '');
        }
      }
      setIsEditing(false);
      toast({ title: "Procedure Saved (Mock)", description: `${updatedProc?.name || ''} has been updated.` });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving (Mock).';
        toast({ title: "Error Saving Procedure", description: errorMessage, variant: "destructive" });
    } finally {
        setTimeout(() => setIsSaving(false), 500); 
    }
  };
  
  const handleCancelEdit = () => {
    if (procedure) {
        setEditName(procedure.name);
        setEditDescription(procedure.description);
        if (procedure.procedureSystemType === 'CustomScript' || !procedure.procedureSystemType) {
            setEditScriptType(procedure.scriptType);
            setEditScriptContent(procedure.scriptContent);
            setEditRunAsUser(procedure.runAsUser || false);
        } else if (procedure.procedureSystemType === 'SoftwareUpdate') {
            setEditSoftwareUpdateMode(procedure.softwareUpdateMode || 'all');
            setEditSpecificSoftware(procedure.specificSoftwareToUpdate || '');
        }
    }
    setIsEditing(false);
  }

  const handleExecuteProcedure = () => {
    if (!procedure || selectedComputerIds.length === 0) {
        toast({ title: "Execution Error", description: "Please select at least one computer.", variant: "destructive"});
        return;
    }
    setIsExecuting(true);
    try {
      executeMockProcedure(procedure.id, selectedComputerIds); 
      toast({ title: "Procedure Execution Queued (Mock)", description: `${procedure.name} has been queued for execution on ${selectedComputerIds.length} computer(s).`});
      setSelectedComputerIds([]); 
      setTimeout(() => { 
        refreshExecutions();
        setIsExecuting(false);
      }, 2000); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
      toast({ title: "Error Executing Procedure", description: errorMessage, variant: "destructive" });
      setIsExecuting(false);
    }
  };

  const handleImproveProcedure = async () => {
    if (!procedure || !(procedure.procedureSystemType === 'CustomScript' || !procedure.procedureSystemType)) {
        toast({ title: "AI Improvement Not Applicable", description: "AI improvement is only available for Custom Script procedures.", variant: "default"});
        return;
    }
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
  
  const getSystemTypeLabel = (systemType?: Procedure['procedureSystemType']) => {
    switch (systemType) {
      case 'CustomScript': return 'Custom Script';
      case 'WindowsUpdate': return 'Windows Update';
      case 'SoftwareUpdate': return 'Software Update (winget)';
      default: return 'Custom Script';
    }
  };

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
        <Skeleton className="h-10 w-full mb-4" /> 
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
        <Button onClick={loadProcedureAndRelatedData} variant="link" className="mt-2">Retry</Button>
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

  const isNonCustomScriptProcedure = procedure.procedureSystemType === 'WindowsUpdate' || procedure.procedureSystemType === 'SoftwareUpdate';

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
              <CardDescription>{isEditing ? editDescription : procedure.description} (Mock Data)</CardDescription>
              <Badge variant="outline" className="mt-2 text-sm">
                {procedure.procedureSystemType === 'WindowsUpdate' && <HardDrive className="mr-2 h-4 w-4" />}
                {procedure.procedureSystemType === 'SoftwareUpdate' && <RefreshCw className="mr-2 h-4 w-4" />}
                {!(procedure.procedureSystemType === 'WindowsUpdate' || procedure.procedureSystemType === 'SoftwareUpdate') && <FileCode className="mr-2 h-4 w-4" />}
                {getSystemTypeLabel(procedure.procedureSystemType)}
              </Badge>
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
                    
                    {procedure.procedureSystemType === 'SoftwareUpdate' && (
                         <div className="grid grid-cols-4 items-start gap-4 pt-2">
                            <Label className="text-right col-span-1 pt-2">Update Scope</Label>
                            <div className="col-span-3">
                                <RadioGroup value={editSoftwareUpdateMode} onValueChange={(value: 'all' | 'specific') => setEditSoftwareUpdateMode(value)} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="edit-scope-all" />
                                        <Label htmlFor="edit-scope-all" className="font-normal">Update all applicable software</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="specific" id="edit-scope-specific" />
                                        <Label htmlFor="edit-scope-specific" className="font-normal">Update specific software packages</Label>
                                    </div>
                                </RadioGroup>
                                {editSoftwareUpdateMode === 'specific' && (
                                    <div className="mt-3 space-y-1">
                                        <Label htmlFor="editSpecificSoftware">Software Package IDs or Names (comma-separated)</Label>
                                        <Textarea
                                            id="editSpecificSoftware"
                                            value={editSpecificSoftware}
                                            onChange={(e) => setEditSpecificSoftware(e.target.value)}
                                            placeholder="e.g., Mozilla.Firefox, 7zip.7zip"
                                            rows={3}
                                            disabled={isSaving}
                                        />
                                         <p className="text-xs text-muted-foreground">
                                            Enter exact Winget package IDs or full names.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(!procedure.procedureSystemType || procedure.procedureSystemType === 'CustomScript') && (
                        <>
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
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editRunAsUser" className="text-right">Execution Context</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Checkbox
                                        id="editRunAsUser"
                                        checked={editRunAsUser}
                                        onCheckedChange={(checked) => setEditRunAsUser(checked === true)}
                                        disabled={isSaving}
                                    />
                                    <Label htmlFor="editRunAsUser" className="font-normal">
                                        Run this procedure as User (otherwise runs as SYSTEM)
                                    </Label>
                                </div>
                            </div>
                        </>
                    )}
                     {procedure.procedureSystemType === 'WindowsUpdate' && (
                         <Alert variant="default" className="col-span-4">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>System Procedure: Windows Update</AlertTitle>
                            <AlertDescription>
                                Only Name and Description can be edited. The script and execution context are system-managed.
                                It installs Windows updates without forcing a reboot.
                            </AlertDescription>
                        </Alert>
                    )}
                     {procedure.procedureSystemType === 'SoftwareUpdate' && isEditing && (
                         <Alert variant="default" className="col-span-4">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>System Procedure: Software Update (winget)</AlertTitle>
                            <AlertDescription>
                                Only Name, Description, and Update Scope can be edited. Script content is system-managed based on scope.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
        )}
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => router.replace(`/procedures/${id}?tab=${value}`)}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="execute">Execute</TabsTrigger>
          <TabsTrigger value="improve" disabled={isNonCustomScriptProcedure}>Improve with AI</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Procedure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">System Type</Label>
                <p className="font-semibold">{getSystemTypeLabel(procedure.procedureSystemType)}</p>
              </div>
              
              {procedure.procedureSystemType === 'SoftwareUpdate' && (
                <>
                    <div>
                        <Label className="text-sm text-muted-foreground">Software Update Mode</Label>
                        <p className="font-semibold">{procedure.softwareUpdateMode === 'specific' ? 'Specific Packages' : 'All Applicable Packages'}</p>
                    </div>
                    {procedure.softwareUpdateMode === 'specific' && (
                        <div>
                            <Label className="text-sm text-muted-foreground">Specific Software to Update</Label>
                            <p className="font-semibold whitespace-pre-wrap">{procedure.specificSoftwareToUpdate || 'N/A'}</p>
                        </div>
                    )}
                </>
              )}

              {(!procedure.procedureSystemType || procedure.procedureSystemType === 'CustomScript') && (
                <>
                    <div>
                        <Label className="text-sm text-muted-foreground">Script Type</Label>
                        <p className="font-semibold">{procedure.scriptType}</p>
                    </div>
                    <div>
                        <Label className="text-sm text-muted-foreground">Default Execution Context</Label>
                        <div className="flex items-center gap-2">
                            {procedure.runAsUser ? <UserCircle className="h-5 w-5 text-blue-600" /> : <Shield className="h-5 w-5 text-gray-600" />}
                            <p className="font-semibold">{procedure.runAsUser ? 'User' : 'SYSTEM'}</p>
                        </div>
                    </div>
                </>
              )}
               <div>
                <Label className="text-sm text-muted-foreground">Script Content</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/40">
                  <pre className="text-sm font-code whitespace-pre-wrap">
                    {procedure.procedureSystemType === 'WindowsUpdate' ? `# This is a system-managed script for Windows Updates.\n# It installs all available software updates, including Microsoft products and feature updates, without forcing a reboot.` 
                     : procedure.procedureSystemType === 'SoftwareUpdate' ? `# This is a system-managed script for 3rd Party Software Updates using winget.\n# Mode: ${procedure.softwareUpdateMode || 'all'}${procedure.softwareUpdateMode === 'specific' ? `\n# Target Packages: ${procedure.specificSoftwareToUpdate || 'NONE'}` : ''}\n${procedure.scriptContent}`
                     : procedure.scriptContent}
                  </pre>
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
                 <CardDescription>Select online computers to run this procedure on. It will run with its default context: <span className="font-semibold">{procedure.runAsUser ? 'User' : 'SYSTEM'}</span>.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTargetComputers ? (
                  <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                ) : allComputers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No online computers available for selection.</p>
                ) : (
                  <ScrollArea className="h-72 border rounded-md p-2">
                    {allComputers.map(computer => (
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
                  <CardDescription>Status of past and current executions for this procedure (Mock Data).</CardDescription>
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
                            <TableHead>Context</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {executions.map(exec => (
                            <TableRow key={exec.id}>
                            <TableCell>{exec.computerName || exec.computerId}</TableCell>
                            <TableCell>{exec.runAsUser ? 'User' : 'System'}</TableCell>
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
                (Only available for Custom Script procedures)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="aiInputLogs">Execution Logs (Optional, from mock data)</Label>
                <Textarea
                  id="aiInputLogs"
                  value={aiInputLogs}
                  onChange={(e) => setAiInputLogs(e.target.value)}
                  placeholder="Paste relevant execution logs here or load recent ones..."
                  rows={5}
                  className="font-mono text-xs"
                />
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {
                    const recentLogs = executions.slice(0, 5).map(e => `Execution ID: ${e.id}\nComputer: ${e.computerName || e.computerId}\nContext: ${e.runAsUser ? 'User' : 'SYSTEM'}\nStatus: ${e.status}\nStart: ${e.startTime}\nEnd: ${e.endTime}\nLogs:\n${e.logs}\nOutput: ${e.output || 'N/A'}\n---`).join('\n\n');
                    setAiInputLogs(recentLogs || "No recent execution logs found from mock data for this procedure.");
                    if (recentLogs) toast({title: "Loaded recent logs", description: "Up to 5 most recent execution logs loaded."});
                 }}>
                    Load recent execution logs
                 </Button>
              </div>
              <Button onClick={handleImproveProcedure} disabled={isImproving || isPendingAI || isNonCustomScriptProcedure}>
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
                       <Button size="sm" className="mt-2" onClick={() => { 
                           if (procedure && (procedure.procedureSystemType === 'CustomScript' || !procedure.procedureSystemType)) {
                               setEditScriptContent(improvedScript); 
                               toast({title: "Script updated in editor."}); 
                               router.replace(`/procedures/${id}?tab=details`); 
                               setIsEditing(true); 
                           } else {
                               toast({title: "Cannot Apply Script", description: "This script can only be applied to Custom Script procedures.", variant: "destructive"});
                           }
                        }}>
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

