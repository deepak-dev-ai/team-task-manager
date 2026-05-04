import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    // Verify user is Admin of project
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: session.user.id,
        },
      },
    });

    if (!currentMember || currentMember.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can add members' }, { status: 403 });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 400 });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: role === 'Admin' ? 'Admin' : 'Member',
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
