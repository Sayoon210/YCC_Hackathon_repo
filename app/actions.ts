'use server';

import { createClient } from '@/utils/supabase/server';
import { Task, User } from '@/types/task';
import { revalidatePath } from 'next/cache';

// System Logging Utility
async function logSystemAction(
    supabase: any,
    userId: string,
    actionType: string,
    details: string,
    relatedTaskId?: number
) {
    const { error } = await supabase
        .from('system_logs')
        .insert({
            user_id: userId,
            action_type: actionType,
            details: details,
            related_task_id: relatedTaskId || null
        });

    if (error) {
        console.error('Error logging system action:', error);
    }
}

export async function getSystemLogs() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('system_logs')
        .select(`
            *,
            user:users!user_id (
                name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching system logs:', error);
        return [];
    }

    return data;
}

export async function getUsers(): Promise<User[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data as User[];
}

export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    // Fetch user details from public.users table
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    return userData as User | null;
}

export async function getTasks(): Promise<Task[]> {
    const supabase = await createClient();

    // Get current user to fetch their votes
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('tasks')
        .select(`
      *,
      assignee:users!member_id (
        name
      )
    `)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    // If user is logged in, fetch their votes for these tasks
    let userVotes: { [taskId: number]: number } = {};
    if (user) {
        const taskIds = data.map(t => t.id);
        const { data: votesData } = await supabase
            .from('votes')
            .select('task_id, score')
            .eq('user_id', user.id)
            .in('task_id', taskIds);

        if (votesData) {
            userVotes = votesData.reduce((acc, vote) => {
                acc[vote.task_id] = vote.score;
                return acc;
            }, {} as { [taskId: number]: number });
        }
    }

    // Fetch activities for all tasks
    const taskIds = data.map(t => t.id);
    const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .in('task_id', taskIds)
        .order('sequence', { ascending: true });

    // Group activities by task_id
    const activitiesByTask: { [taskId: number]: any[] } = {};
    if (activitiesData) {
        activitiesData.forEach(activity => {
            if (!activitiesByTask[activity.task_id]) {
                activitiesByTask[activity.task_id] = [];
            }
            activitiesByTask[activity.task_id].push(activity);
        });
    }

    // Fetch achievement reviews for current user
    let userReviews: { [taskId: number]: any } = {};
    let reviewCounts: { [taskId: number]: number } = {};

    if (user) {
        const { data: reviewsData } = await supabase
            .from('achievement_reviews')
            .select('*')
            .eq('reviewer_id', user.id)
            .in('task_id', taskIds);

        if (reviewsData) {
            userReviews = reviewsData.reduce((acc, review) => {
                acc[review.task_id] = review;
                return acc;
            }, {} as { [taskId: number]: any });
        }
    }

    // Fetch review counts for all tasks
    const { data: countsData } = await supabase
        .from('achievement_reviews')
        .select('task_id');

    if (countsData) {
        reviewCounts = countsData.reduce((acc: any, curr) => {
            acc[curr.task_id] = (acc[curr.task_id] || 0) + 1;
            return acc;
        }, {});
    }

    // Map DB result to Task interface
    const mappedTasks = data.map((item: any) => ({
        ...item,
        assignee_name: item.assignee?.name || 'Unassigned',
        my_vote: userVotes[item.id] || undefined,
        activities: activitiesByTask[item.id] || [],
        my_review: userReviews[item.id] || undefined,
        reviews_count: reviewCounts[item.id] || 0,
    }));

    return mappedTasks;
}

export async function submitAchievementReview(taskId: number, score: number) {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Must be logged in' };

    // 2. Check Task & Assignee
    const { data: task } = await supabase
        .from('tasks')
        .select('member_id, total_score')
        .eq('id', taskId)
        .single();

    if (!task) return { error: 'Task not found' };
    if (task.member_id === user.id) return { error: 'Cannot review your own task' };

    // 3. Check Activities (Prerequisite)
    const { count: activityCount } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId);

    if (!activityCount || activityCount === 0) {
        return { error: 'Task has no activity reports' };
    }

    // 4. Upsert Review
    const { error: reviewError } = await supabase
        .from('achievement_reviews')
        .upsert({
            task_id: taskId,
            reviewer_id: user.id,
            score: score
        }, { onConflict: 'task_id,reviewer_id' });

    if (reviewError) return { error: reviewError.message };

    // Log Action
    await logSystemAction(supabase, user.id, 'REVIEW', `Evaluated achievement with score ${score}`, taskId);

    // 5. Check Completion & Calculate Score
    // Get total team size
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (!totalUsers) return { success: true }; // Should not happen

    // Get current review count for this task
    const { data: reviews } = await supabase
        .from('achievement_reviews')
        .select('score')
        .eq('task_id', taskId);

    const currentReviewCount = reviews?.length || 0;
    const requiredReviews = totalUsers - 1; // Exclude assignee

    // If all reviews are in, calculate final score
    if (currentReviewCount >= requiredReviews) {
        const maxPossibleScore = requiredReviews * 5;
        const actualScoreSum = reviews?.reduce((sum, r) => sum + r.score, 0) || 0;
        const ratio = actualScoreSum / maxPossibleScore;

        // Calculate final achieved score (based on task.total_score * ratio)
        // Round to nearest integer
        const finalAchievedScore = Math.round(task.total_score * ratio);

        // Update task
        await supabase
            .from('tasks')
            .update({ achieved_score: finalAchievedScore })
            .eq('id', taskId);
    }

    revalidatePath('/');
    return { success: true };
}

export async function createTask(formData: FormData) {
    const supabase = await createClient();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title,
            description: description || null,
            member_id: null, // Always start unassigned
            total_score: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        return { error: error.message };
    }

    if (user) {
        await logSystemAction(supabase, user.id, 'CREATE', `Created task '${title}'`, data.id);
    }

    revalidatePath('/');
    return { success: true };
}

export async function updateTask(task: Task) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('tasks')
        .update({
            title: task.title,
            description: task.description,
            member_id: task.member_id,
            total_score: task.total_score,
        })
        .eq('id', task.id);

    if (error) {
        console.error('Error updating task:', error);
        return { error: error.message };
    }

    if (user) {
        await logSystemAction(supabase, user.id, 'UPDATE', `Updated task '${task.title}'`, task.id);
    }

    // Recalculate achieved_score if reviews are complete (in case total_score changed)
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (totalUsers) {
        const { data: reviews } = await supabase
            .from('achievement_reviews')
            .select('score')
            .eq('task_id', task.id);

        const currentReviewCount = reviews?.length || 0;
        const requiredReviews = totalUsers - 1;

        if (currentReviewCount >= requiredReviews && requiredReviews > 0) {
            const maxPossibleScore = requiredReviews * 5;
            const actualScoreSum = reviews?.reduce((sum, r) => sum + r.score, 0) || 0;
            const ratio = actualScoreSum / maxPossibleScore;

            const finalAchievedScore = Math.round(task.total_score * ratio);

            await supabase
                .from('tasks')
                .update({ achieved_score: finalAchievedScore })
                .eq('id', task.id);
        }
    }

    revalidatePath('/');
    return { success: true };
}

export async function submitVote(taskId: number, score: number) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'You must be logged in to vote' };
    }

    // Upsert vote (insert or update)
    const { error: voteError } = await supabase
        .from('votes')
        .upsert({
            task_id: taskId,
            user_id: user.id,
            score: score,
        }, {
            onConflict: 'task_id,user_id'
        });

    if (voteError) {
        console.error('Error submitting vote:', voteError);
        return { error: voteError.message };
    }

    // Log Action - Removed to reduce noise as per user request
    // await logSystemAction(supabase, user.id, 'VOTE', `Voted ${score} points`, taskId);

    // Recalculate total_score by summing all votes for this task
    const { data: votesData, error: sumError } = await supabase
        .from('votes')
        .select('score')
        .eq('task_id', taskId);

    if (sumError) {
        console.error('Error calculating total:', sumError);
        return { error: sumError.message };
    }

    const totalScore = votesData.reduce((sum, vote) => sum + Number(vote.score), 0);

    // Update tasks table with new total
    const { error: updateError } = await supabase
        .from('tasks')
        .update({ total_score: totalScore })
        .eq('id', taskId);

    if (updateError) {
        console.error('Error updating task total:', updateError);
        return { error: updateError.message };
    }

    // Recalculate achieved_score if reviews are complete
    // 1. Get total team size
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (totalUsers) {
        // 2. Get current reviews
        const { data: reviews } = await supabase
            .from('achievement_reviews')
            .select('score')
            .eq('task_id', taskId);

        const currentReviewCount = reviews?.length || 0;
        const requiredReviews = totalUsers - 1; // Exclude assignee

        // 3. If reviews are complete, recalculate achieved_score with new total_score
        if (currentReviewCount >= requiredReviews && requiredReviews > 0) {
            const maxPossibleScore = requiredReviews * 5;
            const actualScoreSum = reviews?.reduce((sum, r) => sum + r.score, 0) || 0;
            const ratio = actualScoreSum / maxPossibleScore;

            // Calculate final achieved score based on NEW total_score
            const finalAchievedScore = Math.round(totalScore * ratio);

            // Update task
            await supabase
                .from('tasks')
                .update({ achieved_score: finalAchievedScore })
                .eq('id', taskId);
        }
    }

    revalidatePath('/');
    return { success: true };
}

export async function deleteTask(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return { error: error.message };
    }

    if (user) {
        await logSystemAction(supabase, user.id, 'DELETE', `Deleted task #${id}`, id);
    }

    revalidatePath('/');
    return { success: true };
}

