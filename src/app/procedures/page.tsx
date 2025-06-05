
"use client";

import type { Procedure, ScriptType } from '@/types';
import { mockProcedures, scriptTypes } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Play, FileCode, Eye, Sparkles, ListFilter } from 'lucide-react';
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
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>(mockProcedures);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<Procedure | null>(null);

  const [procedureName, setProcedureName] = useState('');
  const [procedureDescription, setProcedureDescription] = useState('');
  const [procedureScriptType, setProcedureScriptType] = useState<ScriptType>('CMD');
  const [procedureScriptContent, setProcedureScriptContent] = useState('');

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

  const handleSubmit = () => {
    if (isEditMode && currentProcedure) {
      const updatedProcedure: Procedure = {
        ...currentProcedure,
        name: procedureName,
        description: procedureDescription,
        scriptType: procedureScriptType,
        scriptContent: procedureScriptContent,
        updatedAt: new Date().toISOString(),
      };
      setProcedures(procedures.map(p => p.id === currentProcedure.id ? updatedProcedure : p));
    } else {
      const newProcedure: Procedure = {
        id: `proc-${Date.now()}`,
        name: procedureName,
        description: procedureDescription,
        scriptType: procedureScriptType,
        scriptContent: procedureScriptContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProcedures([...procedures, newProcedure]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleDeleteProcedure = (procedureId: string) => {
    setProcedures(procedures.filter(p => p.id !== procedureId));
  };

  const ProcedureFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Textarea id="description" value={procedureDescription} onChange={(e) => setProcedureDescription(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="scriptType" className="text-right">Script Type</Label>
        <Select value={procedureScriptType} onValueChange={(value: ScriptType) => setProcedureScriptType(value)}>
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
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="scriptContent" className="text-right">Script Content</Label>
        <Textarea
          id="scriptContent"
          value={procedureScriptContent}
          onChange={(e) => setProcedureScriptContent(e.target.value)}
          className="col-span-3 font-code"
          rows={10}
          placeholder={`Enter ${procedureScriptType} script here...`}
        />
      </div>
    </div>
  );

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
                        <DropdownMenuItem key={type} onSelect={() => { /* TODO: Implement filter */ }}>{type}</DropdownMenuItem>
                    ))}
                     <DropdownMenuItem onSelect={() => { /* TODO: Implement filter */ }}>All</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleOpenCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Procedure
            </Button>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Procedure' : 'Create New Procedure'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your existing procedure.' : 'Define a new script or set of commands to run on managed computers.'}
            </DialogDescription>
          </DialogHeader>
          {ProcedureFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Procedure'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {procedures.length === 0 ? (
         <Card className="text-center py-10">
            <CardHeader>
                <FileCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Procedures Yet</CardTitle>
                <CardDescription>Create procedures to automate tasks on your computers.</CardDescription>
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
                 <Button variant="default" size="sm" asChild>
                    <Link href={`/procedures/${procedure.id}?tab=execute`}>
                        <Play className="mr-2 h-4 w-4" /> Run
                    </Link>
                 </Button>
                 {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/procedures/${procedure.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View/Execute
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditModal(procedure)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href={`/procedures/${procedure.id}?tab=improve`}>
                                <Sparkles className="mr-2 h-4 w-4" /> Improve (AI)
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProcedure(procedure.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
