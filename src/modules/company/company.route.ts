import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { CompanyController } from './company.controller';
import { UserRoles } from '@/shared/enums';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { createCompanyValidationRule } from '@/shared/validations/company';
import { authenticateUser, authorizeRole } from '@/shared/middlewares/guard.middleware';

const companyController = container.resolve(CompanyController);

export const companyRoutes = (prefix: string, server: Server) => {
	server.post(`${prefix}`, authenticateUser, authorizeRole([UserRoles.ADMIN]), schemaValidator(createCompanyValidationRule), companyController.create);
};
