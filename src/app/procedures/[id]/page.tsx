
"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import { scriptTypes, getProcedureById, updateProcedureInMock, getExecutions, executeMockProcedure, getComputers, getProcedureExecutionsForProcedure, getAiSettings } from '@/lib/mockData';
import type { Procedure, Computer, ProcedureExecution, ScriptType, WindowsUpdateScopeOptions, ProcedureSystemType, AiSettings } from '@/types';
import { improveProcedure, type ImproveProcedureInput } from '@/ai/flows/improve-procedure';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';
import { useLicense } from '@/contexts/LicenseContext';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Sparkles, Edit, Save, Bot, Terminal, ListChecks, Copy, Check, Loader2, UserCircle, Shield, HardDrive, RefreshCw, FileCode, Search as SearchIcon, AlertTriangle } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';


export default function ProcedureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isPendingAIGeneration, startAIGenerationTransition] = useTransition();
  const [isPendingAIImprovement, startAIImprovementTransition] = useTransition();
  const { isLicenseValid, isLoadingLicense } = useLicense();


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

  const [editWuIncludeOsUpdates, setEditWuIncludeOsUpdates] = useState(true);
  const [editWuIncludeMicrosoftProductUpdates, setEditWuIncludeMicrosoftProductUpdates] = useState(true);
  const [editWuIncludeFeatureUpdates, setEditWuIncludeFeatureUpdates] = useState(true);

  const [editSoftwareUpdateMode, setEditSoftwareUpdateMode] = useState<'all' | 'specific'>('all');
  const [editSpecificSoftware, setEditSpecificSoftware] = useState('');


  const [allComputers, setAllComputers] = useState<Computer[]>([]);
  const [isLoadingTargetComputers, setIsLoadingTargetComputers] = useState(true);
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [targetComputerSearchTerm, setTargetComputerSearchTerm] = useState('');
  const [executions, setExecutions] = useState<ProcedureExecution[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // For AI Improvement
  const [aiInputLogs, setAiInputLogs] = useState('');
  const [improvedScript, setImprovedScript] = useState('');
  const [improvementExplanation, setImprovementExplanation] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [aiImprovementError, setAiImprovementError] = useState<string | null>(null);
  const [copiedImprovedScript, setCopiedImprovedScript] = useState(false);
  const [copiedExplanation, setCopiedExplanation] = useState(false);

  // For AI Generation within edit mode
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [showAiGenerationSection, setShowAiGenerationSection] = useState(false);
  const [aiGenerationPrompt, setAiGenerationPrompt] = useState('');
  const [aiGeneratedScriptForEdit, setAiGeneratedScriptForEdit] = useState('');
  const [aiGenerationExplanationForEdit, setAiGenerationExplanationForEdit] = useState('');
  const [isGeneratingWithAiForEdit, setIsGeneratingWithAiForEdit] = useState(false);
  const [aiGenerationErrorForEdit, setAiGenerationErrorForEdit] = useState<string | null>(null);


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
        setAiSettings(getAiSettings());

        if (fetchedProcedure) {
          setEditName(fetchedProcedure.name);
          setEditDescription(fetchedProcedure.description);
          const systemType = fetchedProcedure.procedureSystemType || 'CustomScript';

          if (systemType === 'CustomScript') {
            setEditScriptType(fetchedProcedure.scriptType);
            setEditScriptContent(fetchedProcedure.scriptContent);
            setEditRunAsUser(fetchedProcedure.runAsUser || false);
          } else if (systemType === 'WindowsUpdate') {
            setEditWuIncludeOsUpdates(fetchedProcedure.windowsUpdateScopeOptions?.includeOsUpdates ?? true);
            setEditWuIncludeMicrosoftProductUpdates(fetchedProcedure.windowsUpdateScopeOptions?.includeMicrosoftProductUpdates ?? true);
            setEditWuIncludeFeatureUpdates(fetchedProcedure.windowsUpdateScopeOptions?.includeFeatureUpdates ?? true);
          } else if (systemType === 'SoftwareUpdate') {
            setEditSoftwareUpdateMode(fetchedProcedure.softwareUpdateMode || 'all');
            setEditSpecificSoftware(fetchedProcedure.specificSoftwareToUpdate || '');
          }

          setExecutions(getExecutions({ procedureId: id }));
          setAllComputers(getComputers()); // Fetch all first, then filter for online
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

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);

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
     if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "Cannot save procedures with an invalid license.", variant: "destructive" });
        return;
    }
    if (!procedure) return;
    setIsSaving(true);
    try {
      let updatedData: Partial<Procedure>;
      const systemType = procedure.procedureSystemType || 'CustomScript';

      if (systemType === 'CustomScript') {
        if (!editName.trim() || !editScriptContent.trim()) {
            toast({ title: "Validation Error", description: "Name and Script Content are required for custom scripts.", variant: "destructive"});
            setIsSaving(false); return;
        }
        updatedData = {
          name: editName,
          description: editDescription,
          scriptType: editScriptType,
          scriptContent: editScriptContent,
          runAsUser: editRunAsUser,
        };
      } else if (systemType === 'WindowsUpdate') {
        if (!editName.trim()) {
            toast({ title: "Validation Error", description: "Name is required.", variant: "destructive"});
            setIsSaving(false); return;
        }
        if (!editWuIncludeOsUpdates && !editWuIncludeMicrosoftProductUpdates && !editWuIncludeFeatureUpdates) {
            toast({ title: "Validation Error", description: "Please select at least one Windows Update scope.", variant: "destructive"});
            setIsSaving(false); return;
        }
        updatedData = {
            name: editName,
            description: editDescription,
            windowsUpdateScopeOptions: {
                includeOsUpdates: editWuIncludeOsUpdates,
                includeMicrosoftProductUpdates: editWuIncludeMicrosoftProductUpdates,
                includeFeatureUpdates: editWuIncludeFeatureUpdates,
            },
        };
      } else if (systemType === 'SoftwareUpdate') {
         if (!editName.trim()) {
            toast({ title: "Validation Error", description: "Name is required.", variant: "destructive"});
            setIsSaving(false); return;
        }
        if (editSoftwareUpdateMode === 'specific' && !editSpecificSoftware.trim()) {
            toast({ title: "Validation Error", description: "Please specify software packages to update or choose 'Update all'.", variant: "destructive"});
            setIsSaving(false); return;
        }
        updatedData = {
          name: editName,
          description: editDescription,
          softwareUpdateMode: editSoftwareUpdateMode,
          specificSoftwareToUpdate: editSoftwareUpdateMode === 'specific' ? editSpecificSoftware : '',
        };
      } else { 
        updatedData = { name: editName, description: editDescription };
      }

      const updatedProc = updateProcedureInMock(procedure.id, updatedData);
      if (updatedProc) {
        setProcedure(updatedProc);
        setEditName(updatedProc.name);
        setEditDescription(updatedProc.description);
        const newSystemType = updatedProc.procedureSystemType || 'CustomScript';
        if (newSystemType === 'CustomScript') {
            setEditScriptType(updatedProc.scriptType);
            setEditScriptContent(updatedProc.scriptContent);
            setEditRunAsUser(updatedProc.runAsUser || false);
        } else if (newSystemType === 'WindowsUpdate') {
            setEditWuIncludeOsUpdates(updatedProc.windowsUpdateScopeOptions?.includeOsUpdates ?? true);
            setEditWuIncludeMicrosoftProductUpdates(updatedProc.windowsUpdateScopeOptions?.includeMicrosoftProductUpdates ?? true);
            setEditWuIncludeFeatureUpdates(updatedProc.windowsUpdateScopeOptions?.includeFeatureUpdates ?? true);
        } else if (newSystemType === 'SoftwareUpdate') {
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
        const systemType = procedure.procedureSystemType || 'CustomScript';
        if (systemType === 'CustomScript') {
            setEditScriptType(procedure.scriptType);
            setEditScriptContent(procedure.scriptContent);
            setEditRunAsUser(procedure.runAsUser || false);
        } else if (systemType === 'WindowsUpdate') {
            setEditWuIncludeOsUpdates(procedure.windowsUpdateScopeOptions?.includeOsUpdates ?? true);
            setEditWuIncludeMicrosoftProductUpdates(procedure.windowsUpdateScopeOptions?.includeMicrosoftProductUpdates ?? true);
            setEditWuIncludeFeatureUpdates(procedure.windowsUpdateScopeOptions?.includeFeatureUpdates ?? true);
        } else if (systemType === 'SoftwareUpdate') {
            setEditSoftwareUpdateMode(procedure.softwareUpdateMode || 'all');
            setEditSpecificSoftware(procedure.specificSoftwareToUpdate || '');
        }
    }
    setIsEditing(false);
    setShowAiGenerationSection(false); 
  }

  const handleExecuteProcedure = () => {
     if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "Cannot execute procedures with an invalid license.", variant: "destructive" });
        return;
    }
    if (!procedure || selectedComputerIds.length === 0) {
        toast({ title: "Execution Error", description: "Please select at least one computer.", variant: "destructive"});
        return;
    }
    setIsExecuting(true);
    try {
      executeMockProcedure(procedure.id, selectedComputerIds);
      toast({ title: "Procedure Execution Queued (Mock)", description: `${procedure.name} has been queued for execution on ${selectedComputerIds.length} computer(s).`});
      setSelectedComputerIds([]);
      setTargetComputerSearchTerm('');
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

  const handleImproveProcedureWithAI = async () => {
     if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "AI features are disabled with an invalid license.", variant: "destructive" });
        return;
    }
    if (!procedure || !(procedure.procedureSystemType === 'CustomScript' || !procedure.procedureSystemType)) {
        toast({ title: "AI Improvement Not Applicable", description: "AI improvement is only available for Custom Script procedures.", variant: "default"});
        return;
    }
    setIsImproving(true);
    setAiImprovementError(null);
    setImprovedScript('');
    setImprovementExplanation('');

    const input: ImproveProcedureInput = {
      procedureScript: procedure.scriptContent,
      executionLogs: aiInputLogs || "No specific execution logs provided for this improvement cycle. Analyze based on script itself.",
    };

    startAIImprovementTransition(async () => {
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
        setAiImprovementError(errorMessage);
        toast({ title: "AI Improvement Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsImproving(false);
      }
    });
  };

  const handleGenerateScriptWithAIForEdit = async () => {
     if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "AI features are disabled with an invalid license.", variant: "destructive" });
        return;
    }
    if (!aiGenerationPrompt.trim()) {
        setAiGenerationErrorForEdit("Please describe what the script should do.");
        return;
    }
    if (!aiSettings?.globalGenerationEnabled || !aiSettings.providerConfigs.some(p => p.isEnabled)) {
        setAiGenerationErrorForEdit("AI script generation is disabled or no provider is active.");
        return;
    }
    setIsGeneratingWithAiForEdit(true);
    setAiGenerationErrorForEdit(null);
    setAiGeneratedScriptForEdit('');
    setAiGenerationExplanationForEdit('');

    const input: GenerateScriptInput = {
        description: aiGenerationPrompt,
        scriptType: editScriptType,
        context: `This script is for a system administration procedure. Target OS is likely Windows. Ensure the script is safe and follows best practices for ${editScriptType}.`,
    };
    
    startAIGenerationTransition(async () => {
        try {
            const result = await generateScript(input);
            if (result.generatedScript) {
                setAiGeneratedScriptForEdit(result.generatedScript);
                setAiGenerationExplanationForEdit(result.explanation || '');
            } else {
                throw new Error("AI returned an empty script.");
            }
        } catch (error) {
            console.error("AI Script Generation Error:", error);
            const msg = error instanceof Error ? error.message : "Unknown AI error.";
            setAiGenerationErrorForEdit(`Failed to generate script: ${msg}`);
            toast({ title: "AI Generation Failed", description: msg, variant: "destructive" });
        } finally {
            setIsGeneratingWithAiForEdit(false);
        }
    });
  };

  const handleComputerSelection = (computerId: string) => {
    setSelectedComputerIds(prev =>
      prev.includes(computerId) ? prev.filter(id => id !== computerId) : [...prev, computerId]
    );
  };

  const filteredOnlineComputersForExecution = useMemo(() => {
    let onlineComputers = allComputers.filter(c => c.status === 'Online');
    if (targetComputerSearchTerm.trim() !== '') {
      const lowerSearch = targetComputerSearchTerm.toLowerCase();
      onlineComputers = onlineComputers.filter(c => c.name.toLowerCase().includes(lowerSearch));
    }
    return onlineComputers;
  }, [allComputers, targetComputerSearchTerm]);

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

  const getSystemTypeLabel = (systemType?: ProcedureSystemType) => {
    switch (systemType) {
      case 'CustomScript': return 'Custom Script';
      case 'WindowsUpdate': return 'Windows Update';
      case 'SoftwareUpdate': return 'Software Update (winget)';
      default: return 'Custom Script';
    }
  };

  const getWindowsUpdateScopeOptionsText = (options?: WindowsUpdateScopeOptions): string[] => {
    if (!options) return ["Not configured"];
    const texts: string[] = [];
    if (options.includeOsUpdates) texts.push("Windows Güncellemeleri (Güvenlik, Kalite vb.)");
    if (options.includeMicrosoftProductUpdates) texts.push("Microsoft Ürün Güncelleştirmeleri (Office, SQL vb.)");
    if (options.includeFeatureUpdates) texts.push("Windows Özellik Güncelleştirmeleri (örn: Sürüm Yükseltmeleri)");
    return texts.length > 0 ? texts : ["No specific scopes selected (effectively all if system default)."];
  };


  if (isLoading || isLoadingLicense) {
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

  const currentSystemType = procedure.procedureSystemType || 'CustomScript';


  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.push('/procedures')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procedures
      </Button>

      {!isLicenseValid && (
         <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>License Invalid</AlertTitle>
            <AlertDescription>
                Your system license is not valid. Procedure management and execution features are disabled. Please check your <Link href="/system-license" className="underline">System License</Link>.
            </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{isEditing ? editName : procedure.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{isEditing ? editDescription : procedure.description} (Mock Data)</CardDescription>
              <Badge variant="outline" className="mt-2 text-sm">
                {procedure.procedureSystemType === 'WindowsUpdate' && <HardDrive className="mr-2 h-4 w-4" />}
                {procedure.procedureSystemType === 'SoftwareUpdate' && <RefreshCw className="mr-2 h-4 w-4" />}
                {!(procedure.procedureSystemType === 'WindowsUpdate' || procedure.procedureSystemType === 'SoftwareUpdate') && <FileCode className="mr-2 h-4 w-4" />}
                {getSystemTypeLabel(procedure.procedureSystemType)}
              </Badge>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isSaving || !isLicenseValid}>
                <Edit className="mr-2 h-4 w-4" /> Edit Procedure
              </Button>
            )}
            {isEditing && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || !isLicenseValid}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => router.replace(`/procedures/${id}?tab=${value}`)}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="execute" disabled={isEditing}>Execute</TabsTrigger>
          <TabsTrigger value="improve" disabled={isEditing || currentSystemType !== 'CustomScript' || !isLicenseValid}>Improve with AI</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle>Procedure Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="editName">Name</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving || !isLicenseValid} />
                  </div>
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={isSaving || !isLicenseValid} rows={3} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-semibold">{procedure.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p>{procedure.description || 'N/A'}</p>
                  </div>
                   <div>
                    <Label className="text-sm text-muted-foreground">System Type</Label>
                    <p className="font-semibold">{getSystemTypeLabel(procedure.procedureSystemType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p>{new Date(procedure.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <p>{new Date(procedure.updatedAt).toLocaleString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <Card>
            <CardHeader><CardTitle>Script Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {currentSystemType === 'CustomScript' && (
                <>
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="editRunAsUser">Execution Context</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Checkbox id="editRunAsUser" checked={editRunAsUser} onCheckedChange={(checked) => setEditRunAsUser(checked === true)} disabled={isSaving || !isLicenseValid} />
                          <Label htmlFor="editRunAsUser" className="font-normal">Run as User (otherwise SYSTEM)</Label>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editScriptType">Script Type</Label>
                        <Select value={editScriptType} onValueChange={(value: ScriptType) => setEditScriptType(value)} disabled={isSaving || isGeneratingWithAiForEdit || !isLicenseValid}>
                          <SelectTrigger><SelectValue placeholder="Select script type" /></SelectTrigger>
                          <SelectContent>{scriptTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="editScriptContent">Script Content</Label>
                        <Textarea id="editScriptContent" value={editScriptContent} onChange={(e) => setEditScriptContent(e.target.value)} className="font-code" rows={15} disabled={isSaving || !isLicenseValid} />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Button type="button" variant="outline" onClick={() => setShowAiGenerationSection(!showAiGenerationSection)} disabled={isSaving || !aiSettings?.globalGenerationEnabled || !aiSettings?.providerConfigs.some(p=>p.isEnabled) || !isLicenseValid} className="w-full">
                          <Sparkles className="mr-2 h-4 w-4" /> {showAiGenerationSection ? 'Hide AI Script Generator' : 'Generate Script with AI'}
                          {(!aiSettings?.globalGenerationEnabled || !aiSettings?.providerConfigs.some(p=>p.isEnabled)) && <span className="ml-2 text-xs text-muted-foreground">(AI Disabled)</span>}
                        </Button>
                        {showAiGenerationSection && aiSettings?.globalGenerationEnabled && aiSettings?.providerConfigs.some(p=>p.isEnabled) && (
                          <Card className="p-4 space-y-3 bg-muted/50">
                            <Alert variant="default" className="bg-background"><Bot className="h-4 w-4" /><AlertTitle>AI Script Generation</AlertTitle><AlertDescription>Describe script purpose. <strong className="block mt-1">Review AI scripts before use.</strong></AlertDescription></Alert>
                            <div><Label htmlFor="aiGenerationPrompt">Describe:</Label><Textarea id="aiGenerationPrompt" value={aiGenerationPrompt} onChange={(e) => setAiGenerationPrompt(e.target.value)} placeholder='e.g., "List services", "Delete temp files"' rows={3} disabled={isGeneratingWithAiForEdit || isPendingAIGeneration || !isLicenseValid} /></div>
                            <Button type="button" onClick={handleGenerateScriptWithAIForEdit} disabled={isGeneratingWithAiForEdit || isPendingAIGeneration || !aiGenerationPrompt.trim() || isSaving || !isLicenseValid}>
                              {isGeneratingWithAiForEdit || isPendingAIGeneration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate
                            </Button>
                            {aiGenerationErrorForEdit && <p className="text-sm text-destructive">{aiGenerationErrorForEdit}</p>}
                            {aiGeneratedScriptForEdit && (
                              <div className="space-y-2 pt-2">
                                <Label>AI Generated Script:</Label><ScrollArea className="h-40 border rounded-md p-2 bg-background"><pre className="text-xs font-code whitespace-pre-wrap">{aiGeneratedScriptForEdit}</pre></ScrollArea>
                                {aiGenerationExplanationForEdit && <><Label>Explanation:</Label><ScrollArea className="h-20 border rounded-md p-2 bg-background text-xs"><p className="whitespace-pre-wrap">{aiGenerationExplanationForEdit}</p></ScrollArea></>}
                                <Button type="button" size="sm" variant="outline" onClick={() => {setEditScriptContent(aiGeneratedScriptForEdit); toast({title: "Script Copied", description: "AI script copied to content field."})}} disabled={!isLicenseValid}>Use this Script</Button>
                              </div>
                            )}
                          </Card>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground">Default Execution Context</Label>
                        <div className="flex items-center gap-2">
                            {procedure.runAsUser ? <UserCircle className="h-5 w-5 text-blue-600" /> : <Shield className="h-5 w-5 text-gray-600" />}
                            <p className="font-semibold">{procedure.runAsUser ? 'User' : 'SYSTEM'}</p>
                        </div>
                      </div>
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
                    </>
                  )}
                </>
              )}
              {currentSystemType === 'WindowsUpdate' && (
                 isEditing ? (
                    <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary"/>Windows Update Scopes</h4>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="editWuOsUpdates" checked={editWuIncludeOsUpdates} onCheckedChange={(checked) => setEditWuIncludeOsUpdates(checked === true)} disabled={isSaving || !isLicenseValid} />
                            <Label htmlFor="editWuOsUpdates" className="font-normal">Windows Updates (Security, Quality, etc.)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="editWuMsProductUpdates" checked={editWuIncludeMicrosoftProductUpdates} onCheckedChange={(checked) => setEditWuIncludeMicrosoftProductUpdates(checked === true)} disabled={isSaving || !isLicenseValid} />
                            <Label htmlFor="editWuMsProductUpdates" className="font-normal">Microsoft Product Updates (Office, SQL, etc.)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="editWuFeatureUpdates" checked={editWuIncludeFeatureUpdates} onCheckedChange={(checked) => setEditWuIncludeFeatureUpdates(checked === true)} disabled={isSaving || !isLicenseValid} />
                            <Label htmlFor="editWuFeatureUpdates" className="font-normal">Windows Feature Updates (e.g., Version Upgrades)</Label>
                        </div>
                    </div>
                 ) : (
                    <div>
                        <Label className="text-sm text-muted-foreground">Windows Update Scopes</Label>
                        <ul className="list-disc list-inside font-semibold">
                            {getWindowsUpdateScopeOptionsText(procedure.windowsUpdateScopeOptions).map((scopeText, index) => (
                                <li key={index}>{scopeText}</li>
                            ))}
                        </ul>
                        <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/40 mt-2">
                            <pre className="text-sm font-code whitespace-pre-wrap">{procedure.scriptContent}</pre>
                        </ScrollArea>
                    </div>
                 )
              )}
              {currentSystemType === 'SoftwareUpdate' && (
                 isEditing ? (
                    <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary"/>Software Update (winget) Scope</h4>
                        <RadioGroup value={editSoftwareUpdateMode} onValueChange={(value: 'all' | 'specific') => setEditSoftwareUpdateMode(value)} className="space-y-2" disabled={isSaving || !isLicenseValid}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="edit-scope-su-all" />
                                <Label htmlFor="edit-scope-su-all" className="font-normal">Update all applicable software</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="specific" id="edit-scope-su-specific" />
                                <Label htmlFor="edit-scope-su-specific" className="font-normal">Update specific software packages</Label>
                            </div>
                        </RadioGroup>
                        {editSoftwareUpdateMode === 'specific' && (
                            <div className="mt-3 space-y-1">
                                <Label htmlFor="editSpecificSoftware">Software Package IDs or Names (comma-separated)</Label>
                                <Textarea id="editSpecificSoftware" value={editSpecificSoftware} onChange={(e) => setEditSpecificSoftware(e.target.value)} placeholder="e.g., Mozilla.Firefox, 7zip.7zip" rows={3} disabled={isSaving || !isLicenseValid} />
                                 <p className="text-xs text-muted-foreground">Enter exact Winget package IDs or full names.</p>
                            </div>
                        )}
                    </div>
                 ) : (
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
                        <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/40 mt-2">
                            <pre className="text-sm font-code whitespace-pre-wrap">{procedure.scriptContent}</pre>
                        </ScrollArea>
                    </>
                 )
              )}
              {(currentSystemType === 'WindowsUpdate' || currentSystemType === 'SoftwareUpdate') && !isEditing && (
                  <Alert variant="default" className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>System Procedure Information</AlertTitle>
                    <AlertDescription>
                        This is a system-managed procedure. The script content and execution context are predefined.
                        {currentSystemType === 'WindowsUpdate' && ' It installs Windows updates based on the configured scopes and does not force a reboot.'}
                        {currentSystemType === 'SoftwareUpdate' && ' It updates 3rd party software using winget based on the configured scope.'}
                    </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execute">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Target Computers</CardTitle>
                 <CardDescription>Select online computers to run this procedure on. It will run with its default context: <span className="font-semibold">{currentSystemType !== 'CustomScript' || procedure.runAsUser ? 'User' : 'SYSTEM'}</span>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search online computers..."
                        className="pl-8"
                        value={targetComputerSearchTerm}
                        onChange={(e) => setTargetComputerSearchTerm(e.target.value)}
                        disabled={isLoadingTargetComputers || isExecuting || !isLicenseValid}
                    />
                </div>
                {isLoadingTargetComputers ? (
                  <div className="space-y-2 pt-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                ) : filteredOnlineComputersForExecution.length === 0 ? (
                  <p className="text-sm text-muted-foreground pt-2 text-center">
                    {targetComputerSearchTerm ? 'No online computers match your search.' : 'No online computers available.'}
                  </p>
                ) : (
                  <ScrollArea className="h-64 border rounded-md p-2">
                    {filteredOnlineComputersForExecution.map(computer => (
                      <div key={computer.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-md">
                        <Checkbox
                          id={`comp-exec-${computer.id}`}
                          checked={selectedComputerIds.includes(computer.id)}
                          onCheckedChange={() => handleComputerSelection(computer.id)}
                          disabled={isExecuting || !isLicenseValid}
                        />
                        <Label htmlFor={`comp-exec-${computer.id}`} className="font-normal cursor-pointer flex-1">
                          {computer.name}
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleExecuteProcedure} disabled={selectedComputerIds.length === 0 || isExecuting || isLoadingTargetComputers || !isLicenseValid} className="w-full">
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
                  disabled={!isLicenseValid}
                />
                 <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {
                    const recentLogs = executions.slice(0, 5).map(e => `Execution ID: ${e.id}\nComputer: ${e.computerName || e.computerId}\nContext: ${e.runAsUser ? 'User' : 'SYSTEM'}\nStatus: ${e.status}\nStart: ${e.startTime}\nEnd: ${e.endTime}\nLogs:\n${e.logs}\nOutput: ${e.output || 'N/A'}\n---`).join('\n\n');
                    setAiInputLogs(recentLogs || "No recent execution logs found from mock data for this procedure.");
                    if (recentLogs) toast({title: "Loaded recent logs", description: "Up to 5 most recent execution logs loaded."});
                 }} disabled={!isLicenseValid}>
                    Load recent execution logs
                 </Button>
              </div>
              <Button onClick={handleImproveProcedureWithAI} disabled={isImproving || isPendingAIImprovement || currentSystemType !== 'CustomScript' || !isLicenseValid}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isImproving || isPendingAIImprovement ? 'Analyzing...' : 'Get AI Suggestions'}
              </Button>

              {(isImproving || isPendingAIImprovement) && (
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                </div>
              )}

              {aiImprovementError && (
                <Alert variant="destructive" className="mt-4">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{aiImprovementError}</AlertDescription>
                </Alert>
              )}

              {!isImproving && !isPendingAIImprovement && (improvedScript || improvementExplanation) && (
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
                               setIsEditing(true); 
                               router.replace(`/procedures/${id}?tab=script&edit=true`);
                           } else {
                               toast({title: "Cannot Apply Script", description: "This script can only be applied to Custom Script procedures.", variant: "destructive"});
                           }
                        }} disabled={!isLicenseValid}>
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
    
