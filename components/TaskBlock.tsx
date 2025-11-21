'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Save, X } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskBlockProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (taskId: string) => void;
    defaultEditing?: boolean;
}

const MOCK_ASSIGNEES = ['Alice', 'Bob', 'Charlie'];

export function TaskBlock({ task, onUpdate, onDelete, defaultEditing = false }: TaskBlockProps) {
    const [isEditing, setIsEditing] = useState(defaultEditing);
    const [editedTask, setEditedTask] = useState<Task>(task);

    const handleSave = () => {
        onUpdate(editedTask);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (!task.title && !task.details) {
            // If it was a new empty task, delete it on cancel
            onDelete(task.id);
        } else {
            setEditedTask(task);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <Card className="mb-4 shadow-md">
                <CardHeader className="pb-2">
                    <Input
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        placeholder="Task Title"
                        className="font-bold text-lg"
                    />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={editedTask.details}
                        onChange={(e) => setEditedTask({ ...editedTask, details: e.target.value })}
                        placeholder="Task Details..."
                        className="min-h-[100px]"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Assignee:</span>
                        <Select
                            value={editedTask.assignee}
                            onValueChange={(value) => setEditedTask({ ...editedTask, assignee: value })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOCK_ASSIGNEES.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-bold">{task.title || 'Untitled Task'}</CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
                    {task.details || 'No details provided.'}
                </p>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{task.assignee || 'Unassigned'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3">
                        <span>Assigned Score: -</span>
                        <span>Achievement: -</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
