import { IUser } from "../models/user.model";

export const sanitizeUser = (user: IUser) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiresAt;
  return obj;
};
