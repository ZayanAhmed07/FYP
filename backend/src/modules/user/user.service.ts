import { ApiError } from '../../utils/ApiError';
import { hashPassword } from '../../utils/password';
import { User, UserDocument } from './user.model';

export const createUser = async (payload: { name: string; email: string; password: string; roles?: string[] }) => {
  const isTaken = await User.isEmailTaken(payload.email);
  if (isTaken) {
    throw new ApiError(409, 'Email already taken');
  }

  const hashedPassword = await hashPassword(payload.password);
  const user = await User.create({
    ...payload,
    password: hashedPassword,
  });

  return user;
};

export const getUserByEmail = (email: string) => User.findOne({ email }).select('+password').exec();

export const getUserById = (id: string) => User.findById(id).select('-password').exec();

export const listUsers = () =>
  User.find()
    .select('-password')
    .exec();

export const updateUser = async (id: string, updates: Partial<UserDocument>) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update only allowed fields
  if (updates.accountType !== undefined) user.accountType = updates.accountType;
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.profileImage !== undefined) user.profileImage = updates.profileImage;

  await user.save();
  return user;
};

export const updatePassword = async (id: string, newPassword: string) => {
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  return user;
};

export const userService = {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  updatePassword,
};


