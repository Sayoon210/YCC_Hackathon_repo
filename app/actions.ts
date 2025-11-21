'use server';

import { createClient } from '@/utils/supabase/server';
import { Task, User } from '@/types/task';
import { revalidatePath } from 'next/cache';

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

    // Map DB result to Task interface
    const mappedTasks = data.map((item: any) => ({
        ...item,
        assignee_name: item.assignee?.name || 'Unassigned',
        my_vote: userVotes[item.id] || undefined,
    }));

    return mappedTasks;
}

export async function createTask(formData: FormData) {
    const supabase = await createClient();

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
        .select();

    if (error) {
        console.error('Error creating task:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function updateTask(task: Task) {
    const supabase = await createClient();

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

    revalidatePath('/');
    return { success: true };
}

export async function deleteTask(id: number) {
    const supabase = await createClient();

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return { error: error.message };
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

    revalidatePath('/');
    return { success: true };
}
