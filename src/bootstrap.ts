import { container } from 'tsyringe';

import { validateEnvs } from './config/env';
import { dbConnect } from './database';
import { MilestoneTrackerService } from './modules/projects/services/milestone-tracker.service';

export default async function Bootstrap() {
  validateEnvs();
  dbConnect();

  const tracker = container.resolve(MilestoneTrackerService);
  await tracker.scheduleGlobalChecks();
}
