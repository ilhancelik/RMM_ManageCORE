
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Monitor, ScriptType, AiSettings, CustomIntervalUnit } from '@/types';
import { scriptTypes, addMonitorToMock, getAiSettings } from '@/lib/mockData';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';
import { useLicense } from '@/contexts/LicenseContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2, Sparkles, Bot, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const intervalUnits: CustomIntervalUnit[] = ['minutes', 'hours', 'days'];

const initialFormState: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  scriptType: 'PowerShell',
  scriptContent: '',
  defaultIntervalValue: 5,
  defaultIntervalUnit: 'minutes',
  sendEmailOnAlert: true,
};

export default function NewMonitorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPendingAI, startAITransition] = useTransition();
  const { isLicenseValid, isLoadingLicense } = useLicense();

  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [showAiSection, setShowAiSection] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAiSettings(getAiSettings());
    } catch (e) {
      toast({ title: "Error loading AI settings", description: (e as Error).message, variant: "destructive"});
    }
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ 
        ...prev, 
        [name]: name === 'defaultIntervalValue' ? (parseInt(value) || 1) : value 
    }));
  };

  const handleCheckboxChange = (name: 'sendEmailOnAlert', checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: 'scriptType' | 'defaultIntervalUnit', value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "Cannot create monitors with an invalid license.", variant: "destructive" });
        return;
    }
    if (!formState.name.trim() || !formState.scriptContent.trim() || formState.defaultIntervalValue <= 0) {
      toast({ title: "Validation Error", description: "Name, script content, and a valid interval are required.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    try {
      addMonitorToMock(formState);
      toast({title: "Success", description: `Monitor "${formState.name}" created (Mock).`});
      setTimeout(() => {
        setIsSubmitting(false);
        router.push('/monitors');
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Creating Monitor", description: errorMessage, variant: "destructive"});
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
        scriptType: formState.scriptType,
        context: `This script is for a system monitoring task. It should output 'OK:' for normal status or 'ALERT:' for an alert condition, followed by a brief message. Target OS is likely Windows. Ensure the script is safe and follows best practices for ${formState.scriptType}.`,
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

  if (isLoadingLicense) {
     return (
        <div className="container mx-auto py-2">
            <Skeleton className="h-10 w-40 mb-6" />
            <Card><CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading...</p></div>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.push('/monitors')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Monitors
      </Button>

      {!isLicenseValid && (
         <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>License Invalid</AlertTitle>
            <AlertDescription>
                Your system license is not valid. Monitor creation is disabled. Please check your <Link href="/system-license" className="underline">System License</Link>.
            </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Monitor</CardTitle>
          <CardDescription>Define the details for your new system monitor (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="name">Monitor Name</Label>
                <Input id="name" name="name" value={formState.name} onChange={handleInputChange} disabled={isSubmitting || !isLicenseValid}/>
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formState.description} onChange={handleInputChange} disabled={isSubmitting || !isLicenseValid} rows={3}/>
            </div>
            
            <div>
                <Label htmlFor="scriptType">Script Type</Label>
                <Select name="scriptType" value={formState.scriptType} onValueChange={(value) => handleSelectChange('scriptType', value as ScriptType)} disabled={isSubmitting || isGeneratingWithAi || !isLicenseValid}>
                <SelectTrigger><SelectValue placeholder="Select script type" /></SelectTrigger>
                <SelectContent>
                    {scriptTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="scriptContent">Script Content</Label>
                <Textarea
                id="scriptContent"
                name="scriptContent"
                value={formState.scriptContent}
                onChange={handleInputChange}
                placeholder={`Enter ${formState.scriptType} script. Script should output 'OK:' or 'ALERT:' prefix.`}
                rows={15}
                className="font-code"
                disabled={isSubmitting || !isLicenseValid}
                />
            </div>
            <Separator />
            <div className="space-y-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAiSection(!showAiSection)}
                    disabled={isSubmitting || !aiSettings?.globalGenerationEnabled || !aiSettings.providerConfigs.some(p => p.isEnabled) || !isLicenseValid}
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
                                Describe the condition to monitor. The AI will try to generate a {formState.scriptType} script that outputs "OK: ..." or "ALERT: ...".
                                <strong className="block mt-1">Always review AI-generated scripts carefully before use.</strong>
                            </AlertDescription>
                        </Alert>
                        <div>
                            <Label htmlFor="aiPrompt">Describe the monitoring condition:</Label>
                            <Textarea
                                id="aiPrompt"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder={`e.g., "Check if CPU usage is above 80%", "Verify if 'PrintSpooler' service is running"`}
                                rows={3}
                                disabled={isGeneratingWithAi || isPendingAI || !isLicenseValid}
                            />
                        </div>
                        <Button type="button" onClick={handleGenerateWithAI} disabled={isGeneratingWithAi || isPendingAI || !aiPrompt.trim() || isSubmitting || !isLicenseValid}>
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
                                <Button type="button" size="sm" variant="outline" onClick={() => {setFormState(prev => ({...prev, scriptContent: aiGeneratedScript })); toast({title: "Script Copied", description: "AI generated script copied to script content field."})}} disabled={!isLicenseValid}>
                                    Use this Script
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                    <Label htmlFor="defaultIntervalValue">Default Check Interval</Label>
                    <Input id="defaultIntervalValue" name="defaultIntervalValue" type="number" min="1" value={formState.defaultIntervalValue} onChange={handleInputChange} placeholder="e.g., 5" disabled={isSubmitting || !isLicenseValid}/>
                </div>
                <div>
                    <Label htmlFor="defaultIntervalUnit">Interval Unit</Label>
                    <Select name="defaultIntervalUnit" value={formState.defaultIntervalUnit} onValueChange={(value) => handleSelectChange('defaultIntervalUnit', value as CustomIntervalUnit)} disabled={isSubmitting || !isLicenseValid}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {intervalUnits.map(unit => (<SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="sendEmailOnAlert" name="sendEmailOnAlert" checked={formState.sendEmailOnAlert} onCheckedChange={(checked) => handleCheckboxChange('sendEmailOnAlert', !!checked)} disabled={isSubmitting || !isLicenseValid}/>
                <Label htmlFor="sendEmailOnAlert" className="font-normal">Send email notification on alert</Label>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/monitors')} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !isLicenseValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" /> }
                {isSubmitting ? 'Creating...' : 'Create Monitor'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
