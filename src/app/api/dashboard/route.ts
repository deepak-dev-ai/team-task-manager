import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get projects the user is part of
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = projectMembers.map((pm: any) => pm.projectId);

    // Get all tasks in those projects
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
    });

    const totalTasks = tasks.length;
    const tasksByStatus = {
      'To Do': tasks.filter((t: any) => t.status === 'To Do').length,
      'In Progress': tasks.filter((t: any) => t.status === 'In Progress').length,
      'Done': tasks.filter((t: any) => t.status === 'Done').length,
    };

    const tasksAssignedToUser = tasks.filter((t: any) => t.assigneeId === userId).length;

    const now = new Date();
    const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;

    return NextResponse.json({
      totalTasks,
      tasksByStatus,
      tasksAssignedToUser,
      overdueTasks,
    });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
