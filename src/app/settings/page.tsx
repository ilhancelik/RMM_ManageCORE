

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSmtpSettings, saveSmtpSettings, type SMTPSettings, getAiSettings, saveAiSettings, type AiSettings } from '@/lib/mockData';
import { Mail, Save, Loader2, Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';

const initialSmtpSettingsState: SMTPSettings = {
  server: '',
  port: 587,
  username: '',
  password: '',
  secure: true,
  fromEmail: '',
  defaultToEmail: '',
};

const initialAiSettingsState: AiSettings = {
  scriptGenerationEnabled: true,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>(initialSmtpSettingsState);
  const [aiSettings, setAiSettings] = useState<AiSettings>(initialAiSettingsState);
  
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(true);
  const [isSubmittingSmtp, setIsSubmittingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState<string | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadMockSettings = useCallback(() => {
    setIsLoadingSmtp(true);
    setIsLoadingAi(true);
    setSmtpError(null);
    setAiError(null);
    
    setTimeout(() => {
      try {
        const loadedSmtpSettings = getSmtpSettings();
        setSmtpSettings(loadedSmtpSettings || initialSmtpSettingsState);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load SMTP settings from mock.';
        setSmtpError(errorMessage);
        toast({ title: "Error Loading SMTP Settings (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoadingSmtp(false);
      }

      try {
        const loadedAiSettings = getAiSettings();
        setAiSettings(loadedAiSettings || initialAiSettingsState);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load AI settings from mock.';
        setAiError(errorMessage);
        toast({ title: "Error Loading AI Settings (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoadingAi(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadMockSettings();
  }, [loadMockSettings]);

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSmtpSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) || 0 : value),
    }));
  };

   const handleSmtpCheckboxChange = (name: keyof SMTPSettings, checked: boolean) => {
    setSmtpSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSmtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSmtp(true);
    setSmtpError(null);
    try {
      if (!smtpSettings.server || smtpSettings.port <= 0 || !smtpSettings.fromEmail || !smtpSettings.defaultToEmail) {
         toast({ title: "Error", description: "Server, Port, From Email, and Default To Email are required for SMTP.", variant: "destructive" });
         setIsSubmittingSmtp(false);
         return;
      }
      saveSmtpSettings(smtpSettings);
      toast({
        title: 'Success!',
        description: 'SMTP settings have been saved to mock data.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving SMTP settings (Mock).';
      setSmtpError(errorMessage);
      toast({
        title: 'Error saving SMTP settings (Mock)',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSubmittingSmtp(false), 500); 
    }
  };

  const handleAiSettingChange = (name: keyof AiSettings, value: boolean) => {
    setAiSettings(prev => ({
        ...prev,
        [name]: value,
    }));
  };

  const handleAiSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAi(true);
    setAiError(null);
    try {
        saveAiSettings(aiSettings);
        toast({
            title: 'Success!',
            description: 'AI settings have been saved to mock data.',
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving AI settings (Mock).';
        setAiError(errorMessage);
        toast({
            title: 'Error saving AI settings (Mock)',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setTimeout(() => setIsSubmittingAi(false), 500);
    }
  };


  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-6 gap-2">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Application Settings</h1>
      </div>

      <Card className="max-w-2xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/>SMTP Configuration</CardTitle>
          <CardDescription>Configure SMTP server settings for sending email notifications from monitors (Mock Data).</CardDescription>
        </CardHeader>
        {isLoadingSmtp ? (
            <CardContent className="space-y-6 pt-2">
                {[...Array(6)].map((_, i) => (
                <div key={`smtp-skel-${i}`} className="space-y-1.5">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                ))}
            </CardContent>
        ) : (
            <form onSubmit={handleSmtpSubmit}>
            <CardContent className="space-y-4">
                {smtpError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{smtpError}</p>}
                <div>
                <Label htmlFor="server">SMTP Server</Label>
                <Input id="server" name="server" value={smtpSettings.server} onChange={handleSmtpChange} placeholder="e.g., smtp.example.com" required disabled={isSubmittingSmtp} />
                </div>
                <div>
                <Label htmlFor="port">Port</Label>
                <Input id="port" name="port" type="number" value={smtpSettings.port} onChange={handleSmtpChange} placeholder="e.g., 587" required disabled={isSubmittingSmtp}/>
                </div>
                <div className="flex items-center space-x-2">
                <Checkbox id="secure" name="secure" checked={smtpSettings.secure} onCheckedChange={(checked) => handleSmtpCheckboxChange('secure', !!checked)} disabled={isSubmittingSmtp}/>
                <Label htmlFor="secure" className="font-normal">Use TLS/SSL</Label>
                </div>
                <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input id="username" name="username" value={smtpSettings.username || ''} onChange={handleSmtpChange} placeholder="e.g., user@example.com" disabled={isSubmittingSmtp}/>
                </div>
                <div>
                <Label htmlFor="password">Password (Optional)</Label>
                <Input id="password" name="password" type="password" value={smtpSettings.password || ''} onChange={handleSmtpChange} placeholder="Enter password if auth is required" disabled={isSubmittingSmtp}/>
                </div>
                <div>
                <Label htmlFor="fromEmail">From Email Address</Label>
                <Input id="fromEmail" name="fromEmail" type="email" value={smtpSettings.fromEmail} onChange={handleSmtpChange} placeholder="e.g., noreply@yourdomain.com" required disabled={isSubmittingSmtp}/>
                </div>
                <div>
                <Label htmlFor="defaultToEmail">Default Recipient Email</Label>
                <Input id="defaultToEmail" name="defaultToEmail" type="email" value={smtpSettings.defaultToEmail} onChange={handleSmtpChange} placeholder="e.g., admin@yourdomain.com" required disabled={isSubmittingSmtp}/>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSubmittingSmtp || isLoadingSmtp}>
                {isSubmittingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmittingSmtp ? 'Saving...' : 'Save SMTP Settings'}
                </Button>
            </CardFooter>
            </form>
        )}
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Script Generation Settings</CardTitle>
            <CardDescription>Configure settings related to AI-powered script generation (Mock Data).</CardDescription>
        </CardHeader>
        {isLoadingAi ? (
            <CardContent className="space-y-6 pt-2">
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        ) : (
            <form onSubmit={handleAiSettingsSubmit}>
                <CardContent className="space-y-4">
                    {aiError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{aiError}</p>}
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="aiScriptGenerationEnabled" className="text-base">Enable AI Script Generation</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow the use of AI to generate script suggestions in Procedures and Monitors.
                            </p>
                        </div>
                        <Switch
                            id="aiScriptGenerationEnabled"
                            checked={aiSettings.scriptGenerationEnabled}
                            onCheckedChange={(checked) => handleAiSettingChange('scriptGenerationEnabled', checked)}
                            disabled={isSubmittingAi}
                        />
                    </div>
                    {/* Future AI settings (API key, model selection) can be added here */}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmittingAi || isLoadingAi}>
                        {isSubmittingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSubmittingAi ? 'Saving...' : 'Save AI Settings'}
                    </Button>
                </CardFooter>
            </form>
        )}
      </Card>
    </div>
  );
}

