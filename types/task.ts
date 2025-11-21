export interface Vote {
    voter: string;
    score: number;
}

// User type matching the users table schema (with Auth UUID)
export interface User {
    id: string; // UUID from auth.users
    name: string;
    email?: string;
}

// Task type matching the tasks table schema
export interface Task {
    id: number;
    title: string;
    description: string | null;
    member_id: string | null; // UUID reference to users.id
    total_score: number;
    progress: number | null;
    achieved_score: number | null;
    assignee_name?: string; // Joined from users table
    votes?: Vote[]; // Optional, for local state
}
