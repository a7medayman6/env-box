import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { User, TeamMember, Team } from '@/lib/types';

// GET /api/user/profile - Get current user profile with team info
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');
    const teamsCollection = db.collection<Team>('teams');

    const userDoc = await usersCollection.findOne({ _id: user.userId });
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team membership
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    
    let teamInfo = null;
    if (membership) {
      const team = await teamsCollection.findOne({ _id: membership.teamId });
      if (team) {
        const memberCount = await teamMembersCollection.countDocuments({ teamId: team._id });
        teamInfo = {
          _id: team._id,
          name: team.name,
          environments: team.environments,
          memberCount,
          role: membership.role,
          title: membership.title,
          canDownload: membership.canDownload,
          joinedAt: membership.joinedAt,
        };
      }
    }

    return NextResponse.json({
      user: {
        _id: userDoc._id,
        email: userDoc.email,
        name: userDoc.name,
        createdAt: userDoc.createdAt,
      },
      team: teamInfo,
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

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { name, title } = await request.json();

    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Update user name if provided
    if (name !== undefined) {
      await usersCollection.updateOne(
        { _id: user.userId },
        { $set: { name: name?.trim() || null } }
      );
    }

    // Update team title if provided
    if (title !== undefined) {
      await teamMembersCollection.updateOne(
        { userId: user.userId },
        { $set: { title: title?.trim() || null } }
      );
    }

    // Return updated profile
    const userDoc = await usersCollection.findOne({ _id: user.userId });
    const membership = await teamMembersCollection.findOne({ userId: user.userId });

    return NextResponse.json({
      user: {
        _id: userDoc!._id,
        email: userDoc!.email,
        name: userDoc!.name,
        createdAt: userDoc!.createdAt,
      },
      membership: membership ? {
        title: membership.title,
        role: membership.role,
        canDownload: membership.canDownload,
      } : null,
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
