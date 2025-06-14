
"use client";

import type { Procedure, ScriptType, AiSettings } from '@/types';
import { scriptTypes, getProcedures, addProcedure, updateProcedureInMock, deleteProcedureFromMock, getAiSettings } from '@/lib/mockData'; 
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, FileCode, ListFilter, Loader2, Search, Sparkles, Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcedureTable } from '@/components/procedures/ProcedureTable';

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isPendingAI, startAITransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<Procedure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [procedureName, setProcedureName] = useState('');
  const [procedureDescription, setProcedureDescription] = useState('');
  const [procedureScriptType, setProcedureScriptType] = useState<ScriptType>('CMD');
  const [procedureScriptContent, setProcedureScriptContent] = useState('');
  const [procedureRunAsUser, setProcedureRunAsUser] = useState(false);


  const [filterType, setFilterType] = useState<ScriptType | 'All'>('All');
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');

  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [showAiSection, setShowAiSection] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);


  const loadInitialData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setProcedures(getProcedures());
        setAiSettings(getAiSettings());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data from mock.';
        setError(errorMessage);
        toast({ title: "Error Loading Data (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const filteredProcedures = useMemo(() => {
    let results = procedures;
    if (filterType !== 'All') {
      results = results.filter(proc => proc.scriptType === filterType);
    }
    if (procedureSearchTerm.trim() !== '') {
      const lowerSearchTerm = procedureSearchTerm.toLowerCase();
      results = results.filter(proc =>
        proc.name.toLowerCase().includes(lowerSearchTerm) ||
        proc.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return results;
  }, [procedures, filterType, procedureSearchTerm]);


  const resetForm = () => {
    setProcedureName('');
    setProcedureDescription('');
    setProcedureScriptType('CMD');
    setProcedureScriptContent('');
    setProcedureRunAsUser(false); 
    setCurrentProcedure(null);
    setIsEditMode(false);
    setShowAiSection(false);
    setAiPrompt('');
    setAiGeneratedScript('');
    setAiExplanation('');
    setIsGeneratingWithAi(false);
    setAiGenerationError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setCurrentProcedure(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (procedure: Procedure) => {
    resetForm();
    setIsEditMode(true);
    setCurrentProcedure(procedure);
    setProcedureName(procedure.name);
    setProcedureDescription(procedure.description);
    setProcedureScriptType(procedure.scriptType);
    setProcedureScriptContent(procedure.scriptContent);
    setProcedureRunAsUser(procedure.runAsUser || false);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!procedureName.trim() || !procedureScriptContent.trim()) {
        toast({ title: "Validation Error", description: "Procedure Name and Script Content are required.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
      const procData = {
        name: procedureName,
        description: procedureDescription,
        scriptType: procedureScriptType,
        scriptContent: procedureScriptContent,
        runAsUser: procedureRunAsUser,
      };
      if (isEditMode && currentProcedure) {
        updateProcedureInMock(currentProcedure.id, procData);
        toast({title: "Success", description: `Procedure "${procedureName}" updated (Mock).`});
      } else {
        addProcedure(procData);
        toast({title: "Success", description: `Procedure "${procedureName}" created (Mock).`});
      }
      
      setTimeout(() => { 
        resetForm();
        setIsModalOpen(false);
        loadInitialData(); 
        setIsSubmitting(false);
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: isEditMode ? "Error Updating Procedure" : "Error Creating Procedure", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleDelete = (procedureId: string, procedureNameText: string) => {
    if (!window.confirm(`Are you sure you want to delete procedure "${procedureNameText}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true); 
    try {
        deleteProcedureFromMock(procedureId);
        toast({title: "Success", description: `Procedure "${procedureNameText}" deleted (Mock).`});
        setTimeout(() => { 
          loadInitialData(); 
          setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting Procedure", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
        setAiGenerationError("Please describe what the script should do.");
        return;
    }
    if (!aiSettings?.globalGenerationEnabled) {
        setAiGenerationError("AI script generation is disabled in settings.");
        return;
    }
    setIsGeneratingWithAi(true);
    setAiGenerationError(null);
    setAiGeneratedScript('');
    setAiExplanation('');

    const input: GenerateScriptInput = {
        description: aiPrompt,
        scriptType: procedureScriptType,
        context: `This script is for a system administration procedure. Target OS is likely Windows. Ensure the script is safe and follows best practices for ${procedureScriptType}.`,
    };
    
    startAITransition(async () => {
        try {
            const result = await generateScript(input);
            if (result.generatedScript) {
                setAiGeneratedScript(result.generatedScript);
                setAiExplanation(result.explanation || '');
            } else {
                throw new Error("AI returned an empty script.");
            }
        } catch (error) {
            console.error("AI Script Generation Error:", error);
            const msg = error instanceof Error ? error.message : "Unknown AI error.";
            setAiGenerationError(`Failed to generate script: ${msg}`);
            toast({ title: "AI Generation Failed", description: msg, variant: "destructive" });
        } finally {
            setIsGeneratingWithAi(false);
        }
    });
  };

  const ProcedureFormFields = (
    <div className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} className="col-span-3" disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Textarea id="description" value={procedureDescription} onChange={(e) => setProcedureDescription(e.target.value)} className="col-span-3" disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="procedureRunAsUserModal" className="text-right">Execution Context</Label>
        <div className="col-span-3 flex items-center space-x-2">
            <Checkbox
                id="procedureRunAsUserModal"
                checked={procedureRunAsUser}
                onCheckedChange={(checked) => setProcedureRunAsUser(checked === true)}
                disabled={isSubmitting}
            />
            <Label htmlFor="procedureRunAsUserModal" className="font-normal">
                Run as User (otherwise SYSTEM)
            </Label>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="scriptType" className="text-right">Script Type</Label>
        <Select value={procedureScriptType} onValueChange={(value: ScriptType) => setProcedureScriptType(value)} disabled={isSubmitting || isGeneratingWithAi}>
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
        <Label htmlFor="scriptContent" className="text-right pt-2">Script Content</Label>
        <Textarea
          id="scriptContent"
          value={procedureScriptContent}
          onChange={(e) => setProcedureScriptContent(e.target.value)}
          className="col-span-3 font-code"
          rows={10}
          placeholder={`Enter ${procedureScriptType} script here...`}
          disabled={isSubmitting}
        />
      </div>
      
      <Separator />
      <div className="space-y-2">
        <Button
            type="button"
            variant="outline"
            onClick={() => setShowAiSection(!showAiSection)}
            disabled={isSubmitting || !aiSettings?.globalGenerationEnabled || !aiSettings?.providerConfigs.some(p=>p.isEnabled)}
            className="w-full"
        >
            <Sparkles className="mr-2 h-4 w-4" />
            {showAiSection ? 'Hide AI Script Generator' : 'Generate Script with AI'}
            {(!aiSettings?.globalGenerationEnabled || !aiSettings?.providerConfigs.some(p=>p.isEnabled)) && <span className="ml-2 text-xs text-muted-foreground">(AI Disabled)</span>}
        </Button>

        {showAiSection && aiSettings?.globalGenerationEnabled && aiSettings?.providerConfigs.some(p=>p.isEnabled) && (
            <Card className="p-4 space-y-3 bg-muted/50">
                 <Alert variant="default" className="bg-background">
                    <Bot className="h-4 w-4" />
                    <AlertTitle>AI Script Generation</AlertTitle>
                    <AlertDescription>
                        Describe what you want the script to do. The AI will attempt to generate a {procedureScriptType} script.
                        <strong className="block mt-1">Always review AI-generated scripts carefully before use.</strong>
                    </AlertDescription>
                </Alert>
                <div>
                    <Label htmlFor="aiPrompt">Describe the script's purpose:</Label>
                    <Textarea
                        id="aiPrompt"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={`e.g., "List all running services", "Delete temp files older than 30 days in C:\\Temp"`}
                        rows={3}
                        disabled={isGeneratingWithAi || isPendingAI}
                    />
                </div>
                <Button type="button" onClick={handleGenerateWithAI} disabled={isGeneratingWithAi || isPendingAI || !aiPrompt.trim() || isSubmitting}>
                    {isGeneratingWithAi || isPendingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGeneratingWithAi || isPendingAI ? 'Generating...' : 'Generate'}
                </Button>

                {aiGenerationError && <p className="text-sm text-destructive">{aiGenerationError}</p>}
                
                {aiGeneratedScript && (
                    <div className="space-y-2 pt-2">
                        <Label htmlFor="aiGeneratedScript">AI Generated Script:</Label>
                        <ScrollArea className="h-40 border rounded-md p-2 bg-background">
                           <pre className="text-xs font-code whitespace-pre-wrap">{aiGeneratedScript}</pre>
                        </ScrollArea>
                        {aiExplanation && (
                            <>
                                <Label htmlFor="aiExplanation">Explanation:</Label>
                                <ScrollArea className="h-20 border rounded-md p-2 bg-background text-xs">
                                    <p className="whitespace-pre-wrap">{aiExplanation}</p>
                                </ScrollArea>
                            </>
                        )}
                        <Button type="button" size="sm" variant="outline" onClick={() => {setProcedureScriptContent(aiGeneratedScript); toast({title: "Script Copied", description: "AI generated script copied to script content field."})}}>
                            Use this Script
                        </Button>
                    </div>
                )}
            </Card>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Skeleton className="h-10 w-40" />
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-[250px]" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
         <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading procedures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 text-center text-destructive">
        <p>{error}</p>
        <Button onClick={loadInitialData} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Procedures</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search procedures..."
                className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
                value={procedureSearchTerm}
                onChange={(e) => setProcedureSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <ListFilter className="mr-2 h-4 w-4" /> Filter ({filterType})
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setFilterType('All')}>All</DropdownMenuItem>
                    {scriptTypes.map(type => (
                        <DropdownMenuItem key={type} onSelect={() => setFilterType(type)}>{type}</DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleOpenCreateModal} disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Procedure
            </Button>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Procedure' : 'Create New Procedure'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your existing procedure.' : 'Define a new script or set of commands to run on managed computers (Mock Data).'}
            </DialogDescription>
          </DialogHeader>
          {ProcedureFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (!isSubmitting) { setIsModalOpen(false); resetForm(); } }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Procedure')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
            <CardTitle>
                {filterType !== 'All' ? `${filterType} Procedures` : 'All Procedures'}
                {procedureSearchTerm && ` (Filtered by "${procedureSearchTerm}")`}
            </CardTitle>
            <CardDescription>
                {`View and manage ${filterType !== 'All' ? filterType.toLowerCase() : 'all'} script procedures.`}
                {!isLoading && filteredProcedures.length === 0 && ' No procedures match your current filters.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
            ) : error ? (
                <p className="text-destructive text-center py-4">{error}</p>
            ) : filteredProcedures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <FileCode className="mx-auto h-12 w-12 mb-4" />
                    <p className="font-semibold">
                        {procedureSearchTerm || filterType !== 'All'
                        ? 'No Procedures Found'
                        : 'No Procedures Yet'}
                    </p>
                    <p className="text-sm">
                    {procedureSearchTerm && filterType !== 'All'
                        ? `No procedures match your search for "${procedureSearchTerm}" with type "${filterType}".`
                        : procedureSearchTerm
                        ? `No procedures match your search for "${procedureSearchTerm}".`
                        : filterType !== 'All'
                            ? `No procedures found for type "${filterType}". Try a different filter or create one.`
                            : 'Create procedures to automate tasks on your computers.'}
                    </p>
                     {!procedureSearchTerm && filterType === 'All' && (
                        <Button onClick={handleOpenCreateModal} disabled={isSubmitting} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Procedure
                        </Button>
                    )}
                </div>
            ) : (
                <ProcedureTable 
                    procedures={filteredProcedures} 
                    onEdit={handleOpenEditModal} 
                    onDelete={handleDelete}
                    disabled={isSubmitting}
                />
            )}
        </CardContent>
        {!isLoading && !error && filteredProcedures.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                Showing {filteredProcedures.length} of {procedures.length} procedures.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
    

    