export interface UserPayload {
  _id: string;
  email: string;
  role: string;
}

export interface CustomRequest extends Request {
  user: UserPayload;
}
