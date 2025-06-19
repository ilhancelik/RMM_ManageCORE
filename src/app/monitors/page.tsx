
"use client";

import type { Monitor, ScriptType, AiSettings } from '@/types';
import { scriptTypes, getMonitors, addMonitorToMock, updateMonitorInMock, deleteMonitorFromMock, getAiSettings } from '@/lib/mockData';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Activity, Loader2, Search, Sparkles, Bot } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MonitorTable } from '@/components/monitors/MonitorTable';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/contexts/LicenseContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';


export default function MonitorsPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLicenseValid, isLoadingLicense } = useLicense();

  const [monitorSearchTerm, setMonitorSearchTerm] = useState('');

  const loadInitialData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setMonitors(getMonitors());
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
  
  const handleDelete = (monitorId: string, monitorNameText: string) => {
    if (!isLicenseValid) {
      toast({ title: "License Invalid", description: "Cannot delete monitors with an invalid license.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete monitor "${monitorNameText}"? This action cannot be undone.`)) {
        return;
    }
    // setIsSubmitting(true); // This state no longer exists here
    try {
        deleteMonitorFromMock(monitorId);
        toast({title: "Success", description: `Monitor "${monitorNameText}" deleted (Mock).`});
        setTimeout(() => { 
          loadInitialData(); 
          // setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting Monitor", description: errorMessage, variant: "destructive"});
        // setIsSubmitting(false);
    }
  };


  if (isLoading || isLoadingLicense) {
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
          <Button onClick={() => router.push('/monitors/new')} disabled={!isLicenseValid}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Monitor
          </Button>
        </div>
      </div>

      {!isLicenseValid && (
         <Alert variant="destructive" className="mb-4">
            <Trash2 className="h-4 w-4" /> {/* Using Trash2 as placeholder for AlertTriangle */}
            <AlertTitle>License Invalid</AlertTitle>
            <AlertDescription>
                Your system license is not valid. Monitor creation and management features are disabled. Please check your <Link href="/system-license" className="underline">System License</Link>.
            </AlertDescription>
        </Alert>
      )}
      
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
                <Button onClick={() => router.push('/monitors/new')} disabled={!isLicenseValid} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Monitor
                </Button>
              )}
            </div>
          ) : (
            <MonitorTable 
              monitors={filteredMonitors} 
              onEdit={(monitor) => router.push(`/monitors/${monitor.id}`)} 
              onDelete={handleDelete}
              disabled={!isLicenseValid}
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
    
