
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
    getSmtpSettings, saveSmtpSettings, type SMTPSettings, 
    getAiSettings, saveAiSettings, type AiSettings, type AiProviderConfig 
} from '@/lib/mockData';
import { Mail, Save, Loader2, Bot, Settings as SettingsIcon, Trash2, Edit, PlusCircle, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

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
  globalGenerationEnabled: true,
  scriptGenerationEnabled: true, // Added this based on previous discussions, ensure it's in types if used
  providerConfigs: [],
};

const initialAiProviderConfigState: Omit<AiProviderConfig, 'id'> = {
  name: '',
  providerType: 'googleAI',
  apiKey: '',
  isEnabled: true,
  isDefault: false,
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

  const [isAiProviderModalOpen, setIsAiProviderModalOpen] = useState(false);
  const [currentAiProviderConfig, setCurrentAiProviderConfig] = useState<Partial<AiProviderConfig>>(initialAiProviderConfigState);
  const [isEditingAiProvider, setIsEditingAiProvider] = useState(false);

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
      } finally {
        setIsLoadingSmtp(false);
      }

      try {
        const loadedAiSettings = getAiSettings();
        setAiSettings(loadedAiSettings || initialAiSettingsState);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load AI settings from mock.';
        setAiError(errorMessage);
      } finally {
        setIsLoadingAi(false);
      }
    }, 300);
  }, []);

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

   const handleSmtpCheckboxChange = (name: keyof SMTPSettings, checkedValue: boolean) => {
    setSmtpSettings(prev => ({
      ...prev,
      [name]: checkedValue,
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

  const handleGlobalAiEnableChange = (checkedValue: boolean) => {
    setAiSettings(prev => ({...prev, globalGenerationEnabled: checkedValue, scriptGenerationEnabled: checkedValue }));
  };
  
  const handleAiProviderConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAiProviderConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAiProviderSwitchChange = (fieldName: keyof AiProviderConfig, checkedValue: boolean) => {
    setCurrentAiProviderConfig(prev => ({ ...prev, [fieldName]: checkedValue }));
  };
  
  const openAddAiProviderModal = () => {
    setCurrentAiProviderConfig({ ...initialAiProviderConfigState, isDefault: aiSettings.providerConfigs.length === 0 });
    setIsEditingAiProvider(false);
    setIsAiProviderModalOpen(true);
  };

  const openEditAiProviderModal = (config: AiProviderConfig) => {
    setCurrentAiProviderConfig({ ...config });
    setIsEditingAiProvider(true);
    setIsAiProviderModalOpen(true);
  };

  const handleSaveAiProviderConfig = () => {
    if (!currentAiProviderConfig.name?.trim()) {
      toast({ title: "Error", description: "Provider name is required.", variant: "destructive" });
      return;
    }

    let updatedProviders: AiProviderConfig[];
    const providerToSave: AiProviderConfig = {
        id: currentAiProviderConfig.id || `ai-provider-${Date.now()}`,
        name: currentAiProviderConfig.name || '',
        providerType: currentAiProviderConfig.providerType || 'googleAI',
        apiKey: currentAiProviderConfig.apiKey,
        isEnabled: !!currentAiProviderConfig.isEnabled,
        isDefault: !!currentAiProviderConfig.isDefault,
    };


    if (isEditingAiProvider && currentAiProviderConfig.id) {
      updatedProviders = aiSettings.providerConfigs.map(p => 
        p.id === currentAiProviderConfig.id ? providerToSave : p
      );
    } else {
      updatedProviders = [...aiSettings.providerConfigs, providerToSave];
    }
    
    if (providerToSave.isDefault) {
        updatedProviders = updatedProviders.map(p => 
            p.id === providerToSave.id ? p : { ...p, isDefault: false }
        );
    }

    const newSettings = { ...aiSettings, providerConfigs: updatedProviders };
    setAiSettings(newSettings); 
    saveAiSettings(newSettings); 
    
    toast({ title: "Success", description: `AI Provider configuration ${isEditingAiProvider ? 'updated' : 'added'}.` });
    setIsAiProviderModalOpen(false);
    loadMockSettings(); 
  };

  const handleDeleteAiProvider = (providerId: string) => {
    if (!window.confirm("Are you sure you want to delete this AI provider configuration?")) return;

    const updatedConfigs = aiSettings.providerConfigs.filter(p => p.id !== providerId);
    const newSettings = { ...aiSettings, providerConfigs: updatedConfigs };
    
    setAiSettings(newSettings);
    saveAiSettings(newSettings);
    
    toast({ title: "AI Provider Deleted", description: "Configuration removed." });
    loadMockSettings();
  };
  
  const handleSetDefaultAiProvider = (providerId: string) => {
      const updatedConfigs = aiSettings.providerConfigs.map(p => ({
          ...p,
          isDefault: p.id === providerId
      }));
      const newSettings = { ...aiSettings, providerConfigs: updatedConfigs };
      setAiSettings(newSettings);
      saveAiSettings(newSettings);
      toast({ title: "Default AI Provider Set", description: "Successfully updated the default provider." });
      loadMockSettings();
  };

  const handleToggleProviderEnabled = (providerId: string, newCheckedState: boolean) => {
    const updatedConfigs = aiSettings.providerConfigs.map(p =>
      p.id === providerId ? { ...p, isEnabled: newCheckedState } : p
    );
    const newSettings = { ...aiSettings, providerConfigs: updatedConfigs };
    setAiSettings(newSettings);
    saveAiSettings(newSettings); 
    toast({ title: "Provider Status Updated", description: `Provider ${newCheckedState ? 'enabled' : 'disabled'}.`});
    loadMockSettings();
  };


  const handleAiSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAi(true);
    setAiError(null);
    try {
        saveAiSettings(aiSettings);
        toast({
            title: 'Success!',
            description: 'Global AI settings have been saved to mock data.',
        });
        loadMockSettings(); 
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

  const canDeleteProvider = (provider: AiProviderConfig) => {
    if (provider.isDefault && aiSettings.providerConfigs.filter(p => p.isEnabled).length <= 1) {
      return false; 
    }
    return true;
  };


  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-6 gap-2">
        <SettingsIcon className="h-8 w-8 text-primary" />
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
                 <CardFooter><Skeleton className="h-10 w-36" /></CardFooter>
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
                <Checkbox id="secure" name="secure" checked={smtpSettings.secure} onCheckedChange={(checkedValue) => handleSmtpCheckboxChange('secure', !!checkedValue)} disabled={isSubmittingSmtp}/>
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
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Settings</CardTitle>
            <CardDescription>Configure global AI settings and manage AI provider configurations (Mock Data).</CardDescription>
        </CardHeader>
        {isLoadingAi ? (
            <CardContent className="space-y-6 pt-2">
                <div className="space-y-1.5"> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-10 w-full" /> </div>
                <Separator/>
                <div className="space-y-1.5"> <Skeleton className="h-6 w-1/3 mb-2" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full mt-2" /> </div>
                <CardFooter><Skeleton className="h-10 w-36" /></CardFooter>
            </CardContent>
        ) : (
            <form onSubmit={handleAiSettingsSubmit}>
                <CardContent className="space-y-6">
                    {aiError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{aiError}</p>}
                    
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="globalGenerationEnabled" className="text-base">Enable AI Script Generation (Global)</Label>
                            <p className="text-sm text-muted-foreground">
                                Master switch to enable or disable all AI script generation features.
                            </p>
                        </div>
                        <Switch
                            id="globalGenerationEnabled"
                            checked={aiSettings.globalGenerationEnabled}
                            onCheckedChange={handleGlobalAiEnableChange}
                            disabled={isSubmittingAi}
                        />
                    </div>

                    <Separator />

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium">AI Provider Configurations</h3>
                            <Button type="button" size="sm" variant="outline" onClick={openAddAiProviderModal} disabled={isSubmittingAi || !aiSettings.globalGenerationEnabled}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Provider
                            </Button>
                        </div>
                        {!aiSettings.globalGenerationEnabled && (
                             <p className="text-sm text-muted-foreground mb-3 p-3 bg-muted/50 rounded-md">Global AI generation is disabled. Enable it to manage or use providers.</p>
                        )}
                        {aiSettings.providerConfigs.length === 0 && aiSettings.globalGenerationEnabled && (
                            <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">No AI providers configured. Click 'Add Provider' to add one.</p>
                        )}
                        {aiSettings.providerConfigs.length > 0 && (
                            <div className="space-y-3">
                                {aiSettings.providerConfigs.map((provider) => (
                                    <Card key={provider.id} className={`p-4 ${!aiSettings.globalGenerationEnabled || !provider.isEnabled ? 'opacity-60' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold flex items-center">
                                                    {provider.name}
                                                    {provider.isDefault && <Star className="ml-2 h-4 w-4 text-yellow-500 fill-yellow-400" titleAccess='Default Provider'/>}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    API Key: {provider.apiKey ? `********${provider.apiKey.slice(-4)}` : <span className="italic">Not set (uses environment variable)</span>}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={provider.isEnabled}
                                                onCheckedChange={(newCheckedState) => handleToggleProviderEnabled(provider.id, newCheckedState)}
                                                disabled={isSubmittingAi || !aiSettings.globalGenerationEnabled || (provider.isDefault && provider.isEnabled && aiSettings.providerConfigs.filter(p=>p.isEnabled).length === 1)}
                                                title={provider.isEnabled ? "Disable Provider" : "Enable Provider"}
                                            />
                                        </div>
                                        <div className="mt-3 flex gap-2 justify-end">
                                            {!provider.isDefault && provider.isEnabled && aiSettings.globalGenerationEnabled && (
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleSetDefaultAiProvider(provider.id)} disabled={isSubmittingAi}>
                                                    Set as Default
                                                </Button>
                                            )}
                                            <Button type="button" variant="outline" size="sm" onClick={() => openEditAiProviderModal(provider)} disabled={isSubmittingAi || !aiSettings.globalGenerationEnabled}>
                                                <Edit className="mr-1.5 h-3 w-3" /> Edit
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => handleDeleteAiProvider(provider.id)} 
                                                disabled={isSubmittingAi || !canDeleteProvider(provider) || !aiSettings.globalGenerationEnabled}
                                                title={!canDeleteProvider(provider) ? "Cannot delete the only enabled default provider" : "Delete Provider"}
                                            >
                                                <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmittingAi || isLoadingAi}>
                        {isSubmittingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSubmittingAi ? 'Saving...' : 'Save Global AI Settings'}
                    </Button>
                </CardFooter>
            </form>
        )}
      </Card>

      <Dialog open={isAiProviderModalOpen} onOpenChange={setIsAiProviderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingAiProvider ? 'Edit AI Provider' : 'Add AI Provider'}</DialogTitle>
            <DialogDescription>
              {isEditingAiProvider ? 'Update the configuration for this AI provider.' : 'Add a new AI provider configuration.'}
              API Key is optional; if left blank, the system will attempt to use environment variables for Genkit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label htmlFor="providerName">Configuration Name</Label>
              <Input 
                id="providerName" 
                name="name" 
                value={currentAiProviderConfig.name || ''} 
                onChange={handleAiProviderConfigChange} 
                placeholder="e.g., My Google AI" 
              />
            </div>
             <div>
              <Label htmlFor="providerApiKey">API Key (Optional)</Label>
              <Input 
                id="providerApiKey" 
                name="apiKey" 
                type="password" 
                value={currentAiProviderConfig.apiKey || ''} 
                onChange={handleAiProviderConfigChange} 
                placeholder="Leave blank to use environment variable" 
              />
            </div>
            <div className="flex items-center space-x-2">
                <Switch 
                    id="providerIsEnabled"
                    checked={!!currentAiProviderConfig.isEnabled}
                    onCheckedChange={(checkedValue) => handleAiProviderSwitchChange('isEnabled', checkedValue)}
                />
                <Label htmlFor="providerIsEnabled" className="font-normal">Enable this configuration</Label>
            </div>
            {/* Only show "Set as default" if it can actually be set as default (i.e., it's enabled) */}
            {currentAiProviderConfig.isEnabled && (
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="providerIsDefault"
                        checked={!!currentAiProviderConfig.isDefault}
                        onCheckedChange={(checkedValue) => handleAiProviderSwitchChange('isDefault', !!checkedValue)}
                        disabled={
                            // If this is the only provider, it must be default if enabled
                            (aiSettings.providerConfigs.filter(p => p.isEnabled && p.id !== currentAiProviderConfig.id).length === 0 && !isEditingAiProvider) ||
                            // If editing and it's the only enabled provider
                            (isEditingAiProvider && currentAiProviderConfig.isEnabled && aiSettings.providerConfigs.filter(p => p.isEnabled).length === 1 && aiSettings.providerConfigs.find(p=>p.isEnabled)?.id === currentAiProviderConfig.id)
                        }

                    />
                    <Label htmlFor="providerIsDefault" className="font-normal">Set as default provider</Label>
                </div>
            )}
             {/* Inform user if this will become the default because it's the first enabled one */}
            {currentAiProviderConfig.isEnabled && aiSettings.providerConfigs.filter(p => p.isEnabled && p.id !== currentAiProviderConfig.id).length === 0 && !currentAiProviderConfig.isDefault && (
                 <p className="text-xs text-muted-foreground">This will be set as the default provider as it will be the only enabled one.</p>
            )}


          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiProviderModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAiProviderConfig}>
                {isSubmittingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    