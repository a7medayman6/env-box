import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Variable, Project, TeamMember } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { decrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');
    const format = searchParams.get('format') || 'env';

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');
    const variablesCollection = db.collection<Variable>('variables');
    const teamMembersCollection = db.collection<TeamMember>('teamMembers');

    // Get user's team membership and check download permission
    const membership = await teamMembersCollection.findOne({ userId: user.userId });
    if (!membership) {
      return NextResponse.json({ error: 'No team membership' }, { status: 403 });
    }

    // Check if user can download
    if (!membership.canDownload) {
      return NextResponse.json(
        { error: 'You do not have permission to download environment files' },
        { status: 403 }
      );
    }

    const projectId = new ObjectId(params.id);
    const project = await projectsCollection.findOne({
      _id: projectId,
      teamId: membership.teamId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const variables = await variablesCollection
      .find({ projectId, environment })
      .toArray();

    const decryptedVariables = variables.map((v: Variable) => ({
      key: v.key,
      value: decrypt(v.valueEncrypted),
      description: v.description,
      isCommented: v.isCommented ?? false,
    }));

    if (format === 'json') {
      // For JSON, include commented status as metadata
      const jsonOutput = decryptedVariables.reduce((acc: Record<string, any>, v) => {
        if (v.isCommented) {
          acc[`#${v.key}`] = v.value;
        } else {
          acc[v.key] = v.value;
        }
        return acc;
      }, {} as Record<string, any>);

      return NextResponse.json(jsonOutput);
    }

    // For .env format, prefix commented variables with #
    const envContent = decryptedVariables
      .map((v: { key: string; value: string; description?: string; isCommented: boolean }) => {
        const lines = [];
        if (v.description) {
          lines.push(`# ${v.description}`);
        }
        const prefix = v.isCommented ? '# ' : '';
        lines.push(`${prefix}${v.key}=${v.value}`);
        return lines.join('\n');
      })
      .join('\n\n');

    return new NextResponse(envContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${project.name}-${environment}.env"`,
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
