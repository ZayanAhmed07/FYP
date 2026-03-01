import { httpClient } from '../api/httpClient';

export interface Milestone {
  _id: string;
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'paid';
  completedAt?: string;
  paidAt?: string;
}

export interface Order {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    category: string;
  };
  buyerId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    phone?: string;
  };
  consultantId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
      phone?: string;
    };
    title: string;
  };
  proposalId: string;
  totalAmount: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  milestones: Milestone[];
  amountPaid: number;
  amountPending: number;
  startDate: string;
  completionDate?: string;
  completionRequestedAt?: string;
  completionRequestedBy?: 'consultant' | 'buyer';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestonePayload {
  description: string;
  amount: number;
}

export const orderService = {
  // Get all orders
  async getAllOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    orders: Order[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const { data } = await httpClient.get('/orders', { params });
    return data.data;
  },

  // Get order by ID
  async getOrderById(id: string): Promise<Order> {
    const { data } = await httpClient.get(`/orders/${id}`);
    return data.data;
  },

  // Get orders by buyer
  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    const { data } = await httpClient.get(`/orders/buyer/${buyerId}`);
    return data.data;
  },

  // Get orders by consultant
  async getOrdersByConsultant(consultantId: string): Promise<Order[]> {
    const { data } = await httpClient.get(`/orders/consultant/${consultantId}`);
    return data.data;
  },

  // Update order progress
  async updateProgress(id: string, progress: number): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${id}/progress`, { progress });
    return data.data;
  },

  // Add milestone
  async addMilestone(id: string, milestone: CreateMilestonePayload): Promise<Order> {
    const { data } = await httpClient.post(`/orders/${id}/milestones`, milestone);
    return data.data;
  },

  // Complete milestone
  async completeMilestone(orderId: string, milestoneId: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${orderId}/milestones/${milestoneId}/complete`);
    return data.data;
  },

  // Pay milestone
  async payMilestone(orderId: string, milestoneId: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${orderId}/milestones/${milestoneId}/pay`);
    return data.data;
  },

  // Request completion (Consultant)
  async requestCompletion(id: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${id}/request-completion`);
    return data.data;
  },

  // Confirm completion (Buyer)
  async confirmCompletion(id: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${id}/confirm-completion`);
    return data.data;
  },

  // Complete order
  async completeOrder(id: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${id}/complete`);
    return data.data;
  },

  // Cancel order
  async cancelOrder(id: string): Promise<Order> {
    const { data } = await httpClient.patch(`/orders/${id}/cancel`);
    return data.data;
  },
};
