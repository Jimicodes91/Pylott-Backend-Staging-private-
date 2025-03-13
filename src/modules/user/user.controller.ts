import { injectable } from 'tsyringe';
import { Request, Response } from 'express';

import { UserService } from './services/user.service';

@injectable()
export class UserController {
	constructor(private readonly userService: UserService) {}

	getUser = async (req: Request, res: Response) => {};

	updateProfile = async (req: Request, res: Response) => {};
}
