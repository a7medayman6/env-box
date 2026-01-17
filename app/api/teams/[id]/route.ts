import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Team, TeamMember } from '@/lib/types';
import { ObjectId, Db } from 'mongodb';
import crypto from 'crypto';

// Helper to check if user is team admin
async function requireTeamAdmin(userId: ObjectId, teamId: ObjectId, db: Db): Promise<TeamMember | null> {
  const teamMembersCollection = db.collection<TeamMember>('teamMembers');
  const membership = await teamMembersCollection.findOne({ 
    userId, 
    teamId,
    role: 'admin'
  });
  return membership;
}

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    const teamId = new ObjectId(params.id);
    
    // Check if user is a member
    const membership = await teamMembersCollection.findOne({ 
      userId: user.userId,
      teamId 
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    const team = await teamsCollection.findOne({ _id: teamId });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const memberCount = await teamMembersCollection.countDocuments({ teamId });

    return NextResponse.json({
      team: {
        _id: team._id,
        name: team.name,
        environments: team.environments,
        joinCode: membership.role === 'admin' ? team.joinCode : undefined,
        memberCount,
        createdAt: team.createdAt,
      },
      membership: {
        role: membership.role,
        title: membership.title,
        canDownload: membership.canDownload,
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

// PUT /api/teams/[id] - Update team (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { name, password, regenerateCode } = await request.json();
    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');

    const teamId = new ObjectId(params.id);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const updates: any = {};

    if (name) {
      updates.name = name.trim();
    }

    if (password) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: 'Password must be at least 4 characters' },
          { status: 400 }
        );
      }
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (regenerateCode) {
      let joinCode: string;
      let codeExists = true;
      do {
        joinCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        codeExists = !!(await teamsCollection.findOne({ joinCode }));
      } while (codeExists);
      updates.joinCode = joinCode;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    await teamsCollection.updateOne(
      { _id: teamId },
      { $set: updates }
    );

    const team = await teamsCollection.findOne({ _id: teamId });

    return NextResponse.json({
      team: {
        _id: team!._id,
        name: team!.name,
        joinCode: team!.joinCode,
        environments: team!.environments,
        createdAt: team!.createdAt,
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

// DELETE /api/teams/[id] - Delete team (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    const teamId = new ObjectId(params.id);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete team and all members
    await teamMembersCollection.deleteMany({ teamId });
    await teamsCollection.deleteOne({ _id: teamId });

    // Also delete all projects and their variables
    const projectsCollection = db.collection('projects');
    const projects = await projectsCollection.find({ teamId }).toArray();
    const projectIds = projects.map(p => p._id);

    if (projectIds.length > 0) {
      await db.collection('variables').deleteMany({ projectId: { $in: projectIds } });
      await db.collection('auditLogs').deleteMany({ projectId: { $in: projectIds } });
      await projectsCollection.deleteMany({ teamId });
    }

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
