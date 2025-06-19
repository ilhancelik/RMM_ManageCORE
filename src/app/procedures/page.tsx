
"use client";

import type { Procedure, ScriptType, AiSettings, ProcedureSystemType, WindowsUpdateScopeOptions } from '@/types';
import { scriptTypes, getProcedures, addProcedure, updateProcedureInMock, deleteProcedureFromMock, getAiSettings } from '@/lib/mockData';
import { generateScript, type GenerateScriptInput } from '@/ai/flows/generate-script-flow';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, FileCode, ListFilter, Loader2, Search, Sparkles, Bot, HardDrive, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/contexts/LicenseContext';

export default function ProceduresPage() {
  const router = useRouter();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLicenseValid, isLoadingLicense } = useLicense();


  const [filterType, setFilterType] = useState<ScriptType | 'All'>('All');
  const [filterSystemType, setFilterSystemType] = useState<ProcedureSystemType | 'All'>('All');
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');

  const loadInitialData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setProcedures(getProcedures());
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
    if (filterSystemType !== 'All') {
      results = results.filter(proc => proc.procedureSystemType === filterSystemType);
    }
    if (filterSystemType === 'CustomScript' && filterType !== 'All') {
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
  }, [procedures, filterType, filterSystemType, procedureSearchTerm]);


  const handleDelete = (procedureId: string, procedureNameText: string) => {
    if (!isLicenseValid) {
      toast({ title: "License Invalid", description: "Cannot delete procedures with an invalid license.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete procedure "${procedureNameText}"? This action cannot be undone.`)) {
        return;
    }
    // setIsSubmitting(true); // This state no longer exists here
    try {
        deleteProcedureFromMock(procedureId);
        toast({title: "Success", description: `Procedure "${procedureNameText}" deleted (Mock).`});
        setTimeout(() => {
          loadInitialData();
          // setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting Procedure", description: errorMessage, variant: "destructive"});
        // setIsSubmitting(false);
    }
  };


  if (isLoading || isLoadingLicense) {
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
                    <Button variant="outline" disabled={!isLicenseValid}>
                        <ListFilter className="mr-2 h-4 w-4" /> Filter ({filterSystemType === 'All' ? 'All Types' : filterSystemType}
                        {filterSystemType === 'CustomScript' && filterType !== 'All' && ` / ${filterType}`})
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by System Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setFilterSystemType('All')}>All System Types</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setFilterSystemType('CustomScript')}>Custom Script</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setFilterSystemType('WindowsUpdate')}>Windows Update</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setFilterSystemType('SoftwareUpdate')}>Software Update (winget)</DropdownMenuItem>

                    {filterSystemType === 'CustomScript' && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Filter Custom Script by Language</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setFilterType('All')}>All Languages</DropdownMenuItem>
                            {scriptTypes.map(type => (
                                <DropdownMenuItem key={type} onSelect={() => setFilterType(type)}>{type}</DropdownMenuItem>
                            ))}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button disabled={!isLicenseValid}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Procedure
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => router.push('/procedures/new?systemType=CustomScript')}>
                        <FileCode className="mr-2 h-4 w-4" /> Create Custom Script Procedure
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push('/procedures/new?systemType=WindowsUpdate')}>
                        <HardDrive className="mr-2 h-4 w-4" /> Create Windows Update Procedure
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push('/procedures/new?systemType=SoftwareUpdate')}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Create Software Update Procedure
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {!isLicenseValid && (
         <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>License Invalid</AlertTitle>
            <AlertDescription>
                Your system license is not valid. Procedure creation and management features are disabled. Please check your <Link href="/system-license" className="underline">System License</Link>.
            </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
            <CardTitle>
                {filterSystemType !== 'All' ? `${filterSystemType.replace(/([A-Z])/g, ' $1').trim()} Procedures` : 'All Procedures'}
                {filterSystemType === 'CustomScript' && filterType !== 'All' && ` (${filterType})`}
                {procedureSearchTerm && ` (Filtered by "${procedureSearchTerm}")`}
            </CardTitle>
            <CardDescription>
                {`View and manage procedures.`}
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
                        {procedureSearchTerm || filterType !== 'All' || filterSystemType !== 'All'
                        ? 'No Procedures Found'
                        : 'No Procedures Yet'}
                    </p>
                    <p className="text-sm">
                    {procedureSearchTerm || filterType !== 'All' || filterSystemType !== 'All'
                        ? `No procedures match your current criteria.`
                        : 'Create procedures to automate tasks on your computers.'}
                    </p>
                </div>
            ) : (
                <ProcedureTable
                    procedures={filteredProcedures}
                    onEdit={(procedure) => router.push(`/procedures/${procedure.id}`)}
                    onDelete={handleDelete}
                    disabled={!isLicenseValid}
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
    
