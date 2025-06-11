
"use client";

import type { Procedure, ScriptType } from '@/types';
import { scriptTypes } from '@/lib/mockData'; // scriptTypes can remain from mockData as it's static
import { fetchProcedures, createProcedure, updateProcedure, deleteProcedure } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Play, FileCode, Eye, ListFilter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<Procedure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [procedureName, setProcedureName] = useState('');
  const [procedureDescription, setProcedureDescription] = useState('');
  const [procedureScriptType, setProcedureScriptType] = useState<ScriptType>('CMD');
  const [procedureScriptContent, setProcedureScriptContent] = useState('');

  const loadProcedures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProcedures = await fetchProcedures();
      setProcedures(fetchedProcedures);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load procedures.';
      setError(errorMessage);
      toast({ title: "Error Loading Procedures", description: errorMessage, variant: "destructive" });
      setProcedures([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  const resetForm = () => {
    setProcedureName('');
    setProcedureDescription('');
    setProcedureScriptType('CMD');
    setProcedureScriptContent('');
    setCurrentProcedure(null);
    setIsEditMode(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setCurrentProcedure(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (procedure: Procedure) => {
    resetForm();
    setIsEditMode(true);
    setCurrentProcedure(procedure);
    setProcedureName(procedure.name);
    setProcedureDescription(procedure.description);
    setProcedureScriptType(procedure.scriptType);
    setProcedureScriptContent(procedure.scriptContent);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!procedureName.trim() || !procedureScriptContent.trim()) {
        toast({ title: "Validation Error", description: "Procedure Name and Script Content are required.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode && currentProcedure) {
        const updatedData = {
          name: procedureName,
          description: procedureDescription,
          scriptType: procedureScriptType,
          scriptContent: procedureScriptContent,
          // updatedAt will be set by the API
        };
        await updateProcedure(currentProcedure.id, updatedData);
        toast({title: "Success", description: `Procedure "${procedureName}" updated.`});
      } else {
        const newProcedureData = {
          name: procedureName,
          description: procedureDescription,
          scriptType: procedureScriptType,
          scriptContent: procedureScriptContent,
          // createdAt and updatedAt will be set by the API
        };
        await createProcedure(newProcedureData);
        toast({title: "Success", description: `Procedure "${procedureName}" created.`});
      }
      resetForm();
      setIsModalOpen(false);
      loadProcedures(); // Refresh the list
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast({title: isEditMode ? "Error Updating Procedure" : "Error Creating Procedure", description: errorMessage, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (procedureId: string, procedureNameText: string) => {
    if (!window.confirm(`Are you sure you want to delete procedure "${procedureNameText}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true); // Disable buttons during delete
    try {
        await deleteProcedure(procedureId);
        toast({title: "Success", description: `Procedure "${procedureNameText}" deleted.`});
        loadProcedures(); // Refresh the list
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast({title: "Error Deleting Procedure", description: errorMessage, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };

  const ProcedureFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} className="col-span-3" disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Textarea id="description" value={procedureDescription} onChange={(e) => setProcedureDescription(e.target.value)} className="col-span-3" disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="scriptType" className="text-right">Script Type</Label>
        <Select value={procedureScriptType} onValueChange={(value: ScriptType) => setProcedureScriptType(value)} disabled={isSubmitting}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select script type" />
          </SelectTrigger>
          <SelectContent>
            {scriptTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="scriptContent" className="text-right pt-2">Script Content</Label>
        <Textarea
          id="scriptContent"
          value={procedureScriptContent}
          onChange={(e) => setProcedureScriptContent(e.target.value)}
          className="col-span-3 font-code"
          rows={10}
          placeholder={`Enter ${procedureScriptType} script here...`}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-3/4" /> <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full mt-1" />
              </CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Skeleton className="h-9 w-20" /> <Skeleton className="h-9 w-20" /> <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
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
        <Button onClick={loadProcedures} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Procedures</h1>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <ListFilter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {scriptTypes.map(type => (
                        <DropdownMenuItem key={type} onSelect={() => { /* TODO: Implement client-side filter or API filter param */ }}>{type}</DropdownMenuItem>
                    ))}
                     <DropdownMenuItem onSelect={() => { /* TODO: Implement filter */ }}>All</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleOpenCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Procedure
            </Button>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Procedure' : 'Create New Procedure'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your existing procedure.' : 'Define a new script or set of commands to run on managed computers.'}
            </DialogDescription>
          </DialogHeader>
          {ProcedureFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (!isSubmitting) { setIsModalOpen(false); resetForm(); } }} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Procedure')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {procedures.length === 0 && !isLoading ? (
         <Card className="text-center py-10">
            <CardHeader>
                <FileCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Procedures Yet</CardTitle>
                <CardDescription>Create procedures to automate tasks on your computers. Use the button above to get started.</CardDescription>
            </CardHeader>
             <CardContent>
                 <Button onClick={handleOpenCreateModal}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Procedure
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {procedures.map((procedure) => (
            <Card key={procedure.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate max-w-[80%]">{procedure.name}</CardTitle>
                  <Badge variant="secondary">{procedure.scriptType}</Badge>
                </div>
                <CardDescription className="h-10 overflow-hidden text-ellipsis">{procedure.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(procedure.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(procedure.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                 <Button variant="ghost" size="sm" asChild>
                    <Link href={`/procedures/${procedure.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(procedure)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                 </Button>
                 <Button variant="destructive" size="sm" onClick={() => handleDelete(procedure.id, procedure.name)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
