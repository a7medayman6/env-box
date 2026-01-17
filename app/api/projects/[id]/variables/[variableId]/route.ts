import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Variable, Project, AuditLog, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { encrypt, decrypt } from '@/lib/encryption';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variableId: string } }
) {
  try {
    const user = requireAuth(request);
    const { value, description, isCommented, isMasked } = await request.json();

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
    const variableId = new ObjectId(params.variableId);

    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existingVariable = await variablesCollection.findOne({
      _id: variableId,
      projectId,
    });

    if (!existingVariable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    const updates: any = {
      updatedBy: user.userId,
      updatedAt: new Date(),
    };

    if (value !== undefined && value !== '') {
      updates.valueEncrypted = encrypt(value);
    }

    if (description !== undefined) {
      updates.description = description || undefined;
    }

    if (isCommented !== undefined) {
      updates.isCommented = isCommented;
    }

    if (isMasked !== undefined) {
      // Allow unmasking only if the user has canDownload permission
      if (existingVariable.isMasked && isMasked === false && !membership.canDownload) {
        return NextResponse.json(
          { error: 'You do not have permission to unmask variables' },
          { status: 403 }
        );
      }
      updates.isMasked = isMasked;
    }

    await variablesCollection.updateOne(
      { _id: variableId },
      { $set: updates }
    );

    // Log if value changed
    if (updates.valueEncrypted) {
      await auditLogsCollection.insertOne({
        projectId,
        environment: existingVariable.environment,
        variableKey: existingVariable.key,
        action: 'update',
        userId: user.userId,
        previousValue: existingVariable.valueEncrypted,
        newValue: updates.valueEncrypted,
        timestamp: new Date(),
      });
    }

    const updatedVariable = await variablesCollection.findOne({ _id: variableId });

    return NextResponse.json({
      variable: {
        _id: updatedVariable!._id,
        key: updatedVariable!.key,
        value: decrypt(updatedVariable!.valueEncrypted),
        description: updatedVariable!.description,
        isCommented: updatedVariable!.isCommented,
        isMasked: updatedVariable!.isMasked,
        updatedAt: updatedVariable!.updatedAt,
      },
    });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variableId: string } }
) {
  try {
    const user = requireAuth(request);

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
    const variableId = new ObjectId(params.variableId);

    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existingVariable = await variablesCollection.findOne({
      _id: variableId,
      projectId,
    });

    if (!existingVariable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    await variablesCollection.deleteOne({ _id: variableId });

    await auditLogsCollection.insertOne({
      projectId,
      environment: existingVariable.environment,
      variableKey: existingVariable.key,
      action: 'delete',
      userId: user.userId,
      previousValue: existingVariable.valueEncrypted,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
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
