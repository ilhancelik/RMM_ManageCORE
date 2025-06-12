
"use client";

import type { Procedure } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProcedureTableProps {
  procedures: Procedure[];
  onEdit: (procedure: Procedure) => void;
  onDelete: (procedureId: string, procedureName: string) => void;
  disabled?: boolean;
}

export function ProcedureTable({ procedures, onEdit, onDelete, disabled }: ProcedureTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="hidden sm:table-cell">Created</TableHead>
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
              <Badge variant="secondary">{procedure.scriptType}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
              {new Date(procedure.createdAt).toLocaleDateString()}
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
