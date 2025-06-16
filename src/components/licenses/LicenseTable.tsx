
"use client";

import type { License } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, ExternalLink, CalendarClock } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface LicenseTableProps {
  licenses: License[];
  onEdit: (license: License) => void;
  onDelete: (licenseId: string, licenseName: string) => void;
  disabled?: boolean;
}

export function LicenseTable({ licenses, onEdit, onDelete, disabled }: LicenseTableProps) {

  const getStatusInfo = (license: License): { text: string, variant: 'default' | 'secondary' | 'destructive' | 'outline', className?: string } => {
    if (!license.isActive) {
      return { text: 'Inactive', variant: 'secondary', className: 'bg-gray-500 hover:bg-gray-600 text-white' };
    }
    if (license.enableExpiryDate && license.expiryDate) {
      const today = new Date();
      const expiry = parseISO(license.expiryDate);
      if (expiry < today) {
        return { text: 'Expired', variant: 'destructive' };
      }
      const daysUntilExpiry = differenceInDays(expiry, today);
      if (daysUntilExpiry <= 30) {
        return { text: `Expires in ${daysUntilExpiry}d`, variant: 'default', className: 'bg-orange-500 hover:bg-orange-600 text-white' };
      }
    }
    return { text: 'Active', variant: 'default', className: 'bg-green-500 hover:bg-green-600 text-white' };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead className="w-[80px]">Qty</TableHead>
          <TableHead className="hidden sm:table-cell">Term</TableHead>
          <TableHead className="hidden md:table-cell">Expiry Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {licenses.map((license) => {
          const statusInfo = getStatusInfo(license);
          return (
            <TableRow key={license.id}>
              <TableCell className="font-medium">
                {license.productName}
                {license.websitePanelAddress && (
                  <a href={license.websitePanelAddress} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700">
                    <ExternalLink className="inline h-3 w-3" />
                  </a>
                )}
              </TableCell>
              <TableCell>{license.quantity}</TableCell>
              <TableCell className="hidden sm:table-cell">{license.licenseTerm}</TableCell>
              <TableCell className="hidden md:table-cell">
                {license.enableExpiryDate && license.expiryDate ? (
                    <span className={cn(
                        statusInfo.text.startsWith('Expires') && 'font-semibold',
                        statusInfo.text === 'Expired' && 'text-destructive line-through'
                    )}>
                        {format(parseISO(license.expiryDate), 'PP')}
                    </span>
                ) : license.licenseTerm === 'Lifetime' ? 'Lifetime' : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={statusInfo.variant} className={statusInfo.className}>
                  {statusInfo.text.startsWith('Expires') && <CalendarClock className="mr-1 h-3 w-3" />}
                  {statusInfo.text}
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
                    <DropdownMenuItem onClick={() => onEdit(license)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit License
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(license.id, license.productName)}
                      className="text-red-600 focus:text-red-600 focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete License
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
