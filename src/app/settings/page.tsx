
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { fetchSmtpSettings, saveSmtpSettingsToApi, type SMTPSettings } from '@/lib/apiClient';
import { Mail, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const initialSettingsState: SMTPSettings = {
  server: '',
  port: 587,
  username: '',
  password: '',
  secure: true,
  fromEmail: '',
  defaultToEmail: '',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SMTPSettings>(initialSettingsState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedSettings = await fetchSmtpSettings();
      if (loadedSettings) {
        setSettings(loadedSettings);
      } else {
        // If API returns null (e.g. no settings configured yet), keep initial state or defaults
        setSettings(initialSettingsState); 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load SMTP settings.';
      setError(errorMessage);
      toast({ title: "Error Loading Settings", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) || 0 : value),
    }));
  };
   const handleCheckboxChange = (name: keyof SMTPSettings, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (!settings.server || settings.port <= 0 || !settings.fromEmail || !settings.defaultToEmail) {
         toast({ title: "Error", description: "Server, Port, From Email, and Default To Email are required.", variant: "destructive" });
         setIsSubmitting(false);
         return;
      }
      await saveSmtpSettingsToApi(settings);
      toast({
        title: 'Success!',
        description: 'SMTP settings have been saved to the API.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving settings.';
      setError(errorMessage); // Display error near form if needed
      toast({
        title: 'Error saving settings',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex items-center mb-6 gap-2">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Application Settings</h1>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-5 w-1/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-36" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-6 gap-2">
        <Mail className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Application Settings</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>Configure SMTP server settings for sending email notifications from monitors. (Fetched from API)</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
            <div>
              <Label htmlFor="server">SMTP Server</Label>
              <Input id="server" name="server" value={settings.server} onChange={handleChange} placeholder="e.g., smtp.gmail.com" required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input id="port" name="port" type="number" value={settings.port} onChange={handleChange} placeholder="e.g., 587" required disabled={isSubmitting}/>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="secure" name="secure" checked={settings.secure} onCheckedChange={(checked) => handleCheckboxChange('secure', !!checked)} disabled={isSubmitting}/>
              <Label htmlFor="secure" className="font-normal">Use TLS/SSL</Label>
            </div>
            <div>
              <Label htmlFor="username">Username (Optional)</Label>
              <Input id="username" name="username" value={settings.username || ''} onChange={handleChange} placeholder="e.g., user@example.com" disabled={isSubmitting}/>
            </div>
            <div>
              <Label htmlFor="password">Password (Optional)</Label>
              <Input id="password" name="password" type="password" value={settings.password || ''} onChange={handleChange} placeholder="Enter password if auth is required" disabled={isSubmitting}/>
            </div>
            <div>
              <Label htmlFor="fromEmail">From Email Address</Label>
              <Input id="fromEmail" name="fromEmail" type="email" value={settings.fromEmail} onChange={handleChange} placeholder="e.g., noreply@yourdomain.com" required disabled={isSubmitting}/>
            </div>
            <div>
              <Label htmlFor="defaultToEmail">Default Recipient Email</Label>
              <Input id="defaultToEmail" name="defaultToEmail" type="email" value={settings.defaultToEmail} onChange={handleChange} placeholder="e.g., admin@yourdomain.com" required disabled={isSubmitting}/>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Saving...' : 'Save SMTP Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
