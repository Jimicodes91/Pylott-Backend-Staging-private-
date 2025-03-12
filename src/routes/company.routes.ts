import { Router } from "express";
import { authenticateUser, authorizeRole, verifyJWT } from "../middleware";
import { UserRole } from "../utils/user";
import { createCompany } from "../controllers/company.controller";
import { createCompanyValidator } from "../middleware/validators/company.validator";

const companyRouter = Router();

companyRouter.post('/',authenticateUser, authorizeRole([UserRole.COMPANY_ADMIN]), createCompanyValidator, createCompany )


export default companyRouter