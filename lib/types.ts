import { ObjectId } from 'mongodb';

// ===== TEAM =====
export interface Team {
  _id?: ObjectId;
  name: string;
  joinCode: string;  // Unique 8-char code for invitations
  passwordHash: string;  // Hashed password for joining
  ownerId: ObjectId;  // Admin user
  environments: string[];  // Custom environments
  createdAt: Date;
}

// ===== TEAM MEMBER =====
export interface TeamMember {
  _id?: ObjectId;
  teamId: ObjectId;
  userId: ObjectId;
  title?: string;  // Job title in team
  role: 'admin' | 'member';  // admin = team creator
  canDownload: boolean;  // Admin can disable download
  joinedAt: Date;
}

// ===== USER =====
export interface User {
  _id?: ObjectId;
  email: string;
  name?: string;  // Display name
  passwordHash: string;
  createdAt: Date;
}

// ===== PROJECT =====
export interface Project {
  _id?: ObjectId;
  name: string;
  teamId: ObjectId;  // Belongs to team
  createdAt: Date;
}

// ===== VARIABLE =====
export interface Variable {
  _id?: ObjectId;
  projectId: ObjectId;
  environment: string;  // Dynamic environment name
  key: string;
  valueEncrypted: string;
  description?: string;
  isCommented: boolean;  // Export with # prefix when true
  isMasked: boolean;     // Mask value in UI, reveal only with permission
  updatedBy: ObjectId;
  updatedAt: Date;
}

// ===== AUDIT LOG =====
export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  _id?: ObjectId;
  projectId: ObjectId;
  environment: string;
  variableKey: string;
  action: AuditAction;
  userId: ObjectId;
  previousValue?: string;
  newValue?: string;
  timestamp: Date;
}
