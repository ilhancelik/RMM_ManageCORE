
"use client";

import type { Procedure } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, FileCode, HardDrive, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProcedureTableProps {
  procedures: Procedure[];
  onEdit: (procedure: Procedure) => void;
  onDelete: (procedureId: string, procedureName: string) => void;
  disabled?: boolean;
}

export function ProcedureTable({ procedures, onEdit, onDelete, disabled }: ProcedureTableProps) {
  const router = useRouter();

  const getSystemTypeLabel = (systemType?: Procedure['procedureSystemType']) => {
    switch (systemType) {
      case 'CustomScript':
        return 'Custom Script';
      case 'WindowsUpdate':
        return 'Windows Update';
      case 'SoftwareUpdate':
        return 'Software Update';
      default:
        return 'Custom'; // Fallback for older procedures
    }
  };

  const getSystemTypeIcon = (systemType?: Procedure['procedureSystemType']) => {
    switch (systemType) {
      case 'CustomScript':
        return <FileCode className="mr-2 h-4 w-4 opacity-80" />;
      case 'WindowsUpdate':
        return <HardDrive className="mr-2 h-4 w-4 opacity-80" />;
      case 'SoftwareUpdate':
        return <RefreshCw className="mr-2 h-4 w-4 opacity-80" />;
      default:
        return <FileCode className="mr-2 h-4 w-4 opacity-80" />;
    }
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>System Type</TableHead>
          <TableHead className="hidden sm:table-cell">Script Language</TableHead>
          <TableHead className="hidden sm:table-cell">Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {procedures.map((procedure) => (
          <TableRow key={procedure.id}>
            <TableCell className="font-medium">{procedure.name}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
              {procedure.description || 'N/A'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="flex items-center w-fit">
                {getSystemTypeIcon(procedure.procedureSystemType)}
                {getSystemTypeLabel(procedure.procedureSystemType)}
              </Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm">
                {procedure.procedureSystemType === 'CustomScript' ? procedure.scriptType : <span className="text-muted-foreground italic">N/A</span>}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {new Date(procedure.updatedAt).toLocaleDateString()}
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
                  <DropdownMenuItem onClick={() => router.push(`/procedures/${procedure.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(procedure)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(procedure.id, procedure.name)}
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

