import { StatusCodes } from 'http-status-codes';

export type ObjectLiteral = { [key: string]: any };

export type ServiceType = {
  status: boolean;
  message: string;
  data?: any;
  statusCode?: StatusCodes;
};
