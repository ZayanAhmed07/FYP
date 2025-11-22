import { Job } from '../../models/job.model';
import { ApiError } from '../../utils/ApiError';

export const createJob = async (jobData: any) => {
  const job = await Job.create(jobData);
  return job.populate('buyerId', 'name email profileImage');
};

export const getAllJobs = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    category,
    status = 'open',
    minBudget,
    maxBudget,
    location,
  } = query;

  const filter: any = {};
  
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (minBudget) filter['budget.min'] = { $gte: Number(minBudget) };
  if (maxBudget) filter['budget.max'] = { $lte: Number(maxBudget) };
  if (location && location !== 'remote') filter.location = location;

  const jobs = await Job.find(filter)
    .populate('buyerId', 'name email profileImage')
    .populate('hiredConsultantId')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Job.countDocuments(filter);

  return {
    jobs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getJobById = async (id: string) => {
  const job = await Job.findById(id)
    .populate('buyerId', 'name email profileImage phone')
    .populate('hiredConsultantId');
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  return job;
};

export const getJobsByBuyer = async (buyerId: string) => {
  const jobs = await Job.find({ buyerId }).sort({ createdAt: -1 });
  return jobs;
};

export const updateJob = async (id: string, updateData: any) => {
  const job = await Job.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  return job.populate('buyerId', 'name email profileImage');
};

export const deleteJob = async (id: string) => {
  const job = await Job.findByIdAndDelete(id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  return job;
};



