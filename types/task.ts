export interface Vote {
    voter: string;
    score: number;
}

export interface User {
    id: number;
    name: string;
}

export interface Task {
    id: number; // Changed from string to number (bigint)
    title: string;
    description: string | null; // Changed from details, nullable
    member_id: number | null; // Changed from assignee (string) to ID
    total_score: number;
    progress: number | null;
    achieved_score: number | null;

    // Optional UI-only fields (for now, until we have a votes table)
    votes?: Vote[];
    assignee_name?: string; // Helper to store joined user name
}
