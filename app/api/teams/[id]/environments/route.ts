import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Team, TeamMember } from '@/lib/types';
import { ObjectId, Db } from 'mongodb';

export const dynamic = 'force-dynamic';

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

// GET /api/teams/[id]/environments - List environments
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

    return NextResponse.json({ environments: team.environments });
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

// POST /api/teams/[id]/environments - Add new environment (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Environment name is required' },
        { status: 400 }
      );
    }

    // Validate environment name (lowercase, alphanumeric, hyphens)
    const envName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!/^[a-z0-9-]+$/.test(envName)) {
      return NextResponse.json(
        { error: 'Environment name must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');

    const teamId = new ObjectId(params.id);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const team = await teamsCollection.findOne({ _id: teamId });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if environment already exists
    if (team.environments.includes(envName)) {
      return NextResponse.json(
        { error: 'Environment already exists' },
        { status: 400 }
      );
    }

    // Add environment
    await teamsCollection.updateOne(
      { _id: teamId },
      { $push: { environments: envName } }
    );

    const updatedTeam = await teamsCollection.findOne({ _id: teamId });

    return NextResponse.json(
      { environments: updatedTeam!.environments },
      { status: 201 }
    );
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

// DELETE /api/teams/[id]/environments - Remove environment (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const envName = searchParams.get('name');

    if (!envName) {
      return NextResponse.json(
        { error: 'Environment name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');

    const teamId = new ObjectId(params.id);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const team = await teamsCollection.findOne({ _id: teamId });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Must have at least one environment
    if (team.environments.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last environment' },
        { status: 400 }
      );
    }

    // Check if environment exists
    if (!team.environments.includes(envName)) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      );
    }

    // Remove environment
    await teamsCollection.updateOne(
      { _id: teamId },
      { $pull: { environments: envName } }
    );

    // Note: Variables in this environment are NOT deleted - they become orphaned
    // This is by design, in case the environment is re-added later

    const updatedTeam = await teamsCollection.findOne({ _id: teamId });

    return NextResponse.json({ environments: updatedTeam!.environments });
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
