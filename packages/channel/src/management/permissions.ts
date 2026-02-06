/**
 * Permission Management System
 * 채널 및 발신번호 액세스 권한 관리
 */

import { EventEmitter } from 'events';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
}

export enum ResourceType {
  CHANNEL = 'channel',
  SENDER_NUMBER = 'senderNumber',
  TEMPLATE = 'template',
  MESSAGE = 'message',
  USER = 'user',
  ROLE = 'role',
  AUDIT_LOG = 'auditLog',
  ANALYTICS = 'analytics'
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  VERIFY = 'verify',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  SEND = 'send',
  MANAGE = 'manage'
}

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  PERSONAL = 'personal'
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with';
  value: any;
}

export interface AccessContext {
  userId: string;
  organizationId?: string;
  teamId?: string;
  resourceOwnerId?: string;
  metadata?: Record<string, any>;
}

export interface PermissionCheck {
  userId: string;
  resource: ResourceType;
  action: ActionType;
  resourceId?: string;
  context?: AccessContext;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  matchedPermissions: Permission[];
  deniedReasons: string[];
}

export class PermissionManager extends EventEmitter {
  private users = new Map<string, User>();
  private roles = new Map<string, Role>();
  private userRoleCache = new Map<string, Set<string>>();
  private permissionCache = new Map<string, PermissionResult>();
  private cacheExpiry = new Map<string, number>();

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.initializeSystemRoles();
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userId = this.generateUserId();
    
    const user: User = {
      ...userData,
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(userId, user);
    this.updateUserRoleCache(userId, user.roles.map(r => r.id));

    this.emit('user:created', { user });
    return user;
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      id: userId,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);

    // Update role cache if roles changed
    if (updates.roles) {
      this.updateUserRoleCache(userId, updates.roles.map(r => r.id));
    }

    // Clear permission cache for this user
    this.clearUserPermissionCache(userId);

    this.emit('user:updated', { user: updatedUser, previousUser: user });
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    this.users.delete(userId);
    this.userRoleCache.delete(userId);
    this.clearUserPermissionCache(userId);

