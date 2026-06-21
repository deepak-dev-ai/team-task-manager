import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const maxDuration = 30; // Max execution time for Next.js routes

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, projectId } = await req.json();

    if (!projectId) {
      return new Response('Project ID is required', { status: 400 });
    }

    // 2. Verify project membership
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return new Response('Forbidden', { status: 403 });
    }

    const userRole = member.role; // 'Admin' or 'Member'

    // 3. Stream text from Gemini model with task-management tools
    const result = await streamText({
      model: google('gemini-1.5-flash'), // Lightweight, fast, and highly capable
      messages,
      system: `You are an Autonomous Project Manager Agent in the Team Task Manager application.
Your goal is to assist team members and admins in managing tasks, understanding project status, and optimizing their workflow.

Current Project Context:
- Project ID: ${projectId}
- Logged-in User ID: ${session.user.id}
- User's Project Role: ${userRole} (Admins can perform all actions, Members can only update task statuses).

Instructions:
1. Use the provided tools to query, create, update, or delete tasks and project details.
2. If the user asks you to perform an action (like creating a task, assigning a task, or deleting a task) and they are a 'Member', politely remind them that only 'Admin' users have permission to edit task fields other than status, then offer to help update task status instead.
3. If they ask to update a task status, you can do this for any user.
4. When listing tasks, format them clearly with bullet points, status, assignee, priority, and due dates.
5. If the user wants to break down a high-level goal, analyze their prompt, formulate a series of tasks, and call 'createTask' for each of them (if user has Admin role).
6. Speak professionally, and be extremely helpful.`,
      tools: {
        getProjectInfo: tool({
          description: 'Get general information about the project and its members.',
          inputSchema: z.object({}),
          execute: async () => {
            const project = await prisma.project.findUnique({
              where: { id: projectId },
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true }
                    }
                  }
                }
              }
            });
            if (!project) return { error: 'Project not found' };
            return {
              name: project.name,
              description: project.description,
              members: project.members.map((m: any) => ({
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                role: m.role
              }))
            };
          }
        }),
        listTasks: tool({
          description: 'Get all tasks associated with this project.',
          inputSchema: z.object({}),
          execute: async () => {
            const tasks = await prisma.task.findMany({
              where: { projectId },
              include: {
                assignee: {
                  select: { id: true, name: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            });
            return tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
              assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null
            }));
          }
        }),
        createTask: tool({
          description: 'Create a new task in this project (Requires Admin role).',
          inputSchema: z.object({
            title: z.string().describe('The title of the task'),
            description: z.string().optional().describe('The description of the task'),
            priority: z.enum(['Low', 'Medium', 'High']).optional().default('Medium').describe('Priority level'),
            status: z.enum(['To Do', 'In Progress', 'Done']).optional().default('To Do').describe('Task status'),
            dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
            assigneeId: z.string().optional().describe('User ID of the assignee')
          }),
          execute: async ({ title, description, priority, status, dueDate, assigneeId }) => {
            if (userRole !== 'Admin') {
              return { error: 'Unauthorized: Only Admins can create tasks.' };
            }
            try {
              const task = await prisma.task.create({
                data: {
                  title,
                  description,
                  priority,
                  status,
                  dueDate: dueDate ? new Date(dueDate) : null,
                  projectId,
                  assigneeId: assigneeId || null
                },
                include: {
                  assignee: { select: { id: true, name: true } }
                }
              });
              return { success: true, task: {
                id: task.id,
                title: task.title,
                status: task.status,
                assignee: task.assignee?.name || 'Unassigned'
              } };
            } catch (err: any) {
              return { error: err.message || 'Failed to create task' };
            }
          }
        }),
        updateTask: tool({
          description: 'Update an existing task status, priority, description, title, due date, or assignee.',
          inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to update'),
            title: z.string().optional().describe('The updated title'),
            description: z.string().optional().describe('The updated description'),
            priority: z.enum(['Low', 'Medium', 'High']).optional().describe('The updated priority'),
            status: z.enum(['To Do', 'In Progress', 'Done']).optional().describe('The updated status'),
            dueDate: z.string().nullable().optional().describe('Due date in YYYY-MM-DD format, or null to clear'),
            assigneeId: z.string().nullable().optional().describe('User ID of the assignee, or null to unassign')
          }),
          execute: async ({ taskId, title, description, priority, status, dueDate, assigneeId }) => {
            // Verify task belongs to this project
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task || task.projectId !== projectId) {
              return { error: 'Task not found in this project' };
            }

            const updateData: any = {};
            if (userRole === 'Admin') {
              if (title !== undefined) updateData.title = title;
              if (description !== undefined) updateData.description = description;
              if (priority !== undefined) updateData.priority = priority;
              if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
              if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
              if (status !== undefined) updateData.status = status;
            } else {
              // Members can only update status
              if (title !== undefined || description !== undefined || priority !== undefined || dueDate !== undefined || assigneeId !== undefined) {
                return { error: 'Unauthorized: Members can only update task status.' };
              }
              if (status !== undefined) updateData.status = status;
            }

            try {
              const updated = await prisma.task.update({
                where: { id: taskId },
                data: updateData,
                include: { assignee: { select: { id: true, name: true } } }
              });
              return { success: true, task: {
                id: updated.id,
                title: updated.title,
                status: updated.status,
                assignee: updated.assignee?.name || 'Unassigned'
              } };
            } catch (err: any) {
              return { error: err.message || 'Failed to update task' };
            }
          }
        }),
        deleteTask: tool({
          description: 'Delete a task from the project (Requires Admin role).',
          inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to delete')
          }),
          execute: async ({ taskId }) => {
            if (userRole !== 'Admin') {
              return { error: 'Unauthorized: Only Admins can delete tasks.' };
            }

            // Verify task belongs to this project
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task || task.projectId !== projectId) {
              return { error: 'Task not found in this project' };
            }

            try {
              await prisma.task.delete({ where: { id: taskId } });
              return { success: true, message: 'Task deleted successfully' };
            } catch (err: any) {
              return { error: err.message || 'Failed to delete task' };
            }
          }
        })
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
