import { Consultant } from '../../models/consultant.model';
import { Job } from '../../models/job.model';
import { Order } from '../../models/order.model';
import { ApiError } from '../../utils/ApiError';

export const createOrder = async (orderData: any) => {
  const order = await Order.create(orderData);
  return order.populate([
    { path: 'jobId', select: 'title category' },
    { path: 'buyerId', select: 'name email profileImage' },
    { path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } },
  ]);
};

export const getAllOrders = async (query: any) => {
  const { page = 1, limit = 10, status } = query;

  const filter: any = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'buyerId', select: 'name email profileImage' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(filter);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getOrderById = async (id: string) => {
  const order = await Order.findById(id)
    .populate({ path: 'jobId' })
    .populate({ path: 'buyerId', select: 'name email profileImage phone' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage phone' } })
    .populate({ path: 'proposalId' });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

export const getOrdersByBuyer = async (buyerId: string) => {
  const orders = await Order.find({ buyerId })
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .sort({ createdAt: -1 });
  return orders;
};

export const getOrdersByConsultant = async (consultantId: string) => {
  const orders = await Order.find({ consultantId })
    .populate({ path: 'jobId', select: 'title category' })
    .populate({ path: 'buyerId', select: 'name email profileImage' })
    .sort({ createdAt: -1 });
  return orders;
};

export const updateOrder = async (id: string, updateData: any) => {
  const order = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

export const updateOrderProgress = async (id: string, progress: number) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.progress = progress;
  await order.save();

  return order;
};

export const addMilestone = async (id: string, milestoneData: any) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.milestones.push(milestoneData);
  await order.save();

  return order;
};

export const completeMilestone = async (id: string, milestoneId: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const milestone = order.milestones.id(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.status = 'completed';
  milestone.completedAt = new Date();
  await order.save();

  return order;
};

export const payMilestone = async (id: string, milestoneId: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const milestone = order.milestones.id(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  if (milestone.status !== 'completed') {
    throw new ApiError(400, 'Milestone must be completed before payment');
  }

  milestone.status = 'paid';
  milestone.paidAt = new Date();
  order.amountPaid += milestone.amount;
  order.amountPending -= milestone.amount;
  await order.save();

  // Update consultant earnings
  await Consultant.findByIdAndUpdate(order.consultantId, {
    $inc: { totalEarnings: milestone.amount },
  });

  return order;
};

export const completeOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.status = 'completed';
  order.completionDate = new Date();
  order.progress = 100;
  await order.save();

  // Update job status
  await Job.findByIdAndUpdate(order.jobId, { status: 'completed' });

  // Update consultant stats
  await Consultant.findByIdAndUpdate(order.consultantId, {
    $inc: { totalProjects: 1 },
  });

  return order;
};

export const cancelOrder = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.status = 'cancelled';
  await order.save();

  // Update job status
  await Job.findByIdAndUpdate(order.jobId, { status: 'cancelled' });

  return order;
};

export const deleteOrder = async (id: string) => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};


