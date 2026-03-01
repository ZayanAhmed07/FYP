import { ApiError } from '../../utils/ApiError';
import { comparePassword } from '../../utils/password';
import { tokenService } from '../../services/token.service';
import { userService } from '../user/user.service';

export const login = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);

  if (!user || !user.password || !(await comparePassword(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = tokenService.generateToken({ id: user.id, roles: user.roles });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      accountType: user.accountType,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
    },
  };
};

export const register = async (payload: { 
  name: string; 
  email: string; 
  password: string;
  accountType: 'buyer' | 'consultant';
}) => {
  const user = await userService.createUser(payload);
  const token = tokenService.generateToken({ id: user.id, roles: user.roles });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      accountType: user.accountType,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
    },
  };
};

export const authService = {
  login,
  register,
};


