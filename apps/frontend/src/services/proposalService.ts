import { httpClient } from '../api/httpClient';

export interface Proposal {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    category: string;
    budget: { min: number; max: number };
    description?: string;
    status?: string;
  };
  consultantId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    title: string;
    hourlyRate: number;
    rating?: number;
  };
  bidAmount: number;
  deliveryTime: string;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalPayload {
  jobId: string;
  bidAmount: number;
  deliveryTime: string;
  coverLetter: string;
}

export const proposalService = {
  // Create a proposal
  async createProposal(payload: CreateProposalPayload): Promise<Proposal> {
    const { data } = await httpClient.post('/proposals', payload);
    return data.data;
  },

  // Get all proposals
  async getAllProposals(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    proposals: Proposal[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const { data } = await httpClient.get('/proposals', { params });
    return data.data;
  },

  // Get proposal by ID
  async getProposalById(id: string): Promise<Proposal> {
    const { data } = await httpClient.get(`/proposals/${id}`);
    return data.data;
  },

  // Get proposals for a job
  async getProposalsByJob(jobId: string): Promise<Proposal[]> {
    const { data } = await httpClient.get(`/proposals/job/${jobId}`);
    return data.data;
  },

  // Get proposals by consultant
  async getProposalsByConsultant(consultantId: string): Promise<Proposal[]> {
    const { data } = await httpClient.get(`/proposals/consultant/${consultantId}`);
    return data.data;
  },

  // Get proposals received by buyer
  async getProposalsByBuyer(buyerId: string): Promise<Proposal[]> {
    const { data } = await httpClient.get(`/proposals/buyer/${buyerId}`);
    return data.data;
  },

  // Update proposal
  async updateProposal(id: string, payload: Partial<CreateProposalPayload>): Promise<Proposal> {
    const { data } = await httpClient.put(`/proposals/${id}`, payload);
    return data.data;
  },

  // Accept proposal
  async acceptProposal(id: string): Promise<{ proposal: Proposal; order: any }> {
    const { data } = await httpClient.patch(`/proposals/${id}/accept`);
    return data.data;
  },

  // Reject proposal
  async rejectProposal(id: string): Promise<Proposal> {
    const { data } = await httpClient.patch(`/proposals/${id}/reject`);
    return data.data;
  },

  // Delete proposal
  async deleteProposal(id: string): Promise<void> {
    await httpClient.delete(`/proposals/${id}`);
  },
};
