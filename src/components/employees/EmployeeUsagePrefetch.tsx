import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { addDays } from "date-fns";
import { EmployeeUsageView } from "./EmployeeUsageViewRefactored";
import { fetchUsageAtom, fetchUsageStatsAtom } from "@/store/employeeAtoms";
import type { EmployeeUsage, EmployeeUsagesResponse, UsageStats } from "@/types/employee";

/**
 * Parent component that prefetches employee usage data and passes it to the EmployeeUsageView
 * This follows the pattern used in other components like InventoryManagementPanel
 * to ensure instant data rendering without loading states
 */
export const EmployeeUsagePrefetch: React.FC = () => {
  // Get the fetch functions from atoms
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);
  
  // State for prefetched data
  const [prefetchedUsages, setPrefetchedUsages] = useState<EmployeeUsage[] | null>(null);
  const [prefetchedStats, setPrefetchedStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prefetch data on component mount
  useEffect(() => {
    const prefetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch 90 days of data by default for client-side filtering
        const baseFilters = {
          startDate: addDays(new Date(), -90).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0]
        };
        
        // Fetch both usages and stats in parallel
        const [usagesResponse, statsResponse] = await Promise.all([
          fetchUsages(baseFilters),
          fetchStats(baseFilters)
        ]);
        

        console.log('EmployeeUsagePrefetch - usagesResponse:', usagesResponse);
        console.log('EmployeeUsagePrefetch - statsResponse:', statsResponse);
        
        setPrefetchedUsages(usagesResponse?.usages || []);
        setPrefetchedStats(statsResponse as UsageStats);
        
        console.log('EmployeeUsagePrefetch - prefetchedUsages set to:', usagesResponse?.usages || []);
        console.log('EmployeeUsagePrefetch - prefetchedStats set to:', statsResponse);
      } catch (error) {
        console.error("Failed to prefetch employee usage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    prefetchData();
  }, [fetchUsages, fetchStats]);

  // Pass the prefetched data to the EmployeeUsageView component
  return (
    <EmployeeUsageView 
      prefetchedUsages={prefetchedUsages}
      prefetchedStats={prefetchedStats}
      isLoading={isLoading}
    />
  );
};
