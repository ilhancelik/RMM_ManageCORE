
"use client";

import { useParams, useRouter } from 'next/navigation';
import { fetchComputerById, fetchExecutions, fetchProcedures } from '@/lib/apiClient'; 
import type { Computer, Procedure, ProcedureExecution } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Play, Terminal, ListChecks, Edit, Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';


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
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]); // To map procedureId to name

  const loadComputerDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComputer = await fetchComputerById(id);
      setComputer(fetchedComputer);
      if (fetchedComputer) {
        // Fetch procedures to map names
        const procs = await fetchProcedures();
        setAllProcedures(procs);
        // Fetch executions for this computer
        setIsLoadingExecutions(true);
        const executions = await fetchExecutions({ computerId: id });
        setRelatedExecutions(executions); // API should return sorted and filtered (e.g., last 30 days)
      } else {
        setError('Computer not found.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load computer details.';
      setError(errorMessage);
      toast({
        title: "Error Loading Computer Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingExecutions(false);
    }
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
    return allProcedures.find(p => p.id === procedureId)?.name || 'Unknown Procedure';
  };

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Computers
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{computer.name}</CardTitle>
              <CardDescription>Details for {computer.name} (Data from API)</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/commands?computerId=${computer.id}`)} disabled={computer.status !== 'Online'}>
                    <Terminal className="mr-2 h-4 w-4" /> Run Command
                </Button>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                 <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="default" className={`${getStatusBadgeVariant(computer.status)} mb-2`}>{computer.status}</Badge>
            
            <p className="text-sm text-muted-foreground mt-2">Operating System</p>
            <p className="font-semibold">{computer.os}</p>

            <p className="text-sm text-muted-foreground mt-2">IP Address</p>
            <p className="font-semibold">{computer.ipAddress}</p>

            <p className="text-sm text-muted-foreground mt-2">Last Seen</p>
            <p className="font-semibold">{new Date(computer.lastSeen).toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Cpu className="mr-2 h-5 w-5 text-primary" />
              <span className="text-sm font-medium">CPU Usage:</span>
              {computer.cpuUsage !== undefined ? (
                <>
                  <Progress value={computer.cpuUsage} className="w-32 mx-2 h-2.5" /> 
                  <span>{computer.cpuUsage}%</span>
                </>
              ): <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
            </div>
            <div className="flex items-center mb-2">
              <MemoryStick className="mr-2 h-5 w-5 text-primary" />
              <span className="text-sm font-medium">RAM Usage:</span>
              {computer.ramUsage !== undefined ? (
                <>
                  <Progress value={computer.ramUsage} className="w-32 mx-2 h-2.5" />
                  <span>{computer.ramUsage}%</span>
                </>
              ) : <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
            </div>
            <div className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Disk Usage:</span>
              {computer.diskUsage !== undefined ? (
                <>
                  <Progress value={computer.diskUsage} className="w-32 mx-2 h-2.5" />
                  <span>{computer.diskUsage}%</span>
                </>
              ) : <span className="ml-2 text-sm text-muted-foreground">N/A</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Procedure Executions from API)</CardTitle>
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
