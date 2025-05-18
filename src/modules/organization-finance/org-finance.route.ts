import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { OrgFinanceController } from './org-finance.controller';
import { uploadPaymentProof } from '@/shared/utils/file-upload';

const orgFinanceController = container.resolve(OrgFinanceController);
export const orgFinanceRoutes = (prefix: string, server: Server) => {
  // Get all org_finance records (paginated)
  server.get(`${prefix}`, orgFinanceController.getAllOrgFinance);

  server.get(`${prefix}/search`, orgFinanceController.searchOrgFinance);

  // Get org_finance record by ID
  server.get(`${prefix}/:id`, orgFinanceController.getOrgFinanceById);

  // Create new org_finance record
  server.post(`${prefix}`, orgFinanceController.createOrgFinance);

  server.put(`${prefix}/:id`, orgFinanceController.updateOrgFinance);

  server.patch(
    `${prefix}/:id/mark-as-paid`,
    uploadPaymentProof.single('payment_proof'), // Handle file upload
    orgFinanceController.markAsPaid,
  );
};
