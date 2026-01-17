import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/jwt';
import { User, Team, TeamMember } from '@/lib/types';
import crypto from 'crypto';

// Generate unique 8-character join code
function generateJoinCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      name,
      title,
      // For creating a new team
      createTeam,
      teamName,
      teamPassword,
      // For joining an existing team
      joinTeam,
      joinCode,
    } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate team choice
    if (!createTeam && !joinTeam) {
      return NextResponse.json(
        { error: 'You must either create a team or join an existing one' },
        { status: 400 }
      );
    }

    if (createTeam && joinTeam) {
      return NextResponse.json(
        { error: 'Cannot both create and join a team' },
        { status: 400 }
      );
    }

    // Validate create team requirements
    if (createTeam) {
      if (!teamName || !teamPassword) {
        return NextResponse.json(
          { error: 'Team name and password are required when creating a team' },
          { status: 400 }
        );
      }
      if (teamPassword.length < 4) {
        return NextResponse.json(
          { error: 'Team password must be at least 4 characters' },
          { status: 400 }
        );
      }
    }

    // Validate join team requirements
    if (joinTeam) {
      if (!joinCode || !teamPassword) {
        return NextResponse.json(
          { error: 'Join code and team password are required when joining a team' },
          { status: 400 }
        );
      }
    }

    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const teamsCollection = db.collection<Team>('teams');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // If joining, verify the team exists and password is correct
    let teamToJoin: Team | null = null;
    if (joinTeam) {
      teamToJoin = await teamsCollection.findOne({ joinCode: joinCode.toUpperCase() });
      if (!teamToJoin) {
        return NextResponse.json(
          { error: 'Invalid join code' },
          { status: 400 }
        );
      }

      const isValidTeamPassword = await bcrypt.compare(teamPassword, teamToJoin.passwordHash);
      if (!isValidTeamPassword) {
        return NextResponse.json(
          { error: 'Invalid team password' },
          { status: 400 }
        );
      }
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await usersCollection.insertOne({
      email,
      name: name?.trim() || undefined,
      passwordHash,
      createdAt: new Date(),
    });

    const userId = userResult.insertedId;

    // Create or join team
    let teamId;
    let teamRole: 'admin' | 'member';

    if (createTeam) {
      // Generate unique join code
      let newJoinCode: string;
      let codeExists = true;
      do {
        newJoinCode = generateJoinCode();
        codeExists = !!(await teamsCollection.findOne({ joinCode: newJoinCode }));
      } while (codeExists);

      const teamPasswordHash = await bcrypt.hash(teamPassword, 10);

      const teamResult = await teamsCollection.insertOne({
        name: teamName.trim(),
        joinCode: newJoinCode,
        passwordHash: teamPasswordHash,
        ownerId: userId,
        environments: ['development', 'staging', 'production'],
        createdAt: new Date(),
      });

      teamId = teamResult.insertedId;
      teamRole = 'admin';
    } else {
      teamId = teamToJoin!._id!;
      teamRole = 'member';
    }

    // Add user to team
    await teamMembersCollection.insertOne({
      teamId,
      userId,
      title: title?.trim() || undefined,
      role: teamRole,
      canDownload: true,
      joinedAt: new Date(),
    });

    const token = signToken(userId, email);

    // Get team info for response
    const team = await teamsCollection.findOne({ _id: teamId });

    return NextResponse.json(
      { 
        token, 
        userId, 
        email,
        team: {
          _id: team!._id,
          name: team!.name,
          role: teamRole,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