    this.emit('user:deleted', { user });
    return true;
  }

  // Role Management
  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const roleId = this.generateRoleId();
    
    const role: Role = {
      ...roleData,
      id: roleId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.set(roleId, role);

    this.emit('role:created', { role });
    return role;
  }

  async getRole(roleId: string): Promise<Role | null> {
    return this.roles.get(roleId) || null;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem && updates.permissions) {
      throw new Error('Cannot modify permissions of system roles');
    }

    const updatedRole = {
      ...role,
      ...updates,
      id: roleId,
      updatedAt: new Date()
    };

    this.roles.set(roleId, updatedRole);

    // Clear permission cache for all users with this role
    this.clearRolePermissionCache(roleId);

    this.emit('role:updated', { role: updatedRole, previousRole: role });
    return updatedRole;
  }

  async deleteRole(roleId: string): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const usersWithRole = Array.from(this.users.values())
      .filter(user => user.roles.some(r => r.id === roleId));

    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    this.roles.delete(roleId);

    this.emit('role:deleted', { role });
    return true;
  }

  // Permission Management
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);

    if (!user) {
      throw new Error('User not found');
    }
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is already assigned
    if (user.roles.some(r => r.id === roleId)) {
      return;
    }

    user.roles.push(role);
    user.updatedAt = new Date();

    this.updateUserRoleCache(userId, user.roles.map(r => r.id));
    this.clearUserPermissionCache(userId);

    this.emit('role:assigned', { userId, roleId });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const roleIndex = user.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      return;
    }

    user.roles.splice(roleIndex, 1);
    user.updatedAt = new Date();

    this.updateUserRoleCache(userId, user.roles.map(r => r.id));
    this.clearUserPermissionCache(userId);

    this.emit('role:removed', { userId, roleId });
  }

  // Permission Checking
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(check);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.performPermissionCheck(check);

    // Cache the result
    this.setCache(cacheKey, result);

    return result;
  }

  async hasPermission(
    userId: string,
    resource: ResourceType,
    action: ActionType,
    resourceId?: string,
    context?: AccessContext
  ): Promise<boolean> {
    const result = await this.checkPermission({
      userId,
      resource,
      action,
      resourceId,
      context
    });

    return result.granted;
  }

  async requirePermission(
    userId: string,
    resource: ResourceType,
    action: ActionType,
    resourceId?: string,
    context?: AccessContext
  ): Promise<void> {
    const hasAccess = await this.hasPermission(userId, resource, action, resourceId, context);
    
    if (!hasAccess) {
      throw new Error(`Access denied: ${action} on ${resource}`);
    }
  }

  // Utility Methods
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = this.users.get(userId);
    if (!user) {
      return [];
    }

    const permissions: Permission[] = [];
    
    for (const role of user.roles) {
      permissions.push(...role.permissions);
    }

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = this.users.get(userId);
    return user ? user.roles : [];
  }

  listUsers(filters?: {
    isActive?: boolean;
    roleId?: string;
  }): User[] {
    let users = Array.from(this.users.values());

    if (filters?.isActive !== undefined) {
      users = users.filter(u => u.isActive === filters.isActive);
    }

    if (filters?.roleId) {
      users = users.filter(u => u.roles.some(r => r.id === filters.roleId));
    }

    return users;
  }

  listRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  // Private Methods
  private async performPermissionCheck(check: PermissionCheck): Promise<PermissionResult> {
    const user = this.users.get(check.userId);
    if (!user) {
      return {
        granted: false,
        reason: 'User not found',
        matchedPermissions: [],
        deniedReasons: ['User not found']
      };
    }

    if (!user.isActive) {
      return {
        granted: false,
        reason: 'User is inactive',
        matchedPermissions: [],
        deniedReasons: ['User is inactive']
      };
    }

    const matchedPermissions: Permission[] = [];
    const deniedReasons: string[] = [];

    // Check all user's roles
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (this.doesPermissionMatch(permission, check)) {
          // Check conditions
          if (await this.checkConditions(permission, check)) {
            matchedPermissions.push(permission);
          } else {
            deniedReasons.push(`Conditions not met for permission ${permission.id}`);
          }
        }
      }
    }

    const granted = matchedPermissions.length > 0;

    return {
      granted,
      reason: granted ? undefined : 'No matching permissions found',
      matchedPermissions,
      deniedReasons: granted ? [] : deniedReasons
    };
  }

  private doesPermissionMatch(permission: Permission, check: PermissionCheck): boolean {
    return permission.resource === check.resource && permission.action === check.action;
  }

  private async checkConditions(permission: Permission, check: PermissionCheck): Promise<boolean> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true;
    }

    // For simplicity, all conditions must be met (AND logic)
    for (const condition of permission.conditions) {
      if (!await this.evaluateCondition(condition, check)) {
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(condition: PermissionCondition, check: PermissionCheck): Promise<boolean> {
    let actualValue: any;

    // Get the actual value based on the field
    switch (condition.field) {
      case 'userId':
        actualValue = check.userId;
        break;
      case 'organizationId':
        actualValue = check.context?.organizationId;
        break;
      case 'teamId':
        actualValue = check.context?.teamId;
        break;
      case 'resourceOwnerId':
        actualValue = check.context?.resourceOwnerId;
        break;
      default:
        actualValue = check.context?.metadata?.[condition.field];
    }

    // Evaluate the condition
    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'not_equals':
        return actualValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case 'contains':
        return String(actualValue).includes(String(condition.value));
      case 'starts_with':
        return String(actualValue).startsWith(String(condition.value));
      default:
        return false;
    }
  }

  private initializeSystemRoles(): void {
    // Super Admin Role
    const superAdminRole: Role = {
      id: 'super-admin',
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: [
        // Global permissions for all resources and actions
        ...Object.values(ResourceType).flatMap(resource =>
          Object.values(ActionType).map(action => ({
            id: `super-admin-${resource}-${action}`,
            resource,
            action,
            scope: PermissionScope.GLOBAL
          }))
        )
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Channel Admin Role
    const channelAdminRole: Role = {
      id: 'channel-admin',
      name: 'Channel Admin',
      description: 'Manage channels and sender numbers',
      isSystem: true,
      permissions: [
        {
          id: 'channel-admin-channel-manage',
          resource: ResourceType.CHANNEL,
          action: ActionType.MANAGE,
          scope: PermissionScope.ORGANIZATION
        },
        {
          id: 'channel-admin-sender-manage',
          resource: ResourceType.SENDER_NUMBER,
          action: ActionType.MANAGE,
          scope: PermissionScope.ORGANIZATION
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Message Sender Role
    const messageSenderRole: Role = {
      id: 'message-sender',
      name: 'Message Sender',
      description: 'Send messages using configured channels',
      isSystem: true,
      permissions: [
        {
          id: 'message-sender-channel-read',
          resource: ResourceType.CHANNEL,
          action: ActionType.READ,
          scope: PermissionScope.ORGANIZATION
        },
        {
          id: 'message-sender-message-send',
          resource: ResourceType.MESSAGE,
          action: ActionType.SEND,
          scope: PermissionScope.ORGANIZATION
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Viewer Role
    const viewerRole: Role = {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access',
      isSystem: true,
      permissions: [
        {
          id: 'viewer-channel-read',
          resource: ResourceType.CHANNEL,
          action: ActionType.READ,
          scope: PermissionScope.ORGANIZATION
        },
        {
          id: 'viewer-sender-read',
          resource: ResourceType.SENDER_NUMBER,
          action: ActionType.READ,
          scope: PermissionScope.ORGANIZATION
        },
        {
          id: 'viewer-analytics-read',
          resource: ResourceType.ANALYTICS,
          action: ActionType.READ,
          scope: PermissionScope.ORGANIZATION
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.set(superAdminRole.id, superAdminRole);
    this.roles.set(channelAdminRole.id, channelAdminRole);
    this.roles.set(messageSenderRole.id, messageSenderRole);
    this.roles.set(viewerRole.id, viewerRole);
  }

  private updateUserRoleCache(userId: string, roleIds: string[]): void {
    this.userRoleCache.set(userId, new Set(roleIds));
  }

  private clearUserPermissionCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.permissionCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  private clearRolePermissionCache(roleId: string): void {
    // Find all users with this role and clear their cache
    for (const [userId, roleIds] of this.userRoleCache) {
      if (roleIds.has(roleId)) {
        this.clearUserPermissionCache(userId);
      }
    }
  }

  private getCacheKey(check: PermissionCheck): string {
    const contextKey = check.context ? JSON.stringify(check.context) : '';
    return `${check.userId}:${check.resource}:${check.action}:${check.resourceId || ''}:${contextKey}`;
  }

  private getFromCache(key: string): PermissionResult | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || expiry < Date.now()) {
      this.permissionCache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.permissionCache.get(key) || null;
  }

  private setCache(key: string, result: PermissionResult): void {
    this.permissionCache.set(key, result);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRoleId(): string {
    return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}