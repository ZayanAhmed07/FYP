import { Job } from '../../models/job.model';
import { Proposal } from '../../models/proposal.model';
import { Order } from '../../models/order.model';
import { ApiError } from '../../utils/ApiError';

export const createProposal = async (proposalData: any) => {
  const proposal = await Proposal.create(proposalData);
  
  // Increment proposal count on job
  await Job.findByIdAndUpdate(proposalData.jobId, { $inc: { proposalsCount: 1 } });
  
  return proposal.populate([
    { path: 'jobId', select: 'title category budget' },
    { path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } },
  ]);
};

export const getAllProposals = async (query: any) => {
  const { page = 1, limit = 10, status } = query;

  const filter: any = {};
  if (status) filter.status = status;

  const proposals = await Proposal.find(filter)
    .populate({ path: 'jobId', select: 'title category budget buyerId' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Proposal.countDocuments(filter);

  return {
    proposals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getProposalById = async (id: string) => {
  const proposal = await Proposal.findById(id)
    .populate({ path: 'jobId' })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage phone' } });
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }
  return proposal;
};

export const getProposalsByJob = async (jobId: string) => {
  const proposals = await Proposal.find({ jobId })
    .populate({ path: 'consultantId', populate: { path: 'userId', select: 'name email profileImage' } })
    .sort({ createdAt: -1 });
  return proposals;
};

export const getProposalsByConsultant = async (consultantId: string) => {
  const proposals = await Proposal.find({ consultantId })
    .populate({ path: 'jobId', select: 'title category budget status buyerId' })
    .sort({ createdAt: -1 });
  return proposals;
};

export const getProposalsByBuyer = async (buyerId: string) => {
  // Find all jobs by this buyer
  const jobs = await Job.find({ buyerId }).select('_id');
  const jobIds = jobs.map(job => job._id);
  
  // Find all proposals for these jobs
  const proposals = await Proposal.find({ jobId: { $in: jobIds } })
    .populate({ path: 'jobId', select: 'title description category budget status' })
    .populate({ 
      path: 'consultantId', 
      populate: { path: 'userId', select: 'name email profileImage' } 
    })
    .sort({ createdAt: -1 });
  
  return proposals;
};

export const updateProposal = async (id: string, updateData: any) => {
  const proposal = await Proposal.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }
  return proposal;
};

export const acceptProposal = async (id: string) => {
  const proposal = await Proposal.findById(id)
    .populate('jobId')
    .populate('consultantId');
    
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }

  if (proposal.status !== 'pending') {
    throw new ApiError(400, 'Proposal has already been processed');
  }

  // Update proposal status
  proposal.status = 'accepted';
  await proposal.save();

  // Update job status and hired consultant
  const job = await Job.findByIdAndUpdate(
    proposal.jobId,
    {
      status: 'in_progress',
      hiredConsultantId: proposal.consultantId,
    },
    { new: true },
  );

  // Reject all other proposals for this job
  await Proposal.updateMany(
    { jobId: proposal.jobId, _id: { $ne: id } },
    { status: 'rejected' },
  );

  // Create an order
  const order = await Order.create({
    jobId: proposal.jobId,
    buyerId: job?.buyerId,
    consultantId: proposal.consultantId,
    proposalId: proposal._id,
    totalAmount: proposal.bidAmount,
    amountPending: proposal.bidAmount,
    milestones: [],
  });

  return {
    proposal,
    order,
  };
};

export const rejectProposal = async (id: string) => {
  const proposal = await Proposal.findById(id);
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }

  proposal.status = 'rejected';
  await proposal.save();

  return proposal;
};

export const deleteProposal = async (id: string) => {
  const proposal = await Proposal.findByIdAndDelete(id);
  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }
  
  // Decrement proposal count on job
  await Job.findByIdAndUpdate(proposal.jobId, { $inc: { proposalsCount: -1 } });
  
  return proposal;
};

