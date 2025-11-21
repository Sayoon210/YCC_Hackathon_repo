export interface Task {
    id: string;
    title: string;
    details: string;
    assignee: string;
    status: 'todo' | 'in-progress' | 'done'; // Optional, but good to have
}
