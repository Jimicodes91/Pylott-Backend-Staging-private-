import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { OrgFinanceController } from './org-finance.controller';
import { uploadPaymentProof } from '@/shared/utils/file-upload';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { createOrgFinanceValidationRules, updateOrgFinanceValidationRules, markAsPaidValidationRules } from '@/shared/validations/org-finance';

const orgFinanceController = container.resolve(OrgFinanceController);
export const orgFinanceRoutes = (prefix: string, server: Server) => {
  // Get all org_finance records (paginated)
  server.get(`${prefix}`, authenticateUser, orgFinanceController.getAllOrgFinance);

  server.get(`${prefix}/search`, authenticateUser, orgFinanceController.searchOrgFinance);

  // Get org_finance record by ID
  server.get(`${prefix}/:id`, authenticateUser, orgFinanceController.getOrgFinanceById);

  // Create new org_finance record
  server.post(`${prefix}`, authenticateUser, schemaValidator(createOrgFinanceValidationRules), orgFinanceController.createOrgFinance);

  server.put(`${prefix}/:id`, authenticateUser, schemaValidator(updateOrgFinanceValidationRules), orgFinanceController.updateOrgFinance);

  server.patch(
    `${prefix}/:id/mark-as-paid`,
    authenticateUser,
    uploadPaymentProof.single('payment_proof'), // Handle file upload first
    schemaValidator(markAsPaidValidationRules), // Then validate form data
    orgFinanceController.markAsPaid,
  );
};
