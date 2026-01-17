import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Team, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// Generate unique 8-character join code
function generateJoinCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/teams - Get user's team info
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');
    const teamsCollection = db.collection<Team>('teams');

    // Find user's team membership
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    
    if (!membership) {
      return NextResponse.json({ team: null, membership: null });
    }

    const team = await teamsCollection.findOne({ _id: membership.teamId });
    
    if (!team) {
      return NextResponse.json({ team: null, membership: null });
    }

    // Count members
    const memberCount = await teamMembersCollection.countDocuments({ teamId: team._id });

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
        joinedAt: membership.joinedAt,
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

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Team name and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
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

    // Generate unique join code
    let joinCode: string;
    let codeExists = true;
    do {
      joinCode = generateJoinCode();
      codeExists = !!(await teamsCollection.findOne({ joinCode }));
    } while (codeExists);

    const passwordHash = await bcrypt.hash(password, 10);

    const teamResult = await teamsCollection.insertOne({
      name: name.trim(),
      joinCode,
      passwordHash,
      ownerId: user.userId,
      environments: ['development', 'staging', 'production'],
      createdAt: new Date(),
    });

    // Add creator as admin member
    await teamMembersCollection.insertOne({
      teamId: teamResult.insertedId,
      userId: user.userId,
      role: 'admin',
      canDownload: true,
      joinedAt: new Date(),
    });

    const team = await teamsCollection.findOne({ _id: teamResult.insertedId });

    return NextResponse.json(
      {
        team: {
          _id: team!._id,
          name: team!.name,
          joinCode: team!.joinCode,
          environments: team!.environments,
          createdAt: team!.createdAt,
        },
      },
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
