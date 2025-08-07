export type UserModel = {
  id: string;
  name?: string;
  email: string;
  image?: string;
  password: string;
  username: string;
  emailVerified?: Date | null;
  phoneNumber: string;
  gender: 'male' | 'female' | 'other';
  signUpType?: 'manual' | 'google' | 'github' | 'other';
  isActive: boolean;
  role: 'student' | 'employee' | 'admin' | 'trainee' | string;
  createdAt: Date;
  deletedAt?: Date | null;
};


export type CreateUserModel = Pick<
  UserModel,
  | 'name'
  | 'email'
  | 'username'
  | 'password'
  | 'phoneNumber'
  | 'gender'
  | 'role'
  | 'isActive'
  | 'image'
  | 'signUpType'
>;
