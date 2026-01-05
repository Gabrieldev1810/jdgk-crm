import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  order: number;
  campaignId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  columns?: KanbanColumn[];
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateKanbanColumnDto {
  title: string;
  color?: string;
  order?: number;
  campaignId?: string;
}

export interface UpdateKanbanColumnDto {
  title?: string;
  color?: string;
  order?: number;
}

export const campaignsService = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await axios.get(`${API_URL}/campaigns`);
    return response.data;
  },

  create: async (data: CreateCampaignDto): Promise<Campaign> => {
    const response = await axios.post(`${API_URL}/campaigns`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/campaigns/${id}`);
  },

  // Column Management
  getColumns: async (campaignId: string): Promise<KanbanColumn[]> => {
    const response = await axios.get(`${API_URL}/campaigns/${campaignId}/columns`);
    return response.data;
  },

  createColumn: async (campaignId: string, data: CreateKanbanColumnDto): Promise<KanbanColumn> => {
    const response = await axios.post(`${API_URL}/campaigns/${campaignId}/columns`, data);
    return response.data;
  },

  updateColumn: async (columnId: string, data: UpdateKanbanColumnDto): Promise<KanbanColumn> => {
    const response = await axios.patch(`${API_URL}/campaigns/columns/${columnId}`, data);
    return response.data;
  },

  deleteColumn: async (columnId: string): Promise<void> => {
    await axios.delete(`${API_URL}/campaigns/columns/${columnId}`);
  },
};
