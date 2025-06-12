
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addComputer } from '@/lib/mockData'; // Import the mock function
import type { Computer } from '@/types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NewComputerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [os, setOs] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState<Computer['status']>('Online');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !os.trim() || !ipAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields: Name, OS, and IP Address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the mock function to add the computer
      addComputer({ name, os, ipAddress, status });
      toast({
        title: 'Success!',
        description: `Computer "${name}" has been added to mock data.`,
      });
      // Simulate API call delay
      setTimeout(() => {
        router.push('/computers'); // Navigate back to the computers list
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Error adding computer (Mock)',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-2">
      <Button variant="outline" onClick={() => router.push('/computers')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Computers
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Computer (Mock Data)</CardTitle>
          <CardDescription>Enter the details for the new computer. This will be added to local mock data.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Computer Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Workstation-Sales-05"
                required
              />
            </div>
            <div>
              <Label htmlFor="os">Operating System</Label>
              <Input
                id="os"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="e.g., Windows 11 Pro"
                required
              />
            </div>
            <div>
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 192.168.1.123"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={(value: Computer['status']) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" /> }
              {isSubmitting ? 'Adding...' : 'Add Computer'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
