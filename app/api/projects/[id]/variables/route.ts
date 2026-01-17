import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Variable, Project, AuditLog, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const variablesCollection = db.collection<Variable>('variables');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Get user's team
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    if (!membership) {
      return NextResponse.json({ error: 'No team membership' }, { status: 403 });
    }

    const projectId = new ObjectId(params.id);
    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const variables = await variablesCollection
      .find({ projectId, environment })
      .toArray();

    // Decrypt values for display, but respect masking and permissions
    const variablesWithValues = variables.map((v: Variable) => {
      const decryptedValue = decrypt(v.valueEncrypted);
      const shouldMask = v.isMasked && !membership.canDownload;
      
      return {
        _id: v._id,
        key: v.key,
        value: shouldMask ? 'MASKED' : decryptedValue,
        description: v.description,
        isCommented: v.isCommented ?? false,
        isMasked: v.isMasked ?? false,
        canReveal: membership.canDownload, // Tell frontend if user can reveal
        updatedAt: v.updatedAt,
      };
    });

    return NextResponse.json({ variables: variablesWithValues });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const { environment, variables: bulkVariables, override } = body;

    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const variablesCollection = db.collection<Variable>('variables');
    const auditLogsCollection = db.collection<AuditLog>('auditLogs');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Get user's team
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    if (!membership) {
      return NextResponse.json({ error: 'No team membership' }, { status: 403 });
    }

    const projectId = new ObjectId(params.id);
    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Handle Bulk Import
    if (bulkVariables && Array.isArray(bulkVariables)) {
      const results = [];
      for (const v of bulkVariables) {
        const { key, value, description } = v;
        if (!key || value === undefined) continue;

        const valueEncrypted = encrypt(value);
        const existing = await variablesCollection.findOne({ projectId, environment, key });

        if (existing) {
          if (override) {
            await variablesCollection.updateOne(
              { _id: existing._id },
              { 
                $set: { 
                  valueEncrypted, 
                  description: description || existing.description,
                  updatedBy: user.userId,
                  updatedAt: new Date()
                } 
              }
            );
            await auditLogsCollection.insertOne({
              projectId,
              environment,
              variableKey: key,
              action: 'update',
              userId: user.userId,
              previousValue: existing.valueEncrypted,
              newValue: valueEncrypted,
              timestamp: new Date(),
            });
            results.push({ key, status: 'overridden' });
          } else {
            results.push({ key, status: 'skipped' });
          }
        } else {
          await variablesCollection.insertOne({
            projectId,
            environment,
            key,
            valueEncrypted,
            description: description || undefined,
            isCommented: false,
            isMasked: false,
            updatedBy: user.userId,
            updatedAt: new Date(),
          });
          await auditLogsCollection.insertOne({
            projectId,
            environment,
            variableKey: key,
            action: 'create',
            userId: user.userId,
            newValue: valueEncrypted,
            timestamp: new Date(),
          });
          results.push({ key, status: 'created' });
        }
      }
      return NextResponse.json({ results }, { status: 201 });
    }

    // Handle Single Variable Creation (Existing Logic)
    const { key, value, description, isCommented, isMasked } = body;
    if (!environment || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Environment, key, and value are required' },
        { status: 400 }
      );
    }

    const existingVariable = await variablesCollection.findOne({
      projectId,
      environment,
      key,
    });

    if (existingVariable) {
      return NextResponse.json(
        { error: 'Variable with this key already exists in this environment' },
        { status: 400 }
      );
    }

    const valueEncrypted = encrypt(value);

    const result = await variablesCollection.insertOne({
      projectId,
      environment,
      key,
      valueEncrypted,
      description: description || undefined,
      isCommented: isCommented ?? false,
      isMasked: isMasked ?? false,
      updatedBy: user.userId,
      updatedAt: new Date(),
    });

    await auditLogsCollection.insertOne({
      projectId,
      environment,
      variableKey: key,
      action: 'create',
      userId: user.userId,
      newValue: valueEncrypted,
      timestamp: new Date(),
    });

    const variable = await variablesCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        variable: {
          _id: variable!._id,
          key: variable!.key,
          value: decrypt(variable!.valueEncrypted),
          description: variable!.description,
          isCommented: variable!.isCommented,
          isMasked: variable!.isMasked,
          updatedAt: variable!.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    if (!environment) {
      return NextResponse.json({ error: 'Environment is required' }, { status: 400 });
    }

    const db = await getDb();
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');
    const variablesCollection = db.collection<Variable>('variables');
    const auditLogsCollection = db.collection<AuditLog>('auditLogs');

    // Check if user is admin
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const projectId = new ObjectId(params.id);
    
    // Log the clear action
    await auditLogsCollection.insertOne({
      projectId,
      environment,
      variableKey: 'ALL_VARIABLES',
      action: 'delete',
      userId: user.userId,
      timestamp: new Date(),
    });

    await variablesCollection.deleteMany({ projectId, environment });

    return NextResponse.json({ message: 'All variables cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
