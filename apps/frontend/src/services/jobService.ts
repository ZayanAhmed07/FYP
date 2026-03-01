import { httpClient } from '../api/httpClient';

export interface Job {
  _id: string;
  buyerId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    phone?: string;
  };
  category: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  skills: string[];
  attachments?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposalsCount: number;
  hiredConsultantId?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  category: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  skills: string[];
  attachments?: string[];
}

export const jobService = {
  // Create a job
  async createJob(payload: CreateJobPayload): Promise<Job> {
    const { data } = await httpClient.post('/jobs', payload);
    return data.data;
  },

  // Get all jobs
  async getAllJobs(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
    location?: string;
  }): Promise<{
    jobs: Job[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const { data } = await httpClient.get('/jobs', { params });
    return data.data;
  },

  // Get job by ID
  async getJobById(id: string): Promise<Job> {
    const { data } = await httpClient.get(`/jobs/${id}`);
    return data.data;
  },

  // Get jobs by buyer
  async getJobsByBuyer(buyerId: string): Promise<Job[]> {
    const { data } = await httpClient.get(`/jobs/buyer/${buyerId}`);
    return data.data;
  },

  // Update job
  async updateJob(id: string, payload: Partial<CreateJobPayload>): Promise<Job> {
    const { data } = await httpClient.put(`/jobs/${id}`, payload);
    return data.data;
  },

  // Delete job
  async deleteJob(id: string): Promise<void> {
    await httpClient.delete(`/jobs/${id}`);
  },
};
