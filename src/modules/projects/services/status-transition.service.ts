import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';
import { ServiceType } from '@/shared/types/general.type';

/**
 * Static transition maps for task lifecycle and signing sub-status.
 * These are compile-time constants — not stored in the database.
 */
export const TASK_TRANSITION_MAP: Record<string, string[]> = {
  draft: ['sent', 'in_progress', 'completed'],
  sent: ['in_progress', 'draft', 'completed'],
  pending: ['in_progress', 'completed'], // legacy status
  in_progress: ['completed', 'sent', 'pending'],
  completed: ['archived', 'in_progress', 'pending'],
  archived: ['completed'], // unarchive (admin only)
};

export const SIGNING_SUB_STATUS_TRANSITIONS: Record<string, string[]> = {
  sent: ['viewed'],
  viewed: ['signed'],
  signed: ['completed'],
};

@injectable()
export class StatusTransitionValidator {
  validateTransition(currentStatus: string, targetStatus: string): ServiceType {
    const allowed = TASK_TRANSITION_MAP[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      const validTargets = allowed ? allowed.join(', ') : 'none';
      return {
        status: false,
        message: `Cannot transition from '${currentStatus}' to '${targetStatus}'. Valid transitions from '${currentStatus}': ${validTargets}`,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }
    return { status: true, message: 'Transition valid' };
  }

  getValidNextStatuses(currentStatus: string): string[] {
    return TASK_TRANSITION_MAP[currentStatus] || [];
  }

  validateSigningTransition(currentSubStatus: string, targetSubStatus: string): ServiceType {
    const allowed = SIGNING_SUB_STATUS_TRANSITIONS[currentSubStatus];
    if (!allowed || !allowed.includes(targetSubStatus)) {
      const validTargets = allowed ? allowed.join(', ') : 'none';
      return {
        status: false,
        message: `Cannot transition signing status from '${currentSubStatus}' to '${targetSubStatus}'. Valid transitions: ${validTargets}`,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }
    return { status: true, message: 'Signing transition valid' };
  }
}
