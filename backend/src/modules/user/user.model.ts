import { Document, Model, Schema, model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  accountType: 'buyer' | 'consultant';
  phone?: string;
  profileImage?: string;
  isVerified: boolean;
  isOnline: boolean;
  isBanned: boolean;
  roles: string[];
}

export interface UserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel extends Model<UserDocument> {
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    accountType: { type: String, enum: ['buyer', 'consultant'], required: true },
    phone: { type: String, trim: true },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    roles: {
      type: [String],
      default: ['user'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.static('isEmailTaken', async function (email: string, excludeUserId?: string) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return Boolean(user);
});

export const User = model<UserDocument, UserModel>('User', userSchema);

