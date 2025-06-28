import { container } from 'tsyringe';
import { Server } from '@/shared/types/http.type';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';
import { BillingController } from './billing.controller';

const billingController = container.resolve(BillingController);

export const billingRoutes = (prefix: string, server: Server) => {
  // Billing Dashboard
  server.get(`${prefix}/billing/overview`, authenticateUser, billingController.getBillingOverview);

  // Subscription Management
  server.post(`${prefix}/billing/upgrade`, authenticateUser, billingController.upgradePlan);

  server.post(`${prefix}/billing/cancel`, authenticateUser, billingController.cancelSubscription);

  // Payment Methods
  server.post(`${prefix}/billing/payment-methods`, authenticateUser, billingController.addPaymentMethod);

  server.get(`${prefix}/billing/payment-methods`, authenticateUser, billingController.getPaymentMethods);

  server.put(`${prefix}/billing/default-payment-method`, authenticateUser, billingController.setDefaultPaymentMethod);

  // Invoices
  server.get(`${prefix}/billing/invoices`, authenticateUser, billingController.getInvoices);

  //updated routes

  // Public endpoints (for viewing plans)
  server.get(`${prefix}/plans`, billingController.getAllPlans);
  server.get(`${prefix}/plans/:planName`, billingController.getPlan);

  // Admin-only endpoints (for managing plans)
  server.post(
    `${prefix}/plans`,
    authenticateUser,

    billingController.createPlan,
  );

  server.put(
    `${prefix}/plans/:planName`,
    authenticateUser,

    billingController.updatePlan,
  );

  server.delete(
    `${prefix}/plans/:planName`,
    authenticateUser,

    billingController.deletePlan,
  );

  // server.get(
  //   `${prefix}/billing/invoices/:invoiceId`,
  //   authenticateUser,
  //   authorizeRole([UserRoles.ADMIN]),
  //   billingController.getInvoiceById
  // );
};
