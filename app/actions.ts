'use server';

import { createClient } from '@supabase/supabase-js';
import { Task, User } from '@/types/task';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Client for Server Actions
// Note: In a real Next.js app with Auth, we'd use @supabase/ssr's createServerClient
// But for this "No Auth" / "Anon Key" setup, basic client works.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUsers(): Promise<User[]> {
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

export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select(`
      *,
      users (
        name
      )
    `)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    // Map DB result to Task interface
    return data.map((item: any) => ({
        ...item,
        assignee_name: item.users?.name || 'Unassigned',
    }));
}

export async function createTask(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const member_id = formData.get('member_id') ? Number(formData.get('member_id')) : null;

    if (!title) return { error: 'Title is required' };

    const { error } = await supabase.from('tasks').insert({
        title,
        description,
        member_id,
        total_score: 0, // Default
    });

    if (error) {
        console.error('Error creating task:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function updateTask(task: Task) {
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

export async function updateTaskScore(id: number, score: number) {
    const { error } = await supabase
        .from('tasks')
        .update({ total_score: score })
        .eq('id', id);

    if (error) {
        console.error('Error updating score:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function deleteTask(id: number) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}
