import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';

export default (server: Server) => {
	server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));
};
