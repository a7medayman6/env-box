import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Team, TeamMember, User } from '@/lib/types';
import { ObjectId, Db } from 'mongodb';

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

// GET /api/teams/[id]/members - List team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const db = await getDb();
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');
    const usersCollection = db.collection<User>('users');

    const teamId = new ObjectId(params.id);
    
    // Check if user is a member of this team
    const membership = await teamMembersCollection.findOne({ 
      userId: user.userId,
      teamId 
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
    }

    // Get all members
    const members = await teamMembersCollection.find({ teamId }).toArray();
    
    // Get user details for each member
    const userIds = members.map(m => m.userId);
    const users = await usersCollection.find({ _id: { $in: userIds } }).toArray();
    const userMap = new Map(users.map(u => [u._id!.toString(), u]));

    const membersWithUserInfo = members.map(member => {
      const memberUser = userMap.get(member.userId.toString());
      return {
        _id: member._id,
        userId: member.userId,
        email: memberUser?.email,
        name: memberUser?.name,
        title: member.title,
        role: member.role,
        canDownload: member.canDownload,
        joinedAt: member.joinedAt,
      };
    });

    return NextResponse.json({ members: membersWithUserInfo });
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

// PUT /api/teams/[id]/members - Update member permissions (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { userId, canDownload, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    const teamId = new ObjectId(params.id);
    const targetUserId = new ObjectId(userId);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Can't modify yourself
    if (user.userId.toString() === targetUserId.toString()) {
      return NextResponse.json(
        { error: 'Cannot modify your own permissions or role' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (canDownload !== undefined) updates.canDownload = canDownload;
    if (role !== undefined) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Update member
    const result = await teamMembersCollection.updateOne(
      { teamId, userId: targetUserId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
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

// DELETE /api/teams/[id]/members - Remove member (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    const teamId = new ObjectId(params.id);
    const targetUserId = new ObjectId(userId);
    
    // Check admin
    const isAdmin = await requireTeamAdmin(user.userId, teamId, db);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Can't remove yourself
    if (user.userId.toString() === targetUserId.toString()) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400 }
      );
    }

    // Remove member
    const result = await teamMembersCollection.deleteOne({
      teamId,
      userId: targetUserId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
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
