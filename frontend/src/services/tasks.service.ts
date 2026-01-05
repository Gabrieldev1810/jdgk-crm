import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  position: number;
  assigneeId?: string;
  campaignId?: string;
  campaign?: {
    id: string;
    name: string;
    color: string;
  };
  columnId?: string;
  vicidialCallbackId?: number;
  vicidialLeadId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  campaignId?: string;
  columnId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

export const tasksService = {
  getAll: async (): Promise<Task[]> => {
    const response = await axios.get(`${API_URL}/tasks`);
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await axios.post(`${API_URL}/tasks`, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await axios.patch(`${API_URL}/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/tasks/${id}`);
  },

  updatePositions: async (items: { id: string; position: number; status?: string; columnId?: string }[]): Promise<void> => {
    await axios.post(`${API_URL}/tasks/reorder`, items);
  },
};
