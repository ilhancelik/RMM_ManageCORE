
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Procedure, ScriptType, AiSettings, ProcedureSystemType, WindowsUpdateScopeOptions } from '@/types';
import { scriptTypes, addProcedure, getAiSettings } from '@/lib/mockData';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';
import { useLicense } from '@/contexts/LicenseContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2, Sparkles, Bot, FileCode, HardDrive, RefreshCw, Terminal } from 'lucide-react';
import Link from 'next/link';

const initialFormState = {
  name: '',
  description: '',
  scriptType: 'PowerShell' as ScriptType,
  scriptContent: '',
  runAsUser: false,
  wuIncludeOsUpdates: true,
  wuIncludeMicrosoftProductUpdates: true,
  wuIncludeFeatureUpdates: true,
  softwareUpdateMode: 'all' as 'all' | 'specific',
  specificSoftwareToUpdate: '',
};

export default function NewProcedurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPendingAI, startAITransition] = useTransition();
  const { isLicenseValid, isLoadingLicense } = useLicense();

  const [formState, setFormState] = useState(initialFormState);
  const [procedureSystemType, setProcedureSystemType] = useState<ProcedureSystemType>('CustomScript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [showAiSection, setShowAiSection] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const typeFromQuery = searchParams.get('systemType') as ProcedureSystemType | null;
    if (typeFromQuery && ['CustomScript', 'WindowsUpdate', 'SoftwareUpdate'].includes(typeFromQuery)) {
      setProcedureSystemType(typeFromQuery);
      if (typeFromQuery === 'WindowsUpdate') {
        setFormState(prev => ({...prev, name: 'Managed Windows Updates', description: 'Installs selected categories of Windows updates. Does not force reboot.'}));
      } else if (typeFromQuery === 'SoftwareUpdate') {
        setFormState(prev => ({...prev, name: '3rd Party Software Update Task', description: 'Updates 3rd party software using winget based on selected scope.'}));
      }
    }
    try {
      setAiSettings(getAiSettings());
    } catch (e) {
      toast({ title: "Error loading AI settings", description: (e as Error).message, variant: "destructive"});
    }
  }, [searchParams, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof typeof initialFormState, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: 'scriptType', value: ScriptType) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name: 'softwareUpdateMode', value: 'all' | 'specific') => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!isLicenseValid) {
        toast({ title: "License Invalid", description: "Cannot create procedures with an invalid license.", variant: "destructive" });
        return;
    }
    if (!formState.name.trim()) {
        toast({ title: "Validation Error", description: "Procedure Name is required.", variant: "destructive"});
        return;
    }
    if (procedureSystemType === 'CustomScript' && !formState.scriptContent.trim()) {
        toast({ title: "Validation Error", description: "Script Content is required for custom scripts.", variant: "destructive"});
        return;
    }
    if (procedureSystemType === 'SoftwareUpdate' && formState.softwareUpdateMode === 'specific' && !formState.specificSoftwareToUpdate.trim()) {
        toast({ title: "Validation Error", description: "Please specify software packages to update or choose 'Update all'.", variant: "destructive"});
        return;
    }
    if (procedureSystemType === 'WindowsUpdate' && !formState.wuIncludeOsUpdates && !formState.wuIncludeMicrosoftProductUpdates && !formState.wuIncludeFeatureUpdates) {
        toast({ title: "Validation Error", description: "Please select at least one Windows Update scope.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      const procData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'> & { procedureSystemType: ProcedureSystemType } = {
        name: formState.name,
        description: formState.description,
        procedureSystemType: procedureSystemType,
        scriptType: formState.scriptType,
        scriptContent: formState.scriptContent,
        runAsUser: formState.runAsUser,
        windowsUpdateScopeOptions: procedureSystemType === 'WindowsUpdate' ? {
            includeOsUpdates: formState.wuIncludeOsUpdates,
            includeMicrosoftProductUpdates: formState.wuIncludeMicrosoftProductUpdates,
            includeFeatureUpdates: formState.wuIncludeFeatureUpdates,
        } : undefined,
        softwareUpdateMode: procedureSystemType === 'SoftwareUpdate' ? formState.softwareUpdateMode : undefined,
        specificSoftwareToUpdate: procedureSystemType === 'SoftwareUpdate' ? formState.specificSoftwareToUpdate : undefined,
      };

      addProcedure(procData);
      toast({title: "Success", description: `Procedure "${formState.name}" created (Mock).`});
      setTimeout(() => {
        setIsSubmitting(false);
        router.push('/procedures');
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Creating Procedure", description: errorMessage, variant: "destructive"});
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
        context: `This script is for a system administration procedure. Target OS is likely Windows. Ensure the script is safe and follows best practices for ${formState.scriptType}.`,
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
  
  const getSystemProcedureInfoText = () => {
    if (procedureSystemType === 'WindowsUpdate') {
      const scopes = [];
      if (formState.wuIncludeOsUpdates) scopes.push("Windows Güncellemeleri (Güvenlik, Kalite vb.)");
      if (formState.wuIncludeMicrosoftProductUpdates) scopes.push("Microsoft Ürün Güncelleştirmeleri");
      if (formState.wuIncludeFeatureUpdates) scopes.push("Windows Özellik Güncelleştirmeleri");
      const scopeText = scopes.length > 0 ? scopes.join(', ') : "Hiçbir kapsam seçilmedi";
      return `Bu, Windows güncellemelerini yöneten bir sistem prosedürüdür. Seçilen Kapsamlar: ${scopeText}. Script içeriği ve çalıştırma bağlamı önceden tanımlanmıştır. Sistem otomatik olarak yeniden başlatılmaz.`;
    }
    if (procedureSystemType === 'SoftwareUpdate') {
      if (formState.softwareUpdateMode === 'all') {
        return "Bu, tüm uygun 3. parti yazılımları winget kullanarak güncelleyen bir sistem prosedürüdür. Script içeriği ve çalıştırma bağlamı önceden tanımlanmıştır.";
      } else {
        return `Bu, belirtilen ("${formState.specificSoftwareToUpdate || 'Hiçbiri'}") 3. parti yazılımları winget kullanarak güncelleyen bir sistem prosedürüdür. Script içeriği ve çalıştırma bağlamı önceden tanımlanmıştır.`;
      }
    }
    return "";
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
      <Button variant="outline" onClick={() => router.push('/procedures')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procedures
      </Button>

      {!isLicenseValid && (
         <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>License Invalid</AlertTitle>
            <AlertDescription>
                Your system license is not valid. Procedure creation is disabled. Please check your <Link href="/system-license" className="underline">System License</Link>.
            </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            Create New {procedureSystemType === 'CustomScript' ? 'Custom Script' : procedureSystemType === 'WindowsUpdate' ? 'Windows Update' : 'Software Update'} Procedure
          </CardTitle>
          <CardDescription>Define the details for your new procedure (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="name">Procedure Name</Label>
                <Input id="name" name="name" value={formState.name} onChange={handleInputChange} disabled={isSubmitting || !isLicenseValid} />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formState.description} onChange={handleInputChange} disabled={isSubmitting || !isLicenseValid} rows={3}/>
            </div>

            {procedureSystemType === 'WindowsUpdate' && (
                 <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                    <h4 className="font-medium flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary"/>Windows Update Scopes</h4>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="wuOsUpdates" name="wuIncludeOsUpdates" checked={formState.wuIncludeOsUpdates} onCheckedChange={(checked) => handleCheckboxChange('wuIncludeOsUpdates', !!checked)} disabled={isSubmitting || !isLicenseValid} />
                        <Label htmlFor="wuOsUpdates" className="font-normal">Windows Updates (Security, Quality, etc.)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="wuMsProductUpdates" name="wuIncludeMicrosoftProductUpdates" checked={formState.wuIncludeMicrosoftProductUpdates} onCheckedChange={(checked) => handleCheckboxChange('wuIncludeMicrosoftProductUpdates', !!checked)} disabled={isSubmitting || !isLicenseValid} />
                        <Label htmlFor="wuMsProductUpdates" className="font-normal">Microsoft Product Updates (Office, SQL, etc.)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="wuFeatureUpdates" name="wuIncludeFeatureUpdates" checked={formState.wuIncludeFeatureUpdates} onCheckedChange={(checked) => handleCheckboxChange('wuIncludeFeatureUpdates', !!checked)} disabled={isSubmitting || !isLicenseValid} />
                        <Label htmlFor="wuFeatureUpdates" className="font-normal">Windows Feature Updates (e.g., Version Upgrades)</Label>
                    </div>
                    <Alert variant="default" className="bg-background">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>System Managed</AlertTitle>
                        <AlertDescription>{getSystemProcedureInfoText()}</AlertDescription>
                    </Alert>
                </div>
            )}

            {procedureSystemType === 'SoftwareUpdate' && (
                <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                    <h4 className="font-medium flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary"/>Software Update (winget) Scope</h4>
                    <RadioGroup name="softwareUpdateMode" value={formState.softwareUpdateMode} onValueChange={(value: 'all' | 'specific') => handleRadioChange('softwareUpdateMode', value)} className="space-y-2" disabled={isSubmitting || !isLicenseValid}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="scope-su-all" />
                            <Label htmlFor="scope-su-all" className="font-normal">Update all applicable software</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific" id="scope-su-specific" />
                            <Label htmlFor="scope-su-specific" className="font-normal">Update specific software packages</Label>
                        </div>
                    </RadioGroup>
                    {formState.softwareUpdateMode === 'specific' && (
                        <div className="mt-3 space-y-1">
                            <Label htmlFor="specificSoftwareToUpdate">Software Package IDs or Names (comma-separated)</Label>
                            <Textarea
                                id="specificSoftwareToUpdate"
                                name="specificSoftwareToUpdate"
                                value={formState.specificSoftwareToUpdate}
                                onChange={handleInputChange}
                                placeholder="e.g., Mozilla.Firefox, 7zip.7zip"
                                rows={3}
                                disabled={isSubmitting || !isLicenseValid}
                            />
                             <p className="text-xs text-muted-foreground">Enter exact Winget package IDs or full names.</p>
                        </div>
                    )}
                    <Alert variant="default" className="bg-background">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>System Managed</AlertTitle>
                        <AlertDescription>{getSystemProcedureInfoText()}</AlertDescription>
                    </Alert>
                </div>
            )}
            
            {procedureSystemType === 'CustomScript' && (
                <>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="runAsUser" name="runAsUser" checked={formState.runAsUser} onCheckedChange={(checked) => handleCheckboxChange('runAsUser', !!checked)} disabled={isSubmitting || !isLicenseValid} />
                        <Label htmlFor="runAsUser" className="font-normal">Run as User (otherwise runs as SYSTEM)</Label>
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
                        placeholder={`Enter ${formState.scriptType} script here...`}
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
                                    <AlertTitle>AI Script Generation</AlertTitle>
                                    <AlertDescription>
                                        Describe what you want the script to do. The AI will attempt to generate a {formState.scriptType} script.
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
                </>
            )}

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/procedures')} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !isLicenseValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" /> }
                {isSubmitting ? 'Creating...' : 'Create Procedure'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
