import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { CompanyController } from './company.controller';

const companyController = container.resolve(CompanyController);

export const companyRoutes = (prefix: string, server: Server) => {};
