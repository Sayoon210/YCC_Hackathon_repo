'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Pencil, Trash, Save, X, Plus } from 'lucide-react';
import { Task, Vote } from '@/types/task';
import { claimTask } from '@/app/actions';

interface TaskBlockProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (taskId: number) => void;
    onVote: (taskId: number, score: number) => void; // Changed: now takes score, not total
    defaultEditing?: boolean;
    currentUserId?: string;
}

export function TaskBlock({ task, onUpdate, onDelete, onVote, defaultEditing = false, currentUserId }: TaskBlockProps) {
    const [isEditing, setIsEditing] = useState(defaultEditing);
    const [editedTask, setEditedTask] = useState<Task>(task);

    // Voting State - Initialize with user's existing vote or 0
    const [myVoteScore, setMyVoteScore] = useState<number[]>([task.my_vote || 0]);

    const handleSave = () => {
        onUpdate(editedTask);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (!task.title && !task.description) {
            onDelete(task.id);
        } else {
            setEditedTask(task);
            setIsEditing(false);
        }
    };

    const handleVoteChange = (value: number[]) => {
        setMyVoteScore(value);
        // Submit vote immediately on slider change
        onVote(task.id, value[0]);
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
                        value={editedTask.description || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                        placeholder="Task Description..."
                        className="min-h-[100px]"
                    />
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
                    {task.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between mt-4 mb-4">
                    <div className="flex items-center gap-2">
                        {!task.member_id ? (
                            // Unassigned - Show Claim button
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                    await claimTask(task.id);
                                }}
                                className="text-xs"
                            >
                                🙋‍♂️ Claim Task
                            </Button>
                        ) : task.member_id === currentUserId ? (
                            // Assigned to me
                            <Badge variant="default" className="bg-green-600">
                                ✓ My Task
                            </Badge>
                        ) : (
                            // Assigned to someone else
                            <Badge variant="secondary">
                                Assigned to {task.assignee_name || 'Unknown'}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 font-medium">
                        <span className="bg-secondary px-2 py-1 rounded-md">Assigned Score: {task.total_score}</span>
                        <span className="bg-secondary px-2 py-1 rounded-md">Achievement: {task.achieved_score || '-'}</span>
                    </div>
                </div>

                {/* Voting Section - Only enabled for other users' tasks */}
                {!task.member_id ? (
                    // Unassigned task - voting disabled
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Score Voting</h4>
                            <Badge variant="outline" className="text-xs">
                                Task must be claimed first
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg opacity-50">
                            <span className="text-sm font-medium w-24 text-muted-foreground">Your Score: 0</span>
                            <Slider
                                value={[0]}
                                max={10}
                                step={0.5}
                                className="flex-1"
                                disabled
                            />
                        </div>
                    </div>
                ) : task.member_id === currentUserId ? (
                    // Own task - voting disabled
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Score Voting</h4>
                            <Badge variant="outline" className="text-xs">
                                Cannot vote on your own task
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg opacity-50">
                            <span className="text-sm font-medium w-24 text-muted-foreground">Your Score: 0</span>
                            <Slider
                                value={[0]}
                                max={10}
                                step={0.5}
                                className="flex-1"
                                disabled
                            />
                        </div>
                    </div>
                ) : (
                    // Other user's task - voting enabled
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">Score Voting</h4>
                            {task.my_vote !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                    You voted: {task.my_vote}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
                            <span className="text-sm font-medium w-24">Your Score: {myVoteScore[0]}</span>
                            <Slider
                                value={myVoteScore}
                                onValueChange={handleVoteChange}
                                max={10}
                                step={0.5}
                                className="flex-1"
                            />
                        </div>
                    </div>
                )}


            </CardContent>
        </Card>
    );
}
