import { httpClient } from '../api/httpClient';

export interface Consultant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    isOnline?: boolean;
    phone?: string;
  };
  title: string;
  bio: string;
  specialization: string[];
  hourlyRate: number;
  availability: 'available' | 'limited' | 'unavailable';
  experience: string;
  skills: string[];
  idCardFront?: string;
  idCardBack?: string;
  supportingDocuments?: string[];
  isVerified: boolean;
  rating: number;
  totalProjects: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultantPayload {
  userId: string;
  title: string;
  bio: string;
  specialization: string[];
  hourlyRate: number;
  experience: string;
  skills: string[];
}

export const consultantService = {
  // Create consultant profile
  async createConsultant(payload: CreateConsultantPayload): Promise<Consultant> {
    const { data } = await httpClient.post('/consultants', payload);
    return data.data;
  },

  // Get all consultants
  async getAllConsultants(params?: {
    page?: number;
    limit?: number;
    specialization?: string;
    availability?: string;
    minRating?: number;
    isVerified?: boolean;
  }): Promise<{
    consultants: Consultant[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const { data } = await httpClient.get('/consultants', { params });
    return data.data;
  },

  // Get consultant by ID
  async getConsultantById(id: string): Promise<Consultant> {
    const { data } = await httpClient.get(`/consultants/${id}`);
    return data.data;
  },

  // Get consultant by user ID
  async getConsultantByUserId(userId: string): Promise<Consultant | null> {
    const { data } = await httpClient.get(`/consultants/user/${userId}`);
    return data.data;
  },

  // Update consultant profile
  async updateConsultant(id: string, payload: Partial<CreateConsultantPayload>): Promise<Consultant> {
    const { data } = await httpClient.patch(`/consultants/${id}`, payload);
    return data.data;
  },

  // Upload verification documents
  async uploadVerificationDocuments(
    id: string,
    documents: {
      idCardFront?: string;
      idCardBack?: string;
      supportingDocuments?: string[];
    }
  ): Promise<Consultant> {
    const { data } = await httpClient.patch(`/consultants/${id}/documents`, documents);
    return data.data;
  },

  // Delete consultant profile
  async deleteConsultant(id: string): Promise<void> {
    await httpClient.delete(`/consultants/${id}`);
  },
};
