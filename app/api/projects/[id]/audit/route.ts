import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { AuditLog, Project, User, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');

    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const auditLogsCollection = db.collection<AuditLog>('auditLogs');
    const usersCollection = db.collection<User>('users');
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

    const query: any = { projectId };
    if (environment) {
      query.environment = environment;
    }

    const logs = await auditLogsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const userIds = Array.from(new Set(logs.map((log: AuditLog) => log.userId)));
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = new Map(users.map((u: User) => [u._id!.toString(), u.email]));

    const logsWithUserInfo = logs.map((log: AuditLog) => ({
      ...log,
      userEmail: userMap.get(log.userId.toString()),
      previousValue: undefined,
      newValue: undefined,
    }));

    return NextResponse.json({ logs: logsWithUserInfo });
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
