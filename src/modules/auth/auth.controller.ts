import { injectable } from 'tsyringe';
import { Response, Request } from 'express';

import { AuthService } from './services/auth.service';
import { successResponse } from '@/shared/utils/api-response';

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (req: Request, res: Response) => successResponse(res, 'Sample response', {});
}
