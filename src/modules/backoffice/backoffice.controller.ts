import { injectable } from 'tsyringe';

import { BackOfficeService } from './services/backoffice.service';

@injectable()
export class BackOfficeController {
  constructor(private readonly backOfficeService: BackOfficeService) {}
}
