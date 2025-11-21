// Vote type matching the votes table schema
export interface Vote {
    id: string; // UUID
    task_id: number;
    user_id: string; // UUID
    score: number;
    created_at: string;
}

// Activity type matching the activities table schema
export interface Activity {
    id: string; // UUID
    task_id: number;
    user_id: string; // UUID
    title: string;
    content: string;
    file_url: string | null;
    sequence: number;
    created_at: string;
}

// User type matching the users table schema (with Auth UUID)
export interface User {
    id: string; // UUID from auth.users
    name: string;
    email?: string;
}

// Achievement Review type matching the achievement_reviews table schema
export interface AchievementReview {
    id: string; // UUID
    task_id: number;
    reviewer_id: string; // UUID
    score: 0 | 2 | 3 | 5;
    created_at: string;
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
    my_vote?: number; // Current user's vote score (if exists)
    activities?: Activity[]; // Progress reports for this task
    my_review?: AchievementReview; // Current user's achievement review (if exists)
    reviews_count?: number; // Total number of reviews
}
