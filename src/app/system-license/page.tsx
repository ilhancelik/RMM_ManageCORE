
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSystemLicenseInfo, updateSystemLicenseKey, getComputers } from '@/lib/mockData';
import type { SystemLicenseInfo } from '@/types';
import { ShieldCheck, Save, Loader2, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';

const initialLicenseFormState: { licenseKey?: string } = {
  licenseKey: '',
};

export default function SystemLicensePage() {
  const { toast } = useToast();
  const [licenseInfo, setLicenseInfo] = useState<SystemLicenseInfo | null>(null);
  const [currentPcCount, setCurrentPcCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialLicenseFormState);

  const loadLicenseData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        const fetchedLicenseInfo = getSystemLicenseInfo();
        const fetchedComputers = getComputers();
        setLicenseInfo(fetchedLicenseInfo);
        setCurrentPcCount(fetchedComputers.length);
        setFormState({ // Keep form state minimal, reflecting current input
            licenseKey: fetchedLicenseInfo.licenseKey || '',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load license information.';
        setError(errorMessage);
        toast({ title: "Error Loading License Info", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadLicenseData();
  }, [loadLicenseData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.licenseKey?.trim()) {
      toast({ title: "Validation Error", description: "New License Key is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      updateSystemLicenseKey(formState.licenseKey);
      toast({
        title: 'Success!',
        description: 'System license information has been updated (Mock).',
      });
      loadLicenseData(); // Refresh data after update
      setFormState({ licenseKey: '' }); // Clear the input after successful submission
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: 'Error Updating License (Mock)',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };
  
  const getStatusAlert = () => {
    if (!licenseInfo) return null;

    switch (licenseInfo.status) {
      case 'Valid':
        return (
          <Alert variant="default" className="bg-green-50 border-green-300">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-700">License Valid</AlertTitle>
            <AlertDescription className="text-green-600">
              Your system license is active and valid.
            </AlertDescription>
          </Alert>
        );
      case 'Expired':
        return (
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle>License Expired</AlertTitle>
            <AlertDescription>
              Your system license has expired on {licenseInfo.expiryDate ? format(parseISO(licenseInfo.expiryDate), 'PPP') : 'N/A'}. Please renew your license.
            </AlertDescription>
          </Alert>
        );
      case 'ExceededLimit':
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>License Limit Exceeded</AlertTitle>
            <AlertDescription>
              You are currently managing {currentPcCount} computers, but your license only allows for {licenseInfo.licensedPcCount}. Please upgrade your license or remove computers.
            </AlertDescription>
          </Alert>
        );
      case 'NotActivated':
         return (
          <Alert variant="default" className="bg-yellow-50 border-yellow-300">
            <Info className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-700">License Not Activated</AlertTitle>
            <AlertDescription className="text-yellow-600">
              Please enter your license key to activate the software. Default limits may apply.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex items-center mb-6 gap-2">
          <Skeleton className="h-8 w-8" /> <Skeleton className="h-8 w-48" />
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader> <Skeleton className="h-6 w-1/2 mb-2" /> <Skeleton className="h-4 w-3/4" /> </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter> <Skeleton className="h-10 w-32" /> </CardFooter>
        </Card>
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading license information...</p></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-6 gap-2">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">System License</h1>
      </div>

      {error && (
         <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {getStatusAlert()}

      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>License Details</CardTitle>
          <CardDescription>View your current system license status and update your license key (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm text-muted-foreground">License Status</Label>
                    <p className="font-semibold text-lg">{licenseInfo?.status || 'N/A'}</p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">Managed / Licensed PCs</Label>
                    <p className="font-semibold text-lg">{currentPcCount} / {licenseInfo?.status !== 'NotActivated' ? (licenseInfo?.licensedPcCount || 'N/A') : 'N/A'}</p>
                </div>
            </div>
            <div>
                <Label className="text-sm text-muted-foreground">License Expiry Date</Label>
                <p className="font-semibold text-lg">
                    {licenseInfo?.status !== 'NotActivated' && licenseInfo?.expiryDate ? format(parseISO(licenseInfo.expiryDate), 'PPP') : 'N/A'}
                </p>
            </div>
             <div>
                <Label className="text-sm text-muted-foreground">Current License Key (Mock)</Label>
                <p className="font-semibold text-sm truncate">{licenseInfo?.licenseKey || 'Not Set'}</p>
            </div>
        </CardContent>
      </Card>

       <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Activate or Update License</CardTitle>
          <CardDescription>Enter your new license key details here. This is a mock activation.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="licenseKey">New License Key</Label>
              <Input id="licenseKey" name="licenseKey" value={formState.licenseKey || ''} onChange={handleInputChange} placeholder="Enter your license key" required disabled={isSubmitting} />
               <p className="text-xs text-muted-foreground mt-1">In a real system, PC count and expiry would be derived from the validated license key.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Processing...' : 'Activate / Update License'}
            </Button>
            <Button type="button" variant="link" disabled>
                Purchase/Renew License (External Link)
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
