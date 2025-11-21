'use client';

import { useState } from 'react';
import { TaskBlock } from '@/components/TaskBlock';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task } from '@/types/task';
import { createTask, updateTask, submitVote, deleteTask } from '@/app/actions';

interface TaskListProps {
    initialTasks: Task[];
    currentUserId?: string;
}

export default function TaskList({ initialTasks, currentUserId }: TaskListProps) {
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateTask = async (newTask: Task) => {
        const formData = new FormData();
        formData.append('title', newTask.title);
        formData.append('description', newTask.description || '');
        // Don't set member_id - tasks start unassigned

        await createTask(formData);
        setIsCreating(false);
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        if (updatedTask.id === 0) {
            await handleCreateTask(updatedTask);
        } else {
            await updateTask(updatedTask);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (taskId === 0) {
            setIsCreating(false);
        } else {
            await deleteTask(taskId);
        }
    };

    const handleVote = async (taskId: number, score: number) => {
        await submitVote(taskId, score);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Task List</h1>
                <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-5 w-5 mr-2" /> New Task
                </Button>
            </header>

            <div className="space-y-4">
                {isCreating && (
                    <TaskBlock
                        task={{
                            id: 0, // Placeholder ID
                            title: '',
                            description: '',
                            member_id: null,
                            total_score: 0,
                            progress: 0,
                            achieved_score: 0,
                        } as Task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onVote={() => { }} // Can't vote on draft
                        defaultEditing={true}
                        currentUserId={currentUserId}
                    />
                )}

                {initialTasks.map((task) => (
                    <TaskBlock
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onVote={handleVote}
                        currentUserId={currentUserId}
                    />
                ))}

                {initialTasks.length === 0 && !isCreating && (
                    <div className="text-center py-12 text-white/50 border-2 border-dashed border-white/20 rounded-lg glass-card">
                        <p>No tasks yet. Click the button above to add one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
