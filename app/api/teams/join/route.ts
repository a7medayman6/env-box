import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Team, TeamMember } from '@/lib/types';

// POST /api/teams/join - Join an existing team
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { joinCode, password, title } = await request.json();

    if (!joinCode || !password) {
      return NextResponse.json(
        { error: 'Join code and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const teamsCollection = db.collection<Team>('teams');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Check if user already has a team
    const existingMembership = await teamMembersCollection.findOne({ userId: user.userId });
    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of a team' },
        { status: 400 }
      );
    }

    // Find team by join code
    const team = await teamsCollection.findOne({ joinCode: joinCode.toUpperCase() });
    if (!team) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, team.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Add user to team
    await teamMembersCollection.insertOne({
      teamId: team._id!,
      userId: user.userId,
      title: title?.trim() || undefined,
      role: 'member',
      canDownload: true,
      joinedAt: new Date(),
    });

    return NextResponse.json({
      team: {
        _id: team._id,
        name: team.name,
        environments: team.environments,
        createdAt: team.createdAt,
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
