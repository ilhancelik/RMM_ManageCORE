
"use client";

import { useParams, useRouter } from 'next/navigation';
import { mockComputers, mockProcedures, mockProcedureExecutions } from '@/lib/mockData';
import type { Computer, Procedure, ProcedureExecution } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Play, Terminal, ListChecks, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default function ComputerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [computer, setComputer] = useState<Computer | null>(null);
  const [relatedExecutions, setRelatedExecutions] = useState<ProcedureExecution[]>([]);

  useEffect(() => {
    const foundComputer = mockComputers.find(c => c.id === id) || null;
    setComputer(foundComputer);
    if (foundComputer) {
      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_IN_MS;
      const recentExecutions = mockProcedureExecutions.filter(exec => {
        if (exec.computerId === foundComputer.id) {
          const execTime = new Date(exec.endTime || exec.startTime || 0).getTime();
          return execTime >= thirtyDaysAgo;
        }
        return false;
      }).sort((a,b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
      setRelatedExecutions(recentExecutions);
    }
  }, [id]);

  if (!computer) {
    return <div className="container mx-auto py-10 text-center">Computer not found.</div>;
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
    return mockProcedures.find(p => p.id === procedureId)?.name || 'Unknown Procedure';
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
              <CardDescription>Details for {computer.name}</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/commands?computerId=${computer.id}`)}>
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
          <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
          <CardDescription>Procedures executed on this computer.</CardDescription>
        </CardHeader>
        <CardContent>
          {relatedExecutions.length > 0 ? (
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
                             className={exec.status === 'Success' ? 'bg-green-500 hover:bg-green-600' : exec.status === 'Failed' ? 'bg-red-500 hover:bg-red-600' : ''}>
                        {exec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{exec.startTime ? new Date(exec.startTime).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{exec.endTime ? new Date(exec.endTime).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/procedures/${exec.procedureId}?executionId=${exec.id}`}>
                            <ListChecks className="mr-2 h-4 w-4" /> View Log
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No recent procedure executions for this computer in the last 30 days.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    