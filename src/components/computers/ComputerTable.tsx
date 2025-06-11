
"use client";

import type { Computer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Terminal, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

interface ComputerTableProps {
  computers: Computer[];
  selectedComputerIds?: string[]; // Made optional
  onComputerSelect?: (computerId: string, checked: boolean) => void; // Made optional
  onSelectAll?: (checked: boolean) => void; // Made optional
}

export function ComputerTable({ computers, selectedComputerIds, onComputerSelect, onSelectAll }: ComputerTableProps) {
  const router = useRouter();

  const getStatusBadgeVariant = (status: Computer['status']) => {
    switch (status) {
      case 'Online':
        return 'bg-green-500 hover:bg-green-600';
      case 'Offline':
        return 'bg-red-500 hover:bg-red-600';
      case 'Error':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'secondary';
    }
  };

  const handleViewDetails = (computerId: string) => {
    router.push(`/computers/${computerId}`);
  };
  
  const handleRunCommand = (computerId: string) => {
    router.push(`/commands?computerId=${computerId}`);
  };

  const onlineComputersInTable = computers.filter(computer => computer.status === 'Online');
  
  const allCurrentlyVisibleOnlineComputersSelected = 
    !!selectedComputerIds && // Check if selectedComputerIds is provided
    onlineComputersInTable.length > 0 && 
    onlineComputersInTable.every(computer => selectedComputerIds.includes(computer.id));

  const showSelectionColumn = !!onComputerSelect && !!onSelectAll && !!selectedComputerIds;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSelectionColumn && (
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all computers"
                checked={allCurrentlyVisibleOnlineComputersSelected}
                onCheckedChange={(checkedState) => {
                  if (typeof checkedState === 'boolean' && onSelectAll) {
                    onSelectAll(checkedState);
                  }
                }}
                disabled={onlineComputersInTable.length === 0}
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>OS</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead className="w-[100px]">CPU</TableHead>
          <TableHead className="w-[100px]">RAM</TableHead>
          <TableHead className="w-[100px]">Disk</TableHead>
          <TableHead>Last Seen</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {computers.map((computer) => (
          <TableRow key={computer.id} data-state={showSelectionColumn && selectedComputerIds?.includes(computer.id) ? "selected" : ""}>
            {showSelectionColumn && onComputerSelect && selectedComputerIds && (
              <TableCell>
                <Checkbox
                  aria-label={`Select computer ${computer.name}`}
                  checked={selectedComputerIds.includes(computer.id)}
                  onCheckedChange={(checkedState) => {
                    if (typeof checkedState === 'boolean') {
                      onComputerSelect(computer.id, checkedState);
                    }
                  }}
                  disabled={computer.status !== 'Online'}
                />
              </TableCell>
            )}
            <TableCell className="font-medium">{computer.name}</TableCell>
            <TableCell>
              <Badge variant="default" className={getStatusBadgeVariant(computer.status)}>
                {computer.status}
              </Badge>
            </TableCell>
            <TableCell>{computer.os}</TableCell>
            <TableCell>{computer.ipAddress}</TableCell>
            <TableCell>
              {computer.cpuUsage !== undefined ? (
                <div className="flex items-center gap-2">
                  <Progress value={computer.cpuUsage} className="h-2 w-[60px]" />
                  <span className="text-xs text-muted-foreground">{computer.cpuUsage}%</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              )}
            </TableCell>
            <TableCell>
              {computer.ramUsage !== undefined ? (
                 <div className="flex items-center gap-2">
                  <Progress value={computer.ramUsage} className="h-2 w-[60px]" />
                  <span className="text-xs text-muted-foreground">{computer.ramUsage}%</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              )}
            </TableCell>
            <TableCell>
              {computer.diskUsage !== undefined ? (
                <div className="flex items-center gap-2">
                  <Progress value={computer.diskUsage} className="h-2 w-[60px]" />
                  <span className="text-xs text-muted-foreground">{computer.diskUsage}%</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              )}
            </TableCell>
            <TableCell>{new Date(computer.lastSeen).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDetails(computer.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRunCommand(computer.id)} disabled={computer.status !== 'Online'}>
                    <Terminal className="mr-2 h-4 w-4" />
                    Run Command
                  </DropdownMenuItem>
                  <DropdownMenuItem> {/* Edit functionality can be added later */}
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600"> {/* Delete functionality can be added later */}
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
