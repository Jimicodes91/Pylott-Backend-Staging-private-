import { injectable } from 'tsyringe';

import { AuthService } from './services/auth.service';

@injectable()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	signup = async (req: Request, res: Response) => {};
}
