'use client';

import { useState } from 'react';
import { TaskBlock } from '@/components/TaskBlock';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task } from '@/types/task';

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design System',
      details: 'Create a unified design system for the application.',
      assignee: 'Alice',
      status: 'in-progress',
    },
    {
      id: '2',
      title: 'API Integration',
      details: 'Connect frontend to the backend API endpoints.',
      assignee: 'Bob',
      status: 'todo',
    },
  ]);

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: '',
      details: '',
      assignee: '',
      status: 'todo',
    };
    // Add new task to the beginning of the list
    setTasks([newTask, ...tasks]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Task List</h1>
          <Button onClick={handleAddTask} size="lg" className="rounded-full shadow-lg">
            <Plus className="h-5 w-5 mr-2" /> New Task
          </Button>
        </header>

        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskBlock
              key={task.id}
              task={task}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              defaultEditing={!task.title && !task.details} // Auto-edit if empty (newly added)
            />
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No tasks yet. Click the button above to add one.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
