import React from 'react';
import { DatabaseBackupManager } from '@/components/system/settings';

const SystemSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your system configuration and database operations
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Database Backup Section */}
        <section>
          <DatabaseBackupManager />
        </section>
        
        {/* Future system settings sections can be added here */}
        {/* 
        <section>
          <SystemConfiguration />
        </section>
        
        <section>
          <UserManagement />
        </section>
        */}
      </div>
    </div>
  );
};

export default SystemSettings;
