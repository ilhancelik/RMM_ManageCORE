
"use client";

import type { Monitor } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox'; // For email alert

interface MonitorTableProps {
  monitors: Monitor[];
  onEdit: (monitor: Monitor) => void;
  onDelete: (monitorId: string, monitorName: string) => void;
  disabled?: boolean;
}

export function MonitorTable({ monitors, onEdit, onDelete, disabled }: MonitorTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="hidden sm:table-cell">Default Interval</TableHead>
          <TableHead className="hidden sm:table-cell">Email Alert</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monitors.map((monitor) => (
          <TableRow key={monitor.id}>
            <TableCell className="font-medium">{monitor.name}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
              {monitor.description || 'N/A'}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{monitor.scriptType}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {monitor.defaultIntervalValue} {monitor.defaultIntervalUnit}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                <Badge variant={monitor.sendEmailOnAlert ? 'default' : 'outline'} 
                       className={monitor.sendEmailOnAlert ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                    {monitor.sendEmailOnAlert ? 'Active' : 'Inactive'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(monitor)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit / View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(monitor.id, monitor.name)}
                    className="text-red-600 focus:text-red-600 focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
