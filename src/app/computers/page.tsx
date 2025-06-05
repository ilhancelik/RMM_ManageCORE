
import { ComputerTable } from '@/components/computers/ComputerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockComputers } from '@/lib/mockData';
import type { Computer } from '@/types';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function ComputersPage() {
  const computers: Computer[] = mockComputers;

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Managed Computers</h1>
        <Button asChild>
          <Link href="/computers/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Computer
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Computers</CardTitle>
          <CardDescription>View and manage all connected computers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ComputerTable computers={computers} />
        </CardContent>
      </Card>
    </div>
  );
}
