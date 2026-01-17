import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Project, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
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

    return NextResponse.json({ project });
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
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Check if user is admin
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    if (!membership) {
      return NextResponse.json({ error: 'No team membership' }, { status: 403 });
    }

    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete projects' },
        { status: 403 }
      );
    }

    const projectId = new ObjectId(params.id);
    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    await projectsCollection.deleteOne({ _id: projectId });

    const variablesCollection = db.collection('variables');
    await variablesCollection.deleteMany({ projectId });

    const auditLogsCollection = db.collection('auditLogs');
    await auditLogsCollection.deleteMany({ projectId });

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
