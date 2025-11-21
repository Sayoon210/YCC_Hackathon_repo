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
import { Task, Vote, User } from '@/types/task';

interface TaskBlockProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    onDelete: (taskId: number) => void;
    onVote: (taskId: number, newTotalScore: number) => void;
    defaultEditing?: boolean;
    users: User[];
}

export function TaskBlock({ task, onUpdate, onDelete, onVote, defaultEditing = false, users }: TaskBlockProps) {
    const [isEditing, setIsEditing] = useState(defaultEditing);
    const [editedTask, setEditedTask] = useState<Task>(task);

    // Voting State (Local for now, then syncs total to DB)
    const [voterName, setVoterName] = useState('');
    const [voteScore, setVoteScore] = useState([5]);
    // We keep a local votes array to show the list, even if DB only stores total
    const [localVotes, setLocalVotes] = useState<Vote[]>([]);

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

    const handleAddVote = () => {
        if (!voterName.trim()) return;

        const newVote: Vote = {
            voter: voterName,
            score: voteScore[0],
        };

        const updatedVotes = [...localVotes, newVote];
        setLocalVotes(updatedVotes);

        // Calculate new total score
        // Note: This simple addition logic assumes we are adding to the *current* DB total
        // In a real concurrent app, this might be risky, but fine for now.
        // Or, if we want "Assigned Score" to be purely the sum of *these* votes:
        const newTotal = updatedVotes.reduce((sum, v) => sum + v.score, 0);

        // Update DB
        onVote(task.id, newTotal);

        setVoterName('');
        setVoteScore([5]);
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
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Assignee:</span>
                        <Select
                            value={editedTask.member_id?.toString()}
                            onValueChange={(value) => setEditedTask({ ...editedTask, member_id: Number(value) })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
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
                    {task.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between mt-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{task.assignee_name || 'Unassigned'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 font-medium">
                        <span className="bg-secondary px-2 py-1 rounded-md">Assigned Score: {task.total_score}</span>
                        <span className="bg-secondary px-2 py-1 rounded-md">Achievement: {task.achieved_score || '-'}</span>
                    </div>
                </div>

                {/* Voting Section */}
                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Score Voting</h4>

                    <div className="flex flex-col gap-4 mb-4 p-3 bg-secondary/20 rounded-lg">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Voter Name"
                                value={voterName}
                                onChange={(e) => setVoterName(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Button size="sm" onClick={handleAddVote} disabled={!voterName.trim()}>
                                <Plus className="h-3 w-3 mr-1" /> Add Vote
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium w-20">Score: {voteScore[0]}</span>
                            <Slider
                                value={voteScore}
                                onValueChange={setVoteScore}
                                max={10}
                                step={0.5}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {localVotes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {localVotes.map((vote, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {vote.voter}: {vote.score}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
