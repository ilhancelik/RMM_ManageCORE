
import { ComputerTable } from '@/components/computers/ComputerTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockComputers } from '@/lib/mockData';
import type { Computer } from '@/types';
import { BarChart, CircleDollarSign, Cpu, HardDrive, MemoryStick } from 'lucide-react';

export default function DashboardPage() {
  const computers: Computer[] = mockComputers;

  const onlineComputers = computers.filter(c => c.status === 'Online').length;
  const offlineComputers = computers.filter(c => c.status === 'Offline').length;
  const errorComputers = computers.filter(c => c.status === 'Error').length;
  const totalComputers = computers.length;

  const averageCpuUsage = computers.reduce((acc, c) => acc + (c.cpuUsage || 0), 0) / totalComputers;
  const averageRamUsage = computers.reduce((acc, c) => acc + (c.ramUsage || 0), 0) / totalComputers;


  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Computer Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Computers</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComputers}</div>
            <p className="text-xs text-muted-foreground">Managed devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
             <span className="h-4 w-4 text-green-500">
                <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
             </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineComputers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <span className="h-4 w-4 text-red-500">
                <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
             </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineComputers}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
             <span className="h-4 w-4 text-orange-500">
                <svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
             </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorComputers}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Managed Computers</CardTitle>
        </CardHeader>
        <CardContent>
          <ComputerTable computers={computers} />
        </CardContent>
      </Card>
    </div>
  );
}
