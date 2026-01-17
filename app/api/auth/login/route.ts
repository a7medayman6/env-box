import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/jwt';
import { User, Team, TeamMember } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');
    const teamsCollection = db.collection<Team>('teams');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = signToken(user._id!, email);

    // Get team info
    const membership = await teamMembersCollection.findOne({ userId: user._id });
    let teamInfo = null;
    
    if (membership) {
      const team = await teamsCollection.findOne({ _id: membership.teamId });
      if (team) {
        teamInfo = {
          _id: team._id,
          name: team.name,
          role: membership.role,
          canDownload: membership.canDownload,
        };
      }
    }

    return NextResponse.json({
      token,
      userId: user._id,
      email: user.email,
      name: user.name,
      team: teamInfo,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
