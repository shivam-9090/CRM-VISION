// Score/Points System for Task Verification and Employee Performance

export interface ScoreRecord {
  id: string;
  employeeId: string;
  taskId: string;
  pointsAwarded: number;
  reason: string; // "completion", "on-time", "quality-bonus", "manual-adjustment"
  feedback: string;
  awardedBy: string; // manager name
  awardedAt: string;
}

export interface EmployeeScore {
  id: string;
  employeeId: string;
  totalScore: number;
  tasksCompleted: number;
  tasksVerified: number;
  averageScorePerTask: number;
  scoreHistory: ScoreRecord[];
  lastUpdated: string;
}

// Point calculation logic
export const calculateTaskScore = (data: {
  completed: boolean;
  onTime: boolean;
  qualityRating?: number; // 1-5
  managerBonus?: number;
  basePoints?: number;
}) => {
  let score = data.basePoints || 10;

  // Base points for completion
  if (!data.completed) return 0;

  // Bonus for on-time completion
  if (data.onTime) score += 5;

  // Quality bonus (1-5 rating)
  if (data.qualityRating) {
    const qualityBonus = Math.floor((data.qualityRating / 5) * 10);
    score += qualityBonus;
  }

  // Manager manual adjustment
  if (data.managerBonus) score += data.managerBonus;

  return Math.max(0, Math.min(score, 100)); // Cap at 0-100
};

// Determine if task was completed on time
export const isOnTime = (dueDate: string, completedAt: string): boolean => {
  return new Date(completedAt) <= new Date(dueDate);
};

// Performance tier based on score
export const getPerformanceTier = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Satisfactory";
  if (score >= 40) return "Needs Improvement";
  return "Below Expectations";
};

// Performance badge color
export const getPerformanceColor = (tier: string) => {
  switch (tier) {
    case "Excellent":
      return "bg-green-100 text-green-800";
    case "Good":
      return "bg-blue-100 text-blue-800";
    case "Satisfactory":
      return "bg-yellow-100 text-yellow-800";
    case "Needs Improvement":
      return "bg-orange-100 text-orange-800";
    case "Below Expectations":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
