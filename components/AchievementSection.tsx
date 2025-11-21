'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { submitAchievementReview } from '@/app/actions';
import { useState } from 'react';

interface AchievementSectionProps {
    task: Task;
    currentUserId?: string;
    totalTeamMembers?: number; // Optional, can default to a fixed number or be passed
}

export function AchievementSection({ task, currentUserId, totalTeamMembers = 5 }: AchievementSectionProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAssignee = task.member_id === currentUserId;
    const hasActivities = task.activities && task.activities.length > 0;
    const hasReviewed = !!task.my_review;
    const reviewCount = task.reviews_count || 0;

    // Assuming totalTeamMembers is passed or we can estimate. 
    // Ideally this comes from a prop or context. 
    // For now, let's assume the parent passes it or we display just the count.
    // The prompt mentioned "Evaluations: X / {TeamSize - 1}"
    // We'll use a placeholder if not provided, but the server logic handles the actual calculation.

    const handleVote = async (score: number) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        await submitAchievementReview(task.id, score);
        setIsSubmitting(false);
    };

    if (!hasActivities) {
        return (
            <div className="text-xs text-muted-foreground italic">
                Evaluation available after activity report submission.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Peer Achievement Review</h4>
                <Badge variant="outline" className="text-xs">
                    Evaluations: {reviewCount}
                </Badge>
            </div>

            {isAssignee ? (
                <div className="p-3 bg-muted/30 rounded-lg text-sm text-center text-muted-foreground">
                    {task.achieved_score !== null
                        ? `Final Achievement Score: ${task.achieved_score}`
                        : "Waiting for peer evaluations..."}
                </div>
            ) : hasReviewed ? (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center font-medium border border-green-200">
                    ✓ Review Submitted ({task.my_review?.score} pts)
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        onClick={() => handleVote(0)}
                        disabled={isSubmitting}
                    >
                        <span className="text-lg font-bold">0</span>
                        <span className="text-[10px] font-normal">Unapproved</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                        onClick={() => handleVote(2)}
                        disabled={isSubmitting}
                    >
                        <span className="text-lg font-bold">2</span>
                        <span className="text-[10px] font-normal">Not Satisfied</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-2 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
                        onClick={() => handleVote(3)}
                        disabled={isSubmitting}
                    >
                        <span className="text-lg font-bold">3</span>
                        <span className="text-[10px] font-normal">Minor Changes</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        onClick={() => handleVote(5)}
                        disabled={isSubmitting}
                    >
                        <span className="text-lg font-bold">5</span>
                        <span className="text-[10px] font-normal">Approved</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
