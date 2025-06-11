
"use client"; // Add "use client" for useEffect and useState

import { ComputerTable } from '@/components/computers/ComputerTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchComputers } from '@/lib/apiClient'; // Import fetchComputers
import type { Computer, ProcedureExecution, MonitorExecutionLog } from '@/types'; // Assuming these types exist
import { BarChart, CircleDollarSign, Cpu, HardDrive, MemoryStick, Activity, ListChecks, PieChart, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'; // For Pie chart
import { mockProcedureExecutions, mockMonitorExecutionLogs } from '@/lib/mockData'; // Keep for now for other charts
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const PIE_COLORS = ['#16a34a', '#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Green, Red, Orange, Blue, Gray


export default function DashboardPage() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [computerError, setComputerError] = useState<string | null>(null);
  const { toast } = useToast();

  // For now, procedure executions and monitor logs are from mock data.
  // These would also be fetched from an API in a full implementation.
  const procedureExecutions: ProcedureExecution[] = mockProcedureExecutions;
  const monitorLogs: MonitorExecutionLog[] = mockMonitorExecutionLogs;


  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingComputers(true);
      setComputerError(null);
      try {
        const fetchedComputers = await fetchComputers();
        setComputers(fetchedComputers);
      } catch (err) {
        setComputerError(err instanceof Error ? err.message : 'Failed to load computers.');
        toast({
          title: "Error Loading Computers",
          description: err instanceof Error ? err.message : 'An unknown error occurred.',
          variant: "destructive",
        });
        setComputers([]);
      } finally {
        setIsLoadingComputers(false);
      }
    };
    loadInitialData();
  }, [toast]);

  const onlineComputers = useMemo(() => computers.filter(c => c.status === 'Online').length, [computers]);
  const offlineComputers = useMemo(() => computers.filter(c => c.status === 'Offline').length, [computers]);
  const errorComputers = useMemo(() => computers.filter(c => c.status === 'Error').length, [computers]);
  const totalComputers = useMemo(() => computers.length, [computers]);

  const procedureStatusData = useMemo(() => {
    const successCount = procedureExecutions.filter(e => e.status === 'Success').length;
    const failedCount = procedureExecutions.filter(e => e.status === 'Failed').length;
    const pendingCount = procedureExecutions.filter(e => e.status === 'Pending' || e.status === 'Running').length;
    
    const data = [];
    if (successCount > 0) data.push({ name: 'Successful', value: successCount, fill: PIE_COLORS[0] });
    if (failedCount > 0) data.push({ name: 'Failed', value: failedCount, fill: PIE_COLORS[1] });
    if (pendingCount > 0) data.push({ name: 'Pending/Running', value: pendingCount, fill: PIE_COLORS[3] });
    
    return data.length > 0 ? data : [{ name: 'No Data', value: 1, fill: PIE_COLORS[4] }];
  }, [procedureExecutions]);

  const recentMonitorAlertsCount = useMemo(() => {
    const thirtyDaysAgo = Date.now() - THIRTY_DAYS_IN_MS;
    return monitorLogs.filter(log => 
      (log.status === 'ALERT' || log.status === 'Error') && 
      new Date(log.timestamp).getTime() >= thirtyDaysAgo
    ).length;
  }, [monitorLogs]);

  const renderComputerCards = () => {
    if (isLoadingComputers) {
      return (
        <>
          {[...Array(4)].map((_, i) => (
            <Card key={`skel-comp-card-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/3" /> <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent> <Skeleton className="h-8 w-1/2" /> <Skeleton className="h-3 w-2/3 mt-1" /> </CardContent>
            </Card>
          ))}
        </>
      );
    }
    if (computerError) {
      return <Card className="md:col-span-4 text-center py-4"><CardContent className="text-destructive">{computerError}</CardContent></Card>;
    }
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Computers</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComputers}</div>
            <p className="text-xs text-muted-foreground">Managed devices from API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
             <span className="h-4 w-4 text-green-500"> <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg> </span>
          </CardHeader>
          <CardContent> <div className="text-2xl font-bold">{onlineComputers}</div> <p className="text-xs text-muted-foreground">Currently active</p> </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <span className="h-4 w-4 text-red-500"> <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg> </span>
          </CardHeader>
          <CardContent> <div className="text-2xl font-bold">{offlineComputers}</div> <p className="text-xs text-muted-foreground">Currently inactive</p> </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
             <span className="h-4 w-4 text-orange-500"> <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg> </span>
          </CardHeader>
          <CardContent> <div className="text-2xl font-bold">{errorComputers}</div> <p className="text-xs text-muted-foreground">Require attention</p> </CardContent>
        </Card>
      </>
    );
  };


  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Computer Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {renderComputerCards()}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks /> Procedure Status (Mock)</CardTitle>
            <CardDescription>Overall success/failure of procedure executions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {procedureExecutions.length === 0 ? (
               <p className="text-sm text-muted-foreground">No procedure execution data yet.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={procedureStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {procedureStatusData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} /> ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle /> Monitor Alerts (Last 30 Days - Mock)</CardTitle>
            <CardDescription>Total critical alerts from monitors.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-orange-500">{recentMonitorAlertsCount}</div>
            <p className="text-muted-foreground mt-2">Alerts Requiring Attention</p>
            {monitorLogs.length === 0 && <p className="text-xs text-muted-foreground mt-4">No monitor log data yet.</p>}
          </CardContent>
        </Card>
         <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity /> System Health (Mock)</CardTitle>
             <CardDescription>Average resource usage across online systems.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] space-y-4 pt-6">
            <div className="flex items-center">
              <Cpu className="mr-3 h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Avg. CPU Usage</p>
                <p className="text-xl font-bold">N/A</p> {/* TODO: Calculate from API data */}
              </div>
            </div>
             <div className="flex items-center">
              <MemoryStick className="mr-3 h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm font-medium">Avg. RAM Usage</p>
                <p className="text-xl font-bold">N/A</p> {/* TODO: Calculate from API data */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Managed Computers (from API)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingComputers ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
               <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading computers...</p>
              </div>
            </div>
          ) : computerError ? (
            <p className="text-center text-destructive py-8">{computerError}</p>
          ) : computers.length > 0 ? (
            <ComputerTable computers={computers} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No computers found. Ensure your API at {process.env.NEXT_PUBLIC_API_BASE_URL}/computers is running and returning data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
