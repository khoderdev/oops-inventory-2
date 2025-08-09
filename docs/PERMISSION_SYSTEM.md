# Permission System Documentation

## Overview

The permission system provides comprehensive role-based access control (RBAC)
throughout the application using Jotai atoms for state management and custom
React hooks for easy integration.

## Architecture

### Core Components

1. **Permission Atoms** (`src/store/permissionAtoms.ts`)
   - Centralized state management for user permissions, roles, and
     authentication
   - Cached permission checks for performance optimization
   - Automatic synchronization with AuthContext

2. **Permission Hooks** (`src/hooks/usePermissions.ts`)
   - `usePermissions`: Main hook for permission and role checking
   - `useConditionalRender`: Hook for conditional UI rendering
   - `useNavigationPermissions`: Hook for navigation-specific logic
   - `useRoleBasedUI`: Hook for role-based UI customization

3. **Permission Components** (`src/components/auth/PermissionWrapper.tsx`)
   - `PermissionWrapper`: Component wrapper for conditional rendering
   - `withPermissions`: Higher-order component for permission-based rendering
   - `usePermissionRender`: Hook for inline conditional rendering
   - `RoleBasedUI`: Component for role-specific UI variants

4. ** Routing** (`src/components/App.tsx`)
   - Complete route coverage for all 133 permissions
   - route protection with role-based redirects
   - Placeholder pages for unimplemented features

## Usage Examples

### 1. Basic Permission Checking

```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/types/auth';

function MyComponent() {
  const { hasPermission, hasRole, isAdmin } = usePermissions();

  if (!hasPermission(PERMISSIONS.USERS_READ)) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {hasRole(['admin', 'manager']) && <ManagementTools />}
    </div>
  );
}
```

### 2. Conditional Rendering with PermissionWrapper

```typescript
import { PermissionWrapper } from '@/components/auth/PermissionWrapper';
import { PERMISSIONS } from '@/types/auth';

function UserManagement() {
  return (
    <div>
      <h1>User Management</h1>

      {/* Only show create button if user has create permission */}
      <PermissionWrapper requiredPermission={PERMISSIONS.USERS_CREATE}>
        <Button onClick={createUser}>Create User</Button>
      </PermissionWrapper>

      {/* Show fallback message if permission is missing */}
      <PermissionWrapper
        requiredPermission={PERMISSIONS.USERS_DELETE}
        showFallback={true}
        fallback={<div>Contact admin to delete users</div>}
      >
        <Button variant="destructive">Delete User</Button>
      </PermissionWrapper>

      {/* Multiple permission requirements */}
      <PermissionWrapper
        requiredAllPermissions={[PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE]}
      >
        <UserEditForm />
      </PermissionWrapper>
    </div>
  );
}
```

### 3. Role-Based UI Variants

```typescript
import { RoleBasedUI } from '@/components/auth/PermissionWrapper';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <RoleBasedUI
        admin={<AdminDashboard />}
        manager={<ManagerDashboard />}
        staff={<StaffDashboard />}
        default={<BasicDashboard />}
      />
    </div>
  );
}
```

### 4. Higher-Order Component Usage

```typescript
import { withPermissions } from '@/components/auth/PermissionWrapper';
import { PERMISSIONS } from '@/types/auth';

const ProtectedUserForm = withPermissions(UserForm, {
  requiredPermission: PERMISSIONS.USERS_UPDATE,
  fallback: <div>You don't have permission to edit users</div>,
  showFallback: true
});

function UserPage() {
  return <ProtectedUserForm userId={123} />;
}
```

### 5. Navigation with Permissions

```typescript
import { useNavigationPermissions } from '@/hooks/usePermissions';

function Navigation() {
  const { getVisibleNavigationItems } = useNavigationPermissions();
  const visibleItems = getVisibleNavigationItems();

  return (
    <nav>
      {visibleItems.map(item => (
        <NavItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

### 6. Inline Conditional Rendering

```typescript
import { usePermissionRender } from '@/components/auth/PermissionWrapper';

