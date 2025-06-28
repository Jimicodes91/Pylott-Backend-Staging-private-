import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { CompanyController } from './company.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { createCompanyValidationRule } from '@/shared/validations/company';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';

const companyController = container.resolve(CompanyController);

export const companyRoutes = (prefix: string, server: Server) => {
  server.post(`${prefix}/create/:id`, authenticateUser, schemaValidator(createCompanyValidationRule), companyController.createCompany);

  server.get(`${prefix}/company/:companyId/subscription`, companyController.getCompanySubscription);
};
