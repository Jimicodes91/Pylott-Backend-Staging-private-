import { container } from 'tsyringe';
import { NextFunction, Response, Request } from 'express';

import { ProjectMembersRepository } from '@/repositories';
import { ProjectMemberTypeEnum } from '../enums';
import { ProjectMemebersModelType } from '@/models';
import { errorResponse } from '../utils/api-response';
import { StatusCodes } from 'http-status-codes';

const projectMemberRepository = container.resolve(ProjectMembersRepository);

export const canPerformActionOnProject = async (request: Request, response: Response, next: NextFunction) => {
  const { project_id } = request.params;

  const user = request.user;

  if (!project_id || !user) return next();

  const queryData: Partial<ProjectMemebersModelType> = {
    project_id,
    user_id: user.id,
    member_type: ProjectMemberTypeEnum.INTERNAL,
  };

  const result = await projectMemberRepository.findOne(queryData);

  if (!result) return errorResponse(response, 'Access Denied. Cannot perform action', {}, StatusCodes.BAD_REQUEST);

  return next();
};
