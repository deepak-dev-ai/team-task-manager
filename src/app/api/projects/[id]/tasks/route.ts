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
    const { title, description, priority, dueDate, status, assigneeId } = await req.json();

    if (!title) {
      return NextResponse.json({ message: 'Task title is required' }, { status: 400 });
    }

    // Verify user is member of project (Only Admin can create task theoretically, but let's say Admin creates tasks)
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: session.user.id,
        },
      },
    });

    if (!member || member.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can create tasks' }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'To Do',
        projectId: id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
