import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskStatus, TaskType } from '@prisma/client';

interface EmployeeSuggestion {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  confidenceScore: number;
  estimatedCompletion: number;
  reasoning: {
    performanceScore: number;
    currentWorkload: number;
    workCapacity: number;
    skillMatch: number;
    pastExperience: number;
    onTimeRate: number;
    factors: string[];
  };
}

@Injectable()
export class WorkAssignmentService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
  ) {}

  /**
   * Get AI-powered suggestions for task assignment
   */
  async suggestEmployeesForTask(
    taskId: string,
    requiredSkills?: string[],
  ): Promise<EmployeeSuggestion[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        company: true,
        deal: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Get all available employees from the same company
    const employees = await this.prisma.user.findMany({
      where: {
        companyId: task.companyId,
        role: { in: ['EMPLOYEE', 'SALES'] },
      },
      include: {
        assignedTasks: {
          where: {
            status: {
              in: [
                TaskStatus.ASSIGNED,
                TaskStatus.IN_PROGRESS,
                TaskStatus.BLOCKED,
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    const suggestions: EmployeeSuggestion[] = [];

    for (const employee of employees) {
      // Skip if at or over capacity
      if (employee.currentWorkload >= employee.workCapacity) {
        continue;
      }

      // Calculate skill match
      const skillMatch = this.calculateSkillMatch(
        requiredSkills || this.extractTaskSkills(task),
        (employee.skillTags as string[]) || [],
      );

      // Find similar past tasks
      const similarTasks = await this.findSimilarTasks(task, employee.id);
      const avgCompletionTime =
        this.calculateAverageCompletionTime(similarTasks);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        employee,
        skillMatch,
        similarTasks.length,
      );

      // Generate reasoning factors
      const factors = this.generateReasoningFactors(
        employee,
        skillMatch,
        similarTasks.length,
      );

      suggestions.push({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        confidenceScore,
        estimatedCompletion: avgCompletionTime || task.estimatedHours || 8,
        reasoning: {
          performanceScore: employee.performanceScore,
          currentWorkload: employee.currentWorkload,
          workCapacity: employee.workCapacity,
          skillMatch,
          pastExperience: similarTasks.length,
          onTimeRate: employee.onTimeCompletionRate,
          factors,
        },
      });
    }

    // Sort by confidence score (highest first)
    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Create work suggestions in database (top 3)
    const topSuggestions = suggestions.slice(0, 3);
    for (const suggestion of topSuggestions) {
      await this.prisma.workSuggestion.create({
        data: {
          taskId,
          suggestedUserId: suggestion.employeeId,
          confidenceScore: suggestion.confidenceScore,
          estimatedCompletion: suggestion.estimatedCompletion,
          reasoning: suggestion.reasoning as any,
        },
      });
    }

    return suggestions;
  }

  /**
   * Calculate skill match percentage
   */
  private calculateSkillMatch(
    requiredSkills: string[],
    employeeSkills: string[],
  ): number {
    if (requiredSkills.length === 0) {
      return 50; // Default if no specific skills required
    }

    const normalizedRequired = requiredSkills.map((s) =>
      s.toLowerCase().trim(),
    );
    const normalizedEmployee = employeeSkills.map((s) =>
      s.toLowerCase().trim(),
    );

    let matchCount = 0;
    for (const required of normalizedRequired) {
      if (
        normalizedEmployee.some(
          (emp) => emp.includes(required) || required.includes(emp),
        )
      ) {
        matchCount++;
      }
    }

    return (matchCount / normalizedRequired.length) * 100;
  }

  /**
   * Extract skills from task based on type and description
   */
  private extractTaskSkills(task: any): string[] {
    const skills: string[] = [];

    // Map task types to common skills
    const typeSkillMap: Record<TaskType, string[]> = {
      [TaskType.DEVELOPMENT]: ['Programming', 'Coding', 'Development'],
      [TaskType.DESIGN]: ['Design', 'UI/UX', 'Graphics'],
      [TaskType.SALES]: ['Sales', 'Communication', 'Negotiation'],
      [TaskType.MARKETING]: ['Marketing', 'Content', 'Social Media'],
      [TaskType.SUPPORT]: ['Customer Service', 'Support', 'Communication'],
      [TaskType.RESEARCH]: ['Research', 'Analysis', 'Documentation'],
      [TaskType.GENERAL]: [],
    };

    skills.push(...(typeSkillMap[task.type] || []));

    // Extract keywords from title and description
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    const keywords = [
      'react',
      'vue',
      'angular',
      'typescript',
      'javascript',
      'python',
      'java',
      'node',
      'backend',
      'frontend',
      'fullstack',
      'database',
      'sql',
      'api',
      'ui',
      'ux',
      'design',
      'figma',
      'photoshop',
    ];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        skills.push(keyword);
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Find similar tasks completed by employee
   */
  private async findSimilarTasks(task: any, employeeId: string) {
    return this.prisma.task.findMany({
      where: {
        assignedToId: employeeId,
        status: TaskStatus.COMPLETED,
        OR: [
          { type: task.type },
          { dealId: task.dealId, dealId: { not: null } },
          { companyId: task.companyId },
        ],
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Calculate average completion time from similar tasks
   */
  private calculateAverageCompletionTime(tasks: any[]): number | null {
    if (tasks.length === 0) return null;

    const tasksWithHours = tasks.filter((t) => t.actualHours);
    if (tasksWithHours.length === 0) return null;

    const totalHours = tasksWithHours.reduce(
      (sum, t) => sum + t.actualHours,
      0,
    );
    return totalHours / tasksWithHours.length;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidenceScore(
    employee: any,
    skillMatch: number,
    similarTaskCount: number,
  ): number {
    const performanceWeight = 0.4;
    const availabilityWeight = 0.3;
    const skillWeight = 0.2;
    const experienceWeight = 0.1;

    const performanceScore = employee.performanceScore / 100;
    const availabilityScore =
      1 - employee.currentWorkload / employee.workCapacity;
    const skillScore = skillMatch / 100;
    const experienceScore = Math.min(1, similarTaskCount / 5); // Max score at 5+ similar tasks

    const confidence =
      performanceScore * performanceWeight +
      availabilityScore * availabilityWeight +
      skillScore * skillWeight +
      experienceScore * experienceWeight;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate human-readable reasoning factors
   */
  private generateReasoningFactors(
    employee: any,
    skillMatch: number,
    similarTaskCount: number,
  ): string[] {
    const factors: string[] = [];

    // Performance
    if (employee.performanceScore >= 80) {
      factors.push('High performance score');
    } else if (employee.performanceScore >= 60) {
      factors.push('Good performance score');
    }

    // Workload
    const utilizationRate = employee.currentWorkload / employee.workCapacity;
    if (utilizationRate < 0.4) {
      factors.push('Low workload - Available');
    } else if (utilizationRate < 0.7) {
      factors.push('Moderate workload');
    } else {
      factors.push('High workload - Near capacity');
    }

    // Skills
    if (skillMatch >= 80) {
      factors.push('Excellent skill match');
    } else if (skillMatch >= 50) {
      factors.push('Good skill match');
    } else if (skillMatch > 0) {
      factors.push('Some relevant skills');
    }

    // Experience
    if (similarTaskCount >= 5) {
      factors.push('Extensive experience with similar tasks');
    } else if (similarTaskCount >= 2) {
      factors.push('Some experience with similar tasks');
    }

    // On-time rate
    if (employee.onTimeCompletionRate >= 90) {
      factors.push('Excellent on-time delivery rate');
    } else if (employee.onTimeCompletionRate >= 75) {
      factors.push('Good on-time delivery rate');
    }

    return factors;
  }

  /**
   * Get pending suggestions
   */
  async getPendingSuggestions(companyId?: string) {
    const where: any = {
      status: 'pending',
    };

    const suggestions = await this.prisma.workSuggestion.findMany({
      where,
      include: {
        suggestedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            performanceScore: true,
            currentWorkload: true,
            workCapacity: true,
          },
        },
      },
      orderBy: [{ confidenceScore: 'desc' }, { createdAt: 'desc' }],
    });

    // Filter by company if provided
    if (companyId) {
      const tasks = await this.prisma.task.findMany({
        where: {
          id: { in: suggestions.map((s) => s.taskId) },
          companyId,
        },
        select: { id: true },
      });
      const taskIds = new Set(tasks.map((t) => t.id));
      return suggestions.filter((s) => taskIds.has(s.taskId));
    }

    return suggestions;
  }

  /**
   * Accept a suggestion and assign the task
   */
  async acceptSuggestion(suggestionId: string, acceptedById: string) {
    const suggestion = await this.prisma.workSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        suggestedUser: true,
      },
    });

    if (!suggestion) {
      throw new NotFoundException(
        `Suggestion with ID ${suggestionId} not found`,
      );
    }

    if (suggestion.status !== 'pending') {
      throw new BadRequestException(
        'This suggestion has already been processed',
      );
    }

    // Update suggestion status
    await this.prisma.workSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    // Assign the task
    await this.tasksService.assignTask(
      suggestion.taskId,
      { assignedToId: suggestion.suggestedUserId },
      acceptedById,
    );

    // Mark other suggestions for this task as rejected
    await this.prisma.workSuggestion.updateMany({
      where: {
        taskId: suggestion.taskId,
        id: { not: suggestionId },
        status: 'pending',
      },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedReason: 'Another suggestion was accepted',
      },
    });

    return {
      message: `Task assigned to ${suggestion.suggestedUser.name}`,
      suggestion,
    };
  }

  /**
   * Reject a suggestion
   */
  async rejectSuggestion(suggestionId: string, reason?: string) {
    const suggestion = await this.prisma.workSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException(
        `Suggestion with ID ${suggestionId} not found`,
      );
    }

    if (suggestion.status !== 'pending') {
      throw new BadRequestException(
        'This suggestion has already been processed',
      );
    }

    await this.prisma.workSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedReason: reason || 'Manually rejected',
      },
    });

    return {
      message: 'Suggestion rejected',
      suggestion,
    };
  }

  /**
   * Auto-assign task to best employee
   */
  async autoAssignTask(
    taskId: string,
    requiredSkills?: string[],
    assignedById?: string,
  ) {
    const suggestions = await this.suggestEmployeesForTask(
      taskId,
      requiredSkills,
    );

    if (suggestions.length === 0) {
      throw new BadRequestException(
        'No available employees found for this task',
      );
    }

    // Get the best suggestion (highest confidence)
    const bestSuggestion = suggestions[0];

    // Find the work suggestion in database
    const workSuggestion = await this.prisma.workSuggestion.findFirst({
      where: {
        taskId,
        suggestedUserId: bestSuggestion.employeeId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!workSuggestion) {
      throw new BadRequestException('Could not create work suggestion');
    }

    // Accept the best suggestion
    return this.acceptSuggestion(workSuggestion.id, assignedById || 'system');
  }

  /**
   * Get suggestions for a specific task
   */
  async getTaskSuggestions(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.workSuggestion.findMany({
      where: { taskId },
      include: {
        suggestedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            performanceScore: true,
            currentWorkload: true,
            workCapacity: true,
            skillTags: true,
          },
        },
      },
      orderBy: { confidenceScore: 'desc' },
    });
  }
}
