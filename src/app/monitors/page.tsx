
"use client";

import type { Monitor, ScriptType } from '@/types';
import { mockMonitors, scriptTypes, addMonitor, updateMonitor, deleteMonitor } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Activity, Eye, ListFilter, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const intervalUnits: Monitor['defaultIntervalUnit'][] = ['minutes', 'hours', 'days'];

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setMonitors([...mockMonitors]);
  }, []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMonitor, setCurrentMonitor] = useState<Monitor | null>(null);

  // Form state
  const [monitorName, setMonitorName] = useState('');
  const [monitorDescription, setMonitorDescription] = useState('');
  const [monitorScriptType, setMonitorScriptType] = useState<ScriptType>('PowerShell');
  const [monitorScriptContent, setMonitorScriptContent] = useState('');
  const [monitorIntervalValue, setMonitorIntervalValue] = useState<number>(5);
  const [monitorIntervalUnit, setMonitorIntervalUnit] = useState<Monitor['defaultIntervalUnit']>('minutes');
  const [monitorSendEmail, setMonitorSendEmail] = useState(true);

  const resetForm = () => {
    setMonitorName('');
    setMonitorDescription('');
    setMonitorScriptType('PowerShell');
    setMonitorScriptContent('');
    setMonitorIntervalValue(5);
    setMonitorIntervalUnit('minutes');
    setMonitorSendEmail(true);
    setCurrentMonitor(null);
    setIsEditMode(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (monitor: Monitor) => {
    resetForm();
    setIsEditMode(true);
    setCurrentMonitor(monitor);
    setMonitorName(monitor.name);
    setMonitorDescription(monitor.description);
    setMonitorScriptType(monitor.scriptType);
    setMonitorScriptContent(monitor.scriptContent);
    setMonitorIntervalValue(monitor.defaultIntervalValue);
    setMonitorIntervalUnit(monitor.defaultIntervalUnit);
    setMonitorSendEmail(monitor.sendEmailOnAlert);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!monitorName.trim() || !monitorScriptContent.trim() || monitorIntervalValue <= 0) {
      toast({ title: "Error", description: "Name, script content, and a valid interval are required.", variant: "destructive"});
      return;
    }

    if (isEditMode && currentMonitor) {
      const updatedMonitorData: Monitor = {
        ...currentMonitor,
        name: monitorName,
        description: monitorDescription,
        scriptType: monitorScriptType,
        scriptContent: monitorScriptContent,
        defaultIntervalValue: monitorIntervalValue,
        defaultIntervalUnit: monitorIntervalUnit,
        sendEmailOnAlert: monitorSendEmail,
        updatedAt: new Date().toISOString(),
      };
      updateMonitor(updatedMonitorData);
      setMonitors(mockMonitors.map(m => m.id === currentMonitor.id ? updatedMonitorData : m));
      toast({title: "Success", description: `Monitor "${updatedMonitorData.name}" updated.`});
    } else {
      const newMonitorData = {
        name: monitorName,
        description: monitorDescription,
        scriptType: monitorScriptType,
        scriptContent: monitorScriptContent,
        defaultIntervalValue: monitorIntervalValue,
        defaultIntervalUnit: monitorIntervalUnit,
        sendEmailOnAlert: monitorSendEmail,
      };
      const newMonitor = addMonitor(newMonitorData);
      setMonitors(prev => [...prev, newMonitor]);
      toast({title: "Success", description: `Monitor "${newMonitor.name}" created.`});
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleDelete = (monitorId: string) => {
    const monitorToDelete = mockMonitors.find(m => m.id === monitorId);
    if (deleteMonitor(monitorId)) {
        setMonitors(currentMonitors => currentMonitors.filter(m => m.id !== monitorId));
        toast({title: "Success", description: `Monitor "${monitorToDelete?.name || 'N/A'}" deleted.`});
    } else {
        toast({title: "Error", description: "Failed to delete monitor.", variant: "destructive"});
    }
  };

  const MonitorFormFields = (
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorName" className="text-right">Name</Label>
        <Input id="monitorName" value={monitorName} onChange={(e) => setMonitorName(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorDescription" className="text-right">Description</Label>
        <Textarea id="monitorDescription" value={monitorDescription} onChange={(e) => setMonitorDescription(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorScriptType" className="text-right">Script Type</Label>
        <Select value={monitorScriptType} onValueChange={(value: ScriptType) => setMonitorScriptType(value)}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select script type" /></SelectTrigger>
          <SelectContent>
            {scriptTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="monitorScriptContent" className="text-right pt-2">Script Content</Label>
        <Textarea
          id="monitorScriptContent"
          value={monitorScriptContent}
          onChange={(e) => setMonitorScriptContent(e.target.value)}
          className="col-span-3 font-code"
          rows={8}
          placeholder={`Enter ${monitorScriptType} script. Script should output 'OK:' or 'ALERT:' prefix.`}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorIntervalValue" className="text-right">Default Interval</Label>
        <div className="col-span-3 grid grid-cols-2 gap-2">
            <Input id="monitorIntervalValue" type="number" value={monitorIntervalValue} onChange={(e) => setMonitorIntervalValue(Math.max(1, parseInt(e.target.value)))} placeholder="e.g., 5" />
            <Select value={monitorIntervalUnit} onValueChange={(value: Monitor['defaultIntervalUnit']) => setMonitorIntervalUnit(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    {intervalUnits.map(unit => (<SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>))}
                </SelectContent>
            </Select>
        </div>
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monitorSendEmail" className="text-right">Notifications</Label>
        <div className="col-span-3 flex items-center space-x-2">
            <Checkbox id="monitorSendEmail" checked={monitorSendEmail} onCheckedChange={(checked) => setMonitorSendEmail(!!checked)} />
            <Label htmlFor="monitorSendEmail" className="font-normal">Send email notification on alert</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Monitors</h1>
        <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Monitor
        </Button>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Monitor' : 'Create New Monitor'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your existing monitor.' : 'Define a new script to monitor system status or events.'}
            </DialogDescription>
          </DialogHeader>
          {MonitorFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Monitor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {monitors.length === 0 ? (
         <Card className="text-center py-10">
            <CardHeader>
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Monitors Yet</CardTitle>
                <CardDescription>Create monitors to keep an eye on your systems.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleOpenCreateModal}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Monitor
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitors.map((monitor) => (
            <Card key={monitor.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate max-w-[70%]">{monitor.name}</CardTitle>
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary">{monitor.scriptType}</Badge>
                    {monitor.sendEmailOnAlert ? (
                      <Badge variant="default" className="mt-1 bg-blue-500 hover:bg-blue-600">Email Active</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1">Email Off</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="h-10 overflow-hidden text-ellipsis">{monitor.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Default Interval: Every {monitor.defaultIntervalValue} {monitor.defaultIntervalUnit}
                </p>
                 <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(monitor.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(monitor.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                 {/* Placeholder for future View Details link if a monitor detail page is created */}
                 {/* <Button variant="ghost" size="sm" asChild>
                    <Link href={`/monitors/${monitor.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                 </Button> */}
                 <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(monitor)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                 </Button>
                 <Button variant="destructive" size="sm" onClick={() => handleDelete(monitor.id)}>
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
