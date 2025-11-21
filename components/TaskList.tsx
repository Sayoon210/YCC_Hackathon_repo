'use client';

import { useState } from 'react';
import { TaskBlock } from '@/components/TaskBlock';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task, User } from '@/types/task';
import { createTask, updateTask, updateTaskScore, deleteTask } from '@/app/actions';

interface TaskListProps {
    initialTasks: Task[];
    users: User[];
}

export default function TaskList({ initialTasks, users }: TaskListProps) {
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateTask = async (newTask: Task) => {
        const formData = new FormData();
        formData.append('title', newTask.title);
        formData.append('description', newTask.description || '');
        if (newTask.member_id) {
            formData.append('member_id', newTask.member_id.toString());
        }

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

    const handleVote = async (taskId: number, newTotalScore: number) => {
        await updateTaskScore(taskId, newTotalScore);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Task List</h1>
                <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full shadow-lg">
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
                        users={users}
                    />
                )}

                {initialTasks.map((task) => (
                    <TaskBlock
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onVote={handleVote}
                        users={users}
                    />
                ))}

                {initialTasks.length === 0 && !isCreating && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No tasks yet. Click the button above to add one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
