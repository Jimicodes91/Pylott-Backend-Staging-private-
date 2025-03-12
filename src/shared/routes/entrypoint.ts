import { Request, Response } from 'express';

import { successResponse } from '../../api/v1/middleware/response.middleware';
import { Server } from '../types/http.type';

export default (server: Server) => {
	server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));
};
