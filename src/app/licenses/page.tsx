
"use client";

import type { License, LicenseTerm } from '@/types';
import { licenseTermsList, getLicenses, addLicenseToMock, updateLicenseInMock, deleteLicenseFromMock, getSmtpSettings } from '@/lib/mockData'; // Added getSmtpSettings
import { LicenseTable } from '@/components/licenses/LicenseTable';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Save, Loader2, Search, KeyRound, CalendarIcon, MailWarning, Mail } from 'lucide-react'; // Added Mail
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns'; // parseISO might be needed if formState dates are strings
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const initialLicenseFormState: Omit<License, 'id' | 'createdAt' | 'updatedAt'> = {
  productName: '',
  quantity: 1,
  websitePanelAddress: '',
  licenseTerm: 'Annual',
  purchaseDate: null,
  enableExpiryDate: true,
  expiryDate: null,
  sendExpiryNotification: true,
  notificationDaysBefore: 30,
  notes: '',
  isActive: true,
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<License | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false); // New state for report sending

  const [formState, setFormState] = useState(initialLicenseFormState);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLicensesData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setLicenses(getLicenses());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load licenses from mock data.';
        setError(errorMessage);
        toast({ title: "Error Loading Licenses (Mock)", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [toast]);

  useEffect(() => {
    loadLicensesData();
  }, [loadLicensesData]);

  const filteredLicenses = useMemo(() => {
    if (!searchTerm.trim()) {
      return licenses;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return licenses.filter(lic =>
      lic.productName.toLowerCase().includes(lowerSearchTerm) ||
      (lic.notes && lic.notes.toLowerCase().includes(lowerSearchTerm))
    );
  }, [licenses, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    if (type === 'number') {
        parsedValue = parseInt(value) || 0;
        if (name === 'notificationDaysBefore') {
            parsedValue = Math.max(1, Math.min(30, parsedValue as number));
        }
    }
    setFormState(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSelectChange = (name: keyof Omit<License, 'id' | 'createdAt' | 'updatedAt'>, value: string) => {
    setFormState(prev => {
      const newState = { ...prev, [name]: value as LicenseTerm };
      if (name === 'licenseTerm') {
        if (value === 'Lifetime') {
          newState.enableExpiryDate = false;
          newState.expiryDate = null;
          newState.sendExpiryNotification = false;
        } else {
          newState.enableExpiryDate = true;
        }
      }
      return newState;
    });
  };

  const handleSwitchChange = (name: keyof Omit<License, 'id' | 'createdAt' | 'updatedAt'>, checked: boolean) => {
     setFormState(prev => {
       const newState = { ...prev, [name]: checked };
       if (name === 'enableExpiryDate' && !checked) {
         newState.expiryDate = null;
         newState.sendExpiryNotification = false;
       }
       return newState;
     });
  };
  
  const handleDateChange = (name: 'purchaseDate' | 'expiryDate', date: Date | undefined) => {
    setFormState(prev => ({ ...prev, [name]: date ? date.toISOString() : null }));
  };


  const resetFormAndCloseModal = () => {
    setFormState(initialLicenseFormState);
    setCurrentLicense(null);
    setIsEditMode(false);
    setIsModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setFormState(initialLicenseFormState);
    setIsEditMode(false);
    setCurrentLicense(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (license: License) => {
    setFormState({
      productName: license.productName,
      quantity: license.quantity,
      websitePanelAddress: license.websitePanelAddress || '',
      licenseTerm: license.licenseTerm,
      purchaseDate: license.purchaseDate || null,
      enableExpiryDate: license.enableExpiryDate,
      expiryDate: license.expiryDate || null,
      sendExpiryNotification: license.sendExpiryNotification ?? (license.enableExpiryDate && !!license.expiryDate),
      notificationDaysBefore: license.notificationDaysBefore || 30,
      notes: license.notes || '',
      isActive: license.isActive,
    });
    setIsEditMode(true);
    setCurrentLicense(license);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formState.productName.trim() || formState.quantity <= 0) {
      toast({ title: "Validation Error", description: "Product Name and a valid Quantity are required.", variant: "destructive"});
      return;
    }
    if (formState.enableExpiryDate && (formState.licenseTerm === 'Annual' || formState.licenseTerm === 'Monthly') && !formState.expiryDate) {
      toast({ title: "Validation Error", description: "Expiry Date is required for Annual/Monthly licenses when expiry is enabled.", variant: "destructive"});
      return;
    }
    if (formState.sendExpiryNotification && (formState.notificationDaysBefore || 0) < 1 || (formState.notificationDaysBefore || 0) > 30) {
        toast({ title: "Validation Error", description: "Notification Days Before must be between 1 and 30.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      const licenseData: Omit<License, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formState,
        expiryDate: formState.enableExpiryDate ? formState.expiryDate : null,
        sendExpiryNotification: formState.enableExpiryDate && !!formState.expiryDate ? formState.sendExpiryNotification : false,
        notificationDaysBefore: formState.enableExpiryDate && !!formState.expiryDate && formState.sendExpiryNotification ? formState.notificationDaysBefore : undefined,
      };

      if (isEditMode && currentLicense) {
        updateLicenseInMock(currentLicense.id, licenseData);
        toast({title: "Success", description: `License "${formState.productName}" updated (Mock).`});
      } else {
        addLicenseToMock(licenseData);
        toast({title: "Success", description: `License "${formState.productName}" created (Mock).`});
      }
      
      setTimeout(() => { 
        resetFormAndCloseModal();
        loadLicensesData(); 
        setIsSubmitting(false);
      }, 500);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: isEditMode ? "Error Updating License" : "Error Creating License", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleDelete = (licenseId: string, licenseName: string) => {
    if (!window.confirm(`Are you sure you want to delete license "${licenseName}"? This action cannot be undone.`)) {
        return;
    }
    setIsSubmitting(true); 
    try {
        deleteLicenseFromMock(licenseId);
        toast({title: "Success", description: `License "${licenseName}" deleted (Mock).`});
        setTimeout(() => { 
          loadLicensesData(); 
          setIsSubmitting(false);
        }, 500);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred (Mock).';
        toast({title: "Error Deleting License", description: errorMessage, variant: "destructive"});
        setIsSubmitting(false);
    }
  };

  const handleEmailLicensesReport = () => {
    setIsSendingReport(true);
    const allLicenses = getLicenses();
    const smtp = getSmtpSettings();

    if (!smtp.defaultToEmail) {
      toast({
        title: "Error Sending Report",
        description: "Default recipient email is not configured in SMTP settings. Please configure it first.",
        variant: "destructive",
      });
      setIsSendingReport(false);
      return;
    }

    // Simulate report generation (e.g., as a summary string for the toast)
    const reportSummary = `Report contains ${allLicenses.length} license(s). Data includes Product Name, Quantity, Term, Expiry, Status.`;

    setTimeout(() => { // Simulate network delay
      toast({
        title: "License Report Sent (Simulated)",
        description: `An email with a report of ${allLicenses.length} licenses has been 'sent' to ${smtp.defaultToEmail}. (${reportSummary})`,
        duration: 8000, 
      });
      setIsSendingReport(false);
    }, 1000);
  };

  const LicenseFormFields = (
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-1">
        <Label htmlFor="productName">Product Name</Label>
        <Input id="productName" name="productName" value={formState.productName} onChange={handleInputChange} disabled={isSubmitting} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" name="quantity" type="number" min="1" value={formState.quantity} onChange={handleInputChange} disabled={isSubmitting} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="websitePanelAddress">Website/Panel Address</Label>
        <Input id="websitePanelAddress" name="websitePanelAddress" type="url" value={formState.websitePanelAddress} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., https://portal.example.com" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="licenseTerm">License Term</Label>
        <Select name="licenseTerm" value={formState.licenseTerm} onValueChange={(value) => handleSelectChange('licenseTerm', value)} disabled={isSubmitting}>
          <SelectTrigger id="licenseTerm"><SelectValue placeholder="Select term" /></SelectTrigger>
          <SelectContent>
            {licenseTermsList.map(term => (<SelectItem key={term} value={term}>{term}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="purchaseDate">Purchase Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !formState.purchaseDate && "text-muted-foreground")}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formState.purchaseDate ? format(parseISO(formState.purchaseDate), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={formState.purchaseDate ? parseISO(formState.purchaseDate) : undefined} onSelect={(date) => handleDateChange('purchaseDate', date)} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
      
      <Separator className="my-2"/>
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <Switch id="enableExpiryDate" name="enableExpiryDate" checked={formState.enableExpiryDate} onCheckedChange={(checked) => handleSwitchChange('enableExpiryDate', checked)} disabled={isSubmitting || formState.licenseTerm === 'Lifetime'} />
          <Label htmlFor="enableExpiryDate" className="font-normal">Set Expiry Date</Label>
        </div>
         {formState.licenseTerm === 'Lifetime' && <p className="text-xs text-muted-foreground pl-8">Lifetime licenses do not have an expiry date.</p>}
      </div>

      {formState.enableExpiryDate && formState.licenseTerm !== 'Lifetime' && (
        <>
          <div className="space-y-1 pl-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !formState.expiryDate && "text-muted-foreground")}
                disabled={isSubmitting}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formState.expiryDate ? format(parseISO(formState.expiryDate), "PPP") : <span>Pick expiry date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={formState.expiryDate ? parseISO(formState.expiryDate) : undefined} onSelect={(date) => handleDateChange('expiryDate', date)} initialFocus />
            </PopoverContent>
            </Popover>
          </div>
          
          {formState.expiryDate && (
            <>
             <div className="flex items-center space-x-2 pl-2 pt-2">
                <Switch id="sendExpiryNotification" name="sendExpiryNotification" checked={formState.sendExpiryNotification} onCheckedChange={(checked) => handleSwitchChange('sendExpiryNotification', checked)} disabled={isSubmitting} />
                <Label htmlFor="sendExpiryNotification" className="font-normal">Send Email Notification Before Expiry</Label>
              </div>

              {formState.sendExpiryNotification && (
                <div className="space-y-1 pl-8">
                  <Label htmlFor="notificationDaysBefore">Notify Days Before Expiry (1-30)</Label>
                  <Input 
                    id="notificationDaysBefore" 
                    name="notificationDaysBefore" 
                    type="number" 
                    min="1" 
                    max="30" 
                    value={formState.notificationDaysBefore} 
                    onChange={handleInputChange} 
                    disabled={isSubmitting} 
                    className="w-24"
                  />
                  <p className="text-xs text-muted-foreground">How many days before expiry to send a notification.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
      <Separator className="my-2"/>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} disabled={isSubmitting} rows={3} />
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Switch id="isActive" name="isActive" checked={formState.isActive} onCheckedChange={(checked) => handleSwitchChange('isActive', checked)} disabled={isSubmitting} />
        <Label htmlFor="isActive" className="font-normal">License is Active</Label>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Skeleton className="h-10 w-48" /><div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto"><Skeleton className="h-10 w-full sm:w-[250px]" /><Skeleton className="h-10 w-36" /><Skeleton className="h-10 w-36" /></div>
        </div>
        <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading software licenses...</p></div>
      </div>
    );
  }

  if (error) {
    return (<div className="container mx-auto py-10 text-center text-destructive"><p>{error}</p><Button onClick={loadLicensesData} variant="outline" className="mt-4">Retry</Button></div>);
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center"><KeyRound className="mr-3 h-8 w-8 text-primary"/>Software Licenses</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search licenses..." className="pl-8 w-full sm:w-[200px] lg:w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button onClick={handleEmailLicensesReport} variant="outline" disabled={isSubmitting || isSendingReport || licenses.length === 0}>
                {isSendingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Email Report
            </Button>
            <Button onClick={handleOpenCreateModal} disabled={isSubmitting || isSendingReport}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create License
            </Button>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) { setIsModalOpen(isOpen); if(!isOpen) resetFormAndCloseModal();} }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>{isEditMode ? 'Edit License' : 'Create New License'}</DialogTitle><DialogDescription>{isEditMode ? 'Update the details of this license.' : 'Add a new software license to track (Mock Data).'}</DialogDescription></DialogHeader>
          {LicenseFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (!isSubmitting) resetFormAndCloseModal();}} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create License')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
            <CardTitle>All Software Licenses {searchTerm && `(Filtered by "${searchTerm}")`}</CardTitle>
            <CardDescription>View and manage all software licenses. {filteredLicenses.length === 0 && !isLoading && 'No licenses match your current filters.'}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (<div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : error ? (<p className="text-destructive text-center py-4">{error}</p>
            ) : filteredLicenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <KeyRound className="mx-auto h-12 w-12 mb-4" />
                    <p className="font-semibold">{searchTerm ? 'No Licenses Found' : 'No Licenses Yet'}</p>
                    <p className="text-sm">{searchTerm ? `No licenses match your search for "${searchTerm}".` : 'Create licenses to start tracking them.'}</p>
                    {!searchTerm && (<Button onClick={handleOpenCreateModal} disabled={isSubmitting} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Create Your First License</Button>)}
                </div>
            ) : (
                <LicenseTable licenses={filteredLicenses} onEdit={handleOpenEditModal} onDelete={handleDelete} disabled={isSubmitting || isSendingReport} />
            )}
        </CardContent>
        {!isLoading && !error && filteredLicenses.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">Showing {filteredLicenses.length} of {licenses.length} licenses. Active: {licenses.filter(l=>l.isActive).length}, Inactive: {licenses.filter(l=>!l.isActive).length}</CardFooter>
        )}
      </Card>
    </div>
  );
}
    

    