export async function claimTask(taskId: number) {
    const supabase = await createClient();

    // Get current user from session (now works with cookies!)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Auth error:', authError);
        return { error: 'You must be logged in to claim a task' };
    }

    console.log('Claiming task for user:', user.id);

    // Update task to assign to current user
    const { error } = await supabase
        .from('tasks')
        .update({ member_id: user.id })
        .eq('id', taskId);

    if (error) {
        console.error('Error claiming task:', error);
        return { error: error.message };
    }

    // Log Action
    await logSystemAction(supabase, user.id, 'CLAIM', `Claimed task`, taskId);

    revalidatePath('/');
    return { success: true };
}

export async function submitActivity(taskId: number, formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'You must be logged in to submit an activity' };
    }

    // Verify user is the assignee
    const { data: task } = await supabase
        .from('tasks')
        .select('member_id')
        .eq('id', taskId)
        .single();

    if (!task || task.member_id !== user.id) {
        return { error: 'Only the task assignee can submit activities' };
    }

    // Get next sequence number
    const { data: existingActivities } = await supabase
        .from('activities')
        .select('sequence')
        .eq('task_id', taskId)
        .order('sequence', { ascending: false })
        .limit(1);

    const nextSequence = existingActivities && existingActivities.length > 0
        ? existingActivities[0].sequence + 1
        : 1;

    // Handle file upload if provided
    let fileUrl: string | null = null;
    const file = formData.get('file') as File | null;

    if (file && file.size > 0) {
        const fileName = `${taskId}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('activity-proofs')
            .upload(fileName, file);

        if (uploadError) {
            console.error('File upload error:', uploadError);
            return { error: 'Failed to upload file' };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('activity-proofs')
            .getPublicUrl(fileName);

        fileUrl = publicUrl;
    }

    // Insert activity
    const { error: insertError } = await supabase
        .from('activities')
        .insert({
            task_id: taskId,
            user_id: user.id,
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            file_url: fileUrl,
            sequence: nextSequence,
        });

    if (insertError) {
        console.error('Error creating activity:', insertError);
        return { error: insertError.message };
    }

    // Log Action
    await logSystemAction(supabase, user.id, 'REPORT', `Submitted activity report #${nextSequence}`, taskId);

    revalidatePath('/');
    return { success: true };
}

