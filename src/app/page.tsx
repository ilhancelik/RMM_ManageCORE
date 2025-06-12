
"use client"; 

import { ComputerTable } from '@/components/computers/ComputerTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getComputers, getExecutions, getMonitorLogs } from '@/lib/mockData'; 
import type { Computer, ProcedureExecution, MonitorExecutionLog } from '@/types'; 
import { Cpu, HardDrive, MemoryStick, Activity, ListChecks, PieChart, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const PIE_COLORS = ['#16a34a', '#ef4444', '#f97316', '#3b82f6', '#6b7280']; 


export default function DashboardPage() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(true);
  const [computerError, setComputerError] = useState<string | null>(null);
  const { toast } = useToast();

  const [procedureExecutions, setProcedureExecutions] = useState<ProcedureExecution[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);
  const [executionsError, setExecutionsError] = useState<string | null>(null);
  
  const [monitorLogs, setMonitorLogs] = useState<MonitorExecutionLog[]>([]);
  const [isLoadingMonitorLogs, setIsLoadingMonitorLogs] = useState(true);
  const [monitorLogsError, setMonitorLogsError] = useState<string | null>(null);


  const loadDashboardData = useCallback(() => {
    setIsLoadingComputers(true);
    setComputerError(null);
    setIsLoadingExecutions(true);
    setExecutionsError(null);
    setIsLoadingMonitorLogs(true);
    setMonitorLogsError(null);

    // Simulate data fetching delay for mock data
    setTimeout(() => {
      try {
        setComputers(getComputers());
        setProcedureExecutions(getExecutions());
        setMonitorLogs(getMonitorLogs());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data from mocks.';
        if (!computers.length && !computerError) setComputerError(errorMessage);
        if (!procedureExecutions.length && !executionsError) setExecutionsError(errorMessage);
        if (!monitorLogs.length && !monitorLogsError) setMonitorLogsError(errorMessage);
        
        toast({
          title: "Error Loading Dashboard Data (Mock)",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoadingComputers(false);
        setIsLoadingExecutions(false);
        setIsLoadingMonitorLogs(false);
      }
    }, 500); // 0.5 second delay
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); 

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onlineComputers = useMemo(() => computers.filter(c => c.status === 'Online').length, [computers]);
  const offlineComputers = useMemo(() => computers.filter(c => c.status === 'Offline').length, [computers]);
  const errorComputers = useMemo(() => computers.filter(c => c.status === 'Error').length, [computers]);
  const totalComputers = useMemo(() => computers.length, [computers]);

  const procedureStatusData = useMemo(() => {
    if (isLoadingExecutions && procedureExecutions.length === 0) return [{ name: 'Loading...', value: 1, fill: PIE_COLORS[4] }];
    if (executionsError && procedureExecutions.length === 0) return [{ name: 'Error', value: 1, fill: PIE_COLORS[1] }];
    
    const successCount = procedureExecutions.filter(e => e.status === 'Success').length;
    const failedCount = procedureExecutions.filter(e => e.status === 'Failed').length;
    const pendingCount = procedureExecutions.filter(e => e.status === 'Pending' || e.status === 'Running').length;
    
    const data = [];
    if (successCount > 0) data.push({ name: 'Successful', value: successCount, fill: PIE_COLORS[0] });
    if (failedCount > 0) data.push({ name: 'Failed', value: failedCount, fill: PIE_COLORS[1] });
    if (pendingCount > 0) data.push({ name: 'Pending/Running', value: pendingCount, fill: PIE_COLORS[3] });
    
    return data.length > 0 ? data : [{ name: 'No Data', value: 1, fill: PIE_COLORS[4] }];
  }, [procedureExecutions, isLoadingExecutions, executionsError]);

  const recentMonitorAlertsCount = useMemo(() => {
    if (isLoadingMonitorLogs && monitorLogs.length === 0) return 0;
    if (monitorLogsError) return 0; 

    const thirtyDaysAgo = Date.now() - THIRTY_DAYS_IN_MS;
    return monitorLogs.filter(log => 
      (log.status === 'ALERT' || log.status === 'Error') && 
      new Date(log.timestamp).getTime() >= thirtyDaysAgo
    ).length;
  }, [monitorLogs, isLoadingMonitorLogs, monitorLogsError]);

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
            <p className="text-xs text-muted-foreground">Managed devices (Mock Data)</p>
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
            {(isLoadingExecutions && procedureExecutions.length === 0) ? (
                <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                    <p>Loading statuses...</p>
                </div>
            ) : (executionsError && procedureExecutions.length === 0) ? (
                 <p className="text-sm text-destructive text-center">Error loading procedure statuses. <br/> {executionsError}</p>
            ) : procedureStatusData[0]?.name === 'No Data' || procedureStatusData[0]?.name === 'Loading...' ? (
                <p className="text-sm text-muted-foreground">{procedureStatusData[0].name === 'Loading...' ? 'Loading data...' : 'No procedure execution data found.'}</p>
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
             {isLoadingMonitorLogs ? (
                <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                    <p>Loading alerts...</p>
                </div>
            ) : monitorLogsError ? (
                 <p className="text-sm text-destructive text-center">Error: {monitorLogsError}</p>
            ) : (
                <>
                    <div className={`text-6xl font-bold ${recentMonitorAlertsCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {recentMonitorAlertsCount}
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {recentMonitorAlertsCount > 0 ? 'Alerts Requiring Attention' : 'No Critical Alerts'}
                    </p>
                    {monitorLogs.length === 0 && !monitorLogsError && <p className="text-xs text-muted-foreground mt-4">No monitor log data found from mock data.</p>}
                </>
            )}
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
                <p className="text-xl font-bold">
                    {isLoadingComputers ? <Skeleton className="h-6 w-16 inline-block" /> : 
                     computers.filter(c => c.status === 'Online' && c.cpuUsage !== undefined).length > 0 ? 
                     `${(computers.filter(c => c.status === 'Online' && c.cpuUsage !== undefined)
                                .reduce((acc, c) => acc + (c.cpuUsage || 0), 0) / 
                                computers.filter(c => c.status === 'Online' && c.cpuUsage !== undefined).length
                               ).toFixed(1)}%` 
                     : 'N/A'}
                </p> 
              </div>
            </div>
             <div className="flex items-center">
              <MemoryStick className="mr-3 h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm font-medium">Avg. RAM Usage</p>
                <p className="text-xl font-bold">
                    {isLoadingComputers ? <Skeleton className="h-6 w-16 inline-block" /> : 
                     computers.filter(c => c.status === 'Online' && c.ramUsage !== undefined).length > 0 ? 
                     `${(computers.filter(c => c.status === 'Online' && c.ramUsage !== undefined)
                                .reduce((acc, c) => acc + (c.ramUsage || 0), 0) / 
                                computers.filter(c => c.status === 'Online' && c.ramUsage !== undefined).length
                               ).toFixed(1)}%` 
                     : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Managed Computers (Mock Data)</CardTitle>
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
            <p className="text-center text-muted-foreground py-8">No computers found in mock data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
