
"use client";

import { useParams, useRouter } from 'next/navigation';
import { getComputerById, getExecutions, getProcedureById } from '@/lib/mockData'; 
import type { Computer, ProcedureExecution } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Terminal, ListChecks, Edit, Trash2, Loader2, Smartphone, Wifi, Server, Settings, Globe, Fingerprint, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';


export default function ComputerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [computer, setComputer] = useState<Computer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedExecutions, setRelatedExecutions] = useState<ProcedureExecution[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);

  const loadComputerDetails = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setIsLoadingExecutions(true);

    setTimeout(() => {
      try {
        const fetchedComputer = getComputerById(id);
        setComputer(fetchedComputer || null);
        if (fetchedComputer) {
          const executions = getExecutions({ computerId: id });
          setRelatedExecutions(executions);
        } else {
          setError('Computer not found in mock data.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load computer details from mock.';
        setError(errorMessage);
        toast({
          title: "Error Loading Computer Data (Mock)",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsLoadingExecutions(false);
      }
    }, 300);
  }, [id, toast]);

  useEffect(() => {
    loadComputerDetails();
  }, [loadComputerDetails]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <Skeleton className="h-10 w-32 mb-6" />
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-6 w-1/2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
         <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading computer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-destructive">{error} <Button onClick={() => router.back()} variant="link">Go Back</Button></div>;
  }
  
  if (!computer) {
     return <div className="container mx-auto py-10 text-center">Computer not found. <Button onClick={() => router.back()} variant="link">Go Back</Button></div>;
  }


  const getStatusBadgeVariant = (status: Computer['status']) => {
    switch (status) {
      case 'Online': return 'bg-green-500 hover:bg-green-600';
      case 'Offline': return 'bg-red-500 hover:bg-red-600';
      case 'Error': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'secondary';
    }
  };
  
  const getProcedureName = (procedureId: string): string => {
    return getProcedureById(procedureId)?.name || 'Unknown Procedure';
  };

  const DetailItem = ({ icon, label, value }: { icon?: React.ElementType, label: string, value?: string | number | null }) => {
    const IconComponent = icon;
    return (
        <div className="flex items-start space-x-2">
            {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />}
            <div>
                <Label className="text-sm text-muted-foreground">{label}</Label>
                <p className="font-semibold break-all">{value || 'N/A'}</p>
            </div>
        </div>
    );
  };


  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Computers
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-3xl font-bold flex items-center">
                {computer.name} 
                <Badge variant="default" className={`${getStatusBadgeVariant(computer.status)} ml-3 text-sm`}>{computer.status}</Badge>
              </CardTitle>
              <CardDescription>Details for {computer.name} (Mock Data)</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/commands?computerId=${computer.id}`)} disabled={computer.status !== 'Online'}>
                    <Terminal className="mr-2 h-4 w-4" /> Run Command
                </Button>
                <Button variant="outline" size="sm" disabled>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                 <Button variant="destructive" size="sm" disabled>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <DetailItem icon={Settings} label="Operating System" value={computer.os} />
                <DetailItem icon={Server} label="LAN IP Address" value={computer.ipAddress} />
                <DetailItem icon={Globe} label="Public IP Address" value={computer.publicIpAddress} />
                <DetailItem icon={Smartphone} label="LAN MAC Address" value={computer.macAddressLan} />
                <DetailItem icon={Wifi} label="WiFi MAC Address" value={computer.macAddressWifi} />
                <DetailItem icon={Info} label="Last Seen" value={new Date(computer.lastSeen).toLocaleString()} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                 <DetailItem icon={Info} label="Model" value={computer.model} />
                 <DetailItem icon={Cpu} label="Processor" value={computer.processor} />
                 <DetailItem icon={MemoryStick} label="RAM Size" value={computer.ramSize} />
                 <DetailItem icon={HardDrive} label="Storage" value={computer.storage} />
                 <DetailItem icon={Settings} label="Graphics Card" value={computer.graphicsCard} />
                 <DetailItem icon={Fingerprint} label="Serial Number" value={computer.serialNumber} />
            </div>
            
            <CardTitle className="text-xl font-semibold mb-3 mt-6 pt-4 border-t">Resource Usage</CardTitle>
             <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Cpu className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-sm font-medium w-24">CPU Usage:</span>
                  {computer.cpuUsage !== undefined ? (
                    <>
                      <Progress value={computer.cpuUsage} className="flex-1 mx-2 h-2.5" /> 
                      <span>{computer.cpuUsage}%</span>
                    </>
                  ): <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
                </div>
                <div className="flex items-center">
                  <MemoryStick className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-sm font-medium w-24">RAM Usage:</span>
                  {computer.ramUsage !== undefined ? (
                    <>
                      <Progress value={computer.ramUsage} className="flex-1 mx-2 h-2.5" />
                      <span>{computer.ramUsage}%</span>
                    </>
                  ) : <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
                </div>
                <div className="flex items-center">
                  <HardDrive className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-sm font-medium w-24">Disk Usage:</span>
                  {computer.diskUsage !== undefined ? (
                    <>
                      <Progress value={computer.diskUsage} className="flex-1 mx-2 h-2.5" />
                      <span>{computer.diskUsage}%</span>
                    </>
                  ) : <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Procedure Executions - Mock)</CardTitle>
          <CardDescription>Procedures executed on this computer.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExecutions ? (
            <div className="space-y-2 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-center items-center pt-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading executions...</p>
                </div>
            </div>
          ) : relatedExecutions.length > 0 ? (
            <ScrollArea className="h-96">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {relatedExecutions.map((exec) => (
                    <TableRow key={exec.id}>
                        <TableCell className="font-medium">{getProcedureName(exec.procedureId)}</TableCell>
                        <TableCell>
                        <Badge variant={exec.status === 'Success' ? 'default' : exec.status === 'Failed' ? 'destructive': 'secondary'} 
                                className={exec.status === 'Success' ? 'bg-green-500 hover:bg-green-600' : exec.status === 'Failed' ? 'bg-red-500 hover:bg-red-600' : exec.status === 'Pending' || exec.status === 'Running' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                            {exec.status}
                        </Badge>
                        </TableCell>
                        <TableCell>{exec.startTime ? new Date(exec.startTime).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell>{exec.endTime ? new Date(exec.endTime).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/procedures/${exec.procedureId}?tab=execute`}>
                                <ListChecks className="mr-2 h-4 w-4" /> View Log
                            </Link>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent procedure executions for this computer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
