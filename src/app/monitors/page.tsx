
"use client";

import type { Monitor, ScriptType, AiSettings } from '@/types';
import { scriptTypes, getMonitors, addMonitorToMock, updateMonitorInMock, deleteMonitorFromMock, getAiSettings } from '@/lib/mockData';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Activity, Loader2, Search, Sparkles, Bot } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MonitorTable } from '@/components/monitors/MonitorTable';

const intervalUnits: Monitor['defaultIntervalUnit'][] = ['minutes', 'hours', 'days'];

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isPendingAI, startAITransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMonitor, setCurrentMonitor] = useState<Monitor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [monitorName, setMonitorName] = useState('');
  const [monitorDescription, setMonitorDescription] = useState('');
  const [monitorScriptType, setMonitorScriptType] = useState<ScriptType>('PowerShell');
  const [monitorScriptContent, setMonitorScriptContent] = useState('');
  const [monitorIntervalValue, setMonitorIntervalValue] = useState<number>(5);
  const [monitorIntervalUnit, setMonitorIntervalUnit] = useState<Monitor['defaultIntervalUnit']>('minutes');
  const [monitorSendEmail, setMonitorSendEmail] = useState(true);

  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');
  
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
        setMonitors(getMonitors());
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

  const filteredMonitors = useMemo(() => {
    if (!monitorSearchTerm.trim()) {
      return monitors;
    }
    const lowerSearchTerm = monitorSearchTerm.toLowerCase();
    return monitors.filter(monitor =>
      monitor.name.toLowerCase().includes(lowerSearchTerm) ||
      monitor.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [monitors, monitorSearchTerm]);
  
  const resetForm = () => {
    setMonitorName('');
    setMonitorDescription('');
    setMonitorScriptType('PowerShell');
    setMonitorScriptContent('');
    setMonitorIntervalValue(5);
    setMonitorIntervalUnit('minutes');
    setMonitorSendEmail(true);
    setCurrentMonitor(null);
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
    setCurrentMonitor(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (monitor: Monitor) => {
    resetForm();
    setIsEditMode(true);
    setCurrentMonitor(monitor);
    setMonitorName(monitor.name);
    setMonitorDescription(monitor.description);
    setMonitorScriptType(monitor.scriptType);
    setMonitorScriptContent(monitor.scriptContent);
    setMonitorIntervalValue(monitor.defaultIntervalValue);
    setMonitorIntervalUnit(monitor.defaultIntervalUnit);
    setMonitorSendEmail(monitor.sendEmailOnAlert);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!monitorName.trim() || !monitorScriptContent.trim() || monitorIntervalValue <= 0) {
      toast({ title: "Error", description: "Name, script content, and a valid interval are required.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    try {
      const monitorData = {
        name: monitorName,
        description: monitorDescription,
        scriptType: monitorScriptType,
        scriptContent: monitorScriptContent,
        defaultIntervalValue: monitorIntervalValue,
        defaultIntervalUnit: monitorIntervalUnit,
        sendEmailOnAlert: monitorSendEmail,
      };

      if (isEditMode && currentMonitor) {
        updateMonitorInMock(currentMonitor.id, monitorData);
        toast({title: "Success", description: `Monitor "${monitorName}" updated (Mock).`});
      } else {
        addMonitorToMock(monitorData);
        toast({title: "Success", description: `Monitor "${monitorName}" created (Mock).`});
      }
      
      setTimeout(() => { 
        resetForm();
        setIsModalOpen(false);
        loadInitialData(); 
        setIsSubmitting(false);
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: isEditMode ? "Error Updating Monitor" : "Error Creating Monitor", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleDelete = (monitorId: string, monitorNameText: string) => {
    if (!window.confirm(`Are you sure you want to delete monitor "${monitorNameText}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true);
    try {
        deleteMonitorFromMock(monitorId);
        toast({title: "Success", description: `Monitor "${monitorNameText}" deleted (Mock).`});
        setTimeout(() => { 
          loadInitialData(); 
          setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting Monitor", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
        setAiGenerationError("Please describe what the script should do.");
        return;
    }
    if (!aiSettings?.globalGenerationEnabled || !aiSettings.providerConfigs.some(p => p.isEnabled)) {
        setAiGenerationError("AI script generation is disabled or no provider is active.");
        return;
    }
    setIsGeneratingWithAi(true);
    setAiGenerationError(null);
    setAiGeneratedScript('');
    setAiExplanation('');

    const input: GenerateScriptInput = {
        description: aiPrompt,
        scriptType: monitorScriptType,
        context: `This script is for a system monitoring task. It should output 'OK:' for normal status or 'ALERT:' for an alert condition, followed by a brief message. Target OS is likely Windows. Ensure the script is safe and follows best practices for ${monitorScriptType}.`,
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

  const MonitorFormFields = (
    <div className="space-y-4 py-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorName" className="text-right">Name</Label>
        <Input id="monitorName" value={monitorName} onChange={(e) => setMonitorName(e.target.value)} className="col-span-3" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorDescription" className="text-right">Description</Label>
        <Textarea id="monitorDescription" value={monitorDescription} onChange={(e) => setMonitorDescription(e.target.value)} className="col-span-3" disabled={isSubmitting}/>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorScriptType" className="text-right">Script Type</Label>
        <Select value={monitorScriptType} onValueChange={(value: ScriptType) => setMonitorScriptType(value)} disabled={isSubmitting || isGeneratingWithAi}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select script type" /></SelectTrigger>
          <SelectContent>
            {scriptTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="monitorScriptContent" className="text-right pt-2">Script Content</Label>
        <Textarea
          id="monitorScriptContent"
          value={monitorScriptContent}
          onChange={(e) => setMonitorScriptContent(e.target.value)}
          className="col-span-3 font-code"
          rows={8}
          placeholder={`Enter ${monitorScriptType} script. Script should output 'OK:' or 'ALERT:' prefix.`}
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
                    <AlertTitle>AI Script Generation for Monitors</AlertTitle>
                    <AlertDescription>
                        Describe the condition to monitor. The AI will try to generate a {monitorScriptType} script that outputs "OK: ..." or "ALERT: ...".
                        <strong className="block mt-1">Always review AI-generated scripts carefully before use.</strong>
                    </AlertDescription>
                </Alert>
                <div>
                    <Label htmlFor="aiPromptMonitor">Describe the monitoring condition:</Label>
                    <Textarea
                        id="aiPromptMonitor"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={`e.g., "Check if CPU usage is above 80%", "Verify if 'PrintSpooler' service is running"`}
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
                        <Label htmlFor="aiGeneratedScriptMonitor">AI Generated Script:</Label>
                        <ScrollArea className="h-40 border rounded-md p-2 bg-background">
                           <pre className="text-xs font-code whitespace-pre-wrap">{aiGeneratedScript}</pre>
                        </ScrollArea>
                        {aiExplanation && (
                            <>
                                <Label htmlFor="aiExplanationMonitor">Explanation:</Label>
                                <ScrollArea className="h-20 border rounded-md p-2 bg-background text-xs">
                                    <p className="whitespace-pre-wrap">{aiExplanation}</p>
                                </ScrollArea>
                            </>
                        )}
                        <Button type="button" size="sm" variant="outline" onClick={() => {setMonitorScriptContent(aiGeneratedScript); toast({title: "Script Copied", description: "AI generated script copied to script content field."})}}>
                            Use this Script
                        </Button>
                    </div>
                )}
            </Card>
        )}
      </div>
      <Separator />


      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorIntervalValue" className="text-right">Default Interval</Label>
        <div className="col-span-3 grid grid-cols-2 gap-2">
            <Input id="monitorIntervalValue" type="number" value={monitorIntervalValue} onChange={(e) => setMonitorIntervalValue(Math.max(1, parseInt(e.target.value)))} placeholder="e.g., 5" disabled={isSubmitting}/>
            <Select value={monitorIntervalUnit} onValueChange={(value: Monitor['defaultIntervalUnit']) => setMonitorIntervalUnit(value)} disabled={isSubmitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {intervalUnits.map(unit => (<SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>))}
                </SelectContent>
            </Select>
        </div>
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorSendEmail" className="text-right">Notifications</Label>
        <div className="col-span-3 flex items-center space-x-2">
            <Checkbox id="monitorSendEmail" checked={monitorSendEmail} onCheckedChange={(checked) => setMonitorSendEmail(!!checked)} disabled={isSubmitting}/>
            <Label htmlFor="monitorSendEmail" className="font-normal">Send email notification on alert</Label>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-[250px]" />
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
            <p className="ml-2 text-muted-foreground">Loading monitors...</p>
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
        <h1 className="text-3xl font-bold text-foreground">Monitors</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search monitors..."
              className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
              value={monitorSearchTerm}
              onChange={(e) => setMonitorSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Monitor
          </Button>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if(!isSubmitting) { setIsModalOpen(isOpen); if(!isOpen) resetForm(); } }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Monitor' : 'Create New Monitor'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your existing monitor.' : 'Define a new script to monitor system status or events (Mock Data).'}
            </DialogDescription>
          </DialogHeader>
          {MonitorFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if(!isSubmitting) { setIsModalOpen(false); resetForm(); } }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Monitor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>
            All Monitors
            {monitorSearchTerm && ` (Filtered by "${monitorSearchTerm}")`}
          </CardTitle>
          <CardDescription>
            View and manage all system monitors.
            {!isLoading && filteredMonitors.length === 0 && ' No monitors match your current filters.'}
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
          ) : filteredMonitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-4" />
              <p className="font-semibold">
                {monitorSearchTerm ? 'No Monitors Found' : 'No Monitors Yet'}
              </p>
              <p className="text-sm">
                {monitorSearchTerm
                  ? `No monitors match your search for "${monitorSearchTerm}". Try a different term or clear the search.`
                  : 'Create monitors to keep an eye on your systems.'}
              </p>
              {!monitorSearchTerm && (
                <Button onClick={handleOpenCreateModal} disabled={isSubmitting} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Monitor
                </Button>
              )}
            </div>
          ) : (
            <MonitorTable 
              monitors={filteredMonitors} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDelete}
              disabled={isSubmitting}
            />
          )}
        </CardContent>
        {!isLoading && !error && filteredMonitors.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground">
            Showing {filteredMonitors.length} of {monitors.length} monitors.
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
    