function MyComponent() {
  const { renderIfPermission, renderIfRole } = usePermissionRender();

  return (
    <div>
      {renderIfPermission(
        PERMISSIONS.REPORTS_READ,
        <ReportsSection />,
        <div>Reports not available</div>
      )}

      {renderIfRole(
        'admin',
        <AdminControls />,
        <div>Admin access required</div>
      )}
    </div>
  );
}
```

## Permission Constants

All permissions are defined in `src/types/auth.ts` under the `PERMISSIONS`
constant. The system includes 133 granular permissions covering:

- **POS Operations**: Transaction processing, payment handling, receipt
  management
- **Inventory Management**: Materials, suppliers, stock tracking, adjustments
- **Sales Management**: Orders, customers, pricing, promotions
- **Menu Management**: Items, categories, modifiers, pricing
- **Daily Operations**: Shifts, tasks, scheduling, maintenance
- **Reports & Analytics**: Financial, operational, and performance reports
- **Finance**: Accounting, budgets, expenses, payroll
- **Administration**: Users, roles, system settings, backups
- **Communication**: Notifications, messaging, announcements

## Role Hierarchy

The system supports three main roles with inherited permissions:

1. **Staff**: Basic operational permissions (POS, basic inventory viewing)
2. **Manager**: Staff permissions + management operations (reports, user
   management, advanced inventory)
3. **Admin**: All permissions including system administration and configuration

## Performance Considerations

- **Caching**: Permission checks are cached using Jotai atoms to prevent
  repeated calculations
- **Lazy Loading**: Route components are lazy-loaded for better performance
- **Memoization**: Permission hooks use React.useMemo for expensive operations
- **Batch Updates**: Permission state updates are batched to prevent unnecessary
  re-renders

## Security Features

- **Permission Violation Tracking**: Failed permission checks are logged for
  security auditing
- **Route Protection**: All routes are protected with appropriate permission
  checks
- **Graceful Degradation**: UI gracefully handles missing permissions with
  fallback content
- **Role-Based Redirects**: Staff users are automatically redirected to
  appropriate interfaces

## Migration Guide

To migrate existing components to use the new permission system:

1. Replace `useAuth()` with `usePermissions()`
2. Wrap conditional UI elements with `PermissionWrapper`
3. Use `useConditionalRender` for inline conditional rendering
4. Update navigation items to include permission requirements
5. Replace manual permission checks with the provided hooks

## Best Practices

1. **Granular Permissions**: Use specific permissions rather than broad role
   checks
2. **Fallback Content**: Always provide meaningful fallback content for
   restricted features
3. **Performance**: Use permission caching for frequently checked permissions
4. **User Experience**: Provide clear feedback when access is denied
5. **Security**: Never rely solely on frontend permission checks - always
   validate on the backend

## Troubleshooting

### Common Issues

1. **Permission not updating**: Ensure permission atoms are properly
   synchronized with AuthContext
2. **Component not re-rendering**: Check if permission dependencies are
   correctly specified
3. **Navigation items not filtering**: Verify navigation items have correct
   permission metadata
4. **Route access denied**: Ensure routes have appropriate permission
   requirements

### Debugging

Use the browser's React DevTools to inspect Jotai atoms and permission state:

```typescript
// Add to component for debugging
const { user, userPermissions, permissionCache } = usePermissions();
console.log("User:", user);
console.log("Permissions:", userPermissions);
console.log("Cache:", permissionCache);
```

## Future Enhancements

- **Permission Groups**: Logical grouping of related permissions
- **Temporary Permissions**: Time-based permission grants
- **Permission Delegation**: Allow users to delegate specific permissions
- **Audit Trail**: Comprehensive logging of permission changes and violations
- **Dynamic Permissions**: Runtime permission modifications without restart
