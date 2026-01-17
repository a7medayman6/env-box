import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Project, TeamMember } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Get user's team
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    
    if (!membership) {
      return NextResponse.json({ projects: [], noTeam: true });
    }

    // Get team's projects
    const projects = await projectsCollection
      .find({ teamId: membership.teamId })
      .toArray();

    return NextResponse.json({ projects });
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

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Get user's team
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    
    if (!membership) {
      return NextResponse.json(
        { error: 'You must be part of a team to create projects' },
        { status: 400 }
      );
    }

    const result = await projectsCollection.insertOne({
      name: name.trim(),
      teamId: membership.teamId,
      createdAt: new Date(),
    });

    const project = await projectsCollection.findOne({ _id: result.insertedId });

    return NextResponse.json({ project }, { status: 201 });
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
