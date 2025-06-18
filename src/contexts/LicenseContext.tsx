
'use client';
import type { SystemLicenseInfo } from '@/types';
import { getSystemLicenseInfo } from '@/lib/mockData';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // pathname değişikliğinde refresh için
import { useToast } from '@/hooks/use-toast';

interface LicenseContextType {
  licenseInfo: SystemLicenseInfo | null;
  isLicenseValid: boolean;
  isLoadingLicense: boolean;
  refreshLicenseInfo: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider = ({ children }: { children: ReactNode }) => {
  const [licenseInfo, setLicenseInfo] = useState<SystemLicenseInfo | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);
  const pathname = usePathname();
  const { toast } = useToast(); // toast'ı context içinde kullanabiliriz gerekirse

  const fetchLicenseInfo = useCallback(() => {
    setIsLoadingLicense(true);
    // Simulate async fetch for mock data
    setTimeout(() => {
      try {
        const info = getSystemLicenseInfo();
        setLicenseInfo(info);
        
        // Kullanıcıya lisans durumu hakkında genel bilgi vermek için (opsiyonel)
        // if (info.status !== 'Valid' && pathname !== '/system-license') {
        //   toast({
        //     title: `System License: ${info.status}`,
        //     description: info.status === 'Expired' ? 'Your license has expired. Some features are disabled.' :
        //                  info.status === 'ExceededLimit' ? 'Computer limit exceeded. Some features are disabled.' :
        //                  'License not active. Some features are disabled.',
        //     variant: 'destructive',
        //     duration: 7000
        //   });
        // }

      } catch (error) {
        console.error("Failed to fetch license info (mock):", error);
        setLicenseInfo(null); 
      } finally {
        setIsLoadingLicense(false);
      }
    }, 50); // Short delay for mock
  }, [toast, pathname]);

  useEffect(() => {
    fetchLicenseInfo();
  }, [fetchLicenseInfo]); // Fetch on mount and when fetchLicenseInfo changes (which includes pathname)

  const isLicenseValid = !!licenseInfo && licenseInfo.status === 'Valid';

  return (
    <LicenseContext.Provider value={{ licenseInfo, isLicenseValid, isLoadingLicense, refreshLicenseInfo: fetchLicenseInfo }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
