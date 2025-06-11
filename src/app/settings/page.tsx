
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getSmtpSettings, saveSmtpSettings, type SMTPSettings } from '@/lib/mockData';
import { Mail, Save } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SMTPSettings>({
    server: '',
    port: 587,
    username: '',
    password: '',
    secure: true,
    fromEmail: '',
    defaultToEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadedSettings = getSmtpSettings();
    if (loadedSettings) {
      setSettings(loadedSettings);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!settings.server || settings.port <= 0 || !settings.fromEmail || !settings.defaultToEmail) {
         toast({ title: "Error", description: "Server, Port, From Email, and Default To Email are required.", variant: "destructive" });
         setIsSubmitting(false);
         return;
      }
      saveSmtpSettings(settings);
      toast({
        title: 'Success!',
        description: 'SMTP settings have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-6 gap-2">
        <Mail className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Application Settings</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>Configure SMTP server settings for sending email notifications from monitors.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="server">SMTP Server</Label>
              <Input id="server" name="server" value={settings.server} onChange={handleChange} placeholder="e.g., smtp.gmail.com" required />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input id="port" name="port" type="number" value={settings.port} onChange={handleChange} placeholder="e.g., 587" required />
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox id="secure" name="secure" checked={settings.secure} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, secure: !!checked }))} />
              <Label htmlFor="secure" className="font-normal">Use TLS/SSL</Label>
            </div>
            <div>
              <Label htmlFor="username">Username (Optional)</Label>
              <Input id="username" name="username" value={settings.username || ''} onChange={handleChange} placeholder="e.g., user@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password (Optional)</Label>
              <Input id="password" name="password" type="password" value={settings.password || ''} onChange={handleChange} placeholder="Enter password if auth is required" />
            </div>
            <div>
              <Label htmlFor="fromEmail">From Email Address</Label>
              <Input id="fromEmail" name="fromEmail" type="email" value={settings.fromEmail} onChange={handleChange} placeholder="e.g., noreply@yourdomain.com" required />
            </div>
            <div>
              <Label htmlFor="defaultToEmail">Default Recipient Email</Label>
              <Input id="defaultToEmail" name="defaultToEmail" type="email" value={settings.defaultToEmail} onChange={handleChange} placeholder="e.g., admin@yourdomain.com" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save SMTP Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
