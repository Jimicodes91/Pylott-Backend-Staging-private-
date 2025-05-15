import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { CreateMetadataType } from '@/shared/types/dto/documents.dto';
import { MetadataService } from './services/metadata.service';
import { genericResponse } from '@/shared/utils/api-response';

@injectable()
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  createDocumentType = async (req: Request, res: Response) => {
    return this.handleMetadataCreation(req, res, this.metadataService.createDocumentType.bind(this.metadataService));
  };

  createTaskType = async (req: Request, res: Response) => {
    return this.handleMetadataCreation(req, res, this.metadataService.createTaskType.bind(this.metadataService));
  };

  createEventType = async (req: Request, res: Response) => {
    return this.handleMetadataCreation(req, res, this.metadataService.createEventType.bind(this.metadataService));
  };

  createNoteType = async (req: Request, res: Response) => {
    return this.handleMetadataCreation(req, res, this.metadataService.createNoteType.bind(this.metadataService));
  };

  updateDocumentType = async (req: Request, res: Response) => {
    return this.handleMetadataUpdate(req, res, this.metadataService.updateDocumentType.bind(this.metadataService));
  };

  updateTaskType = async (req: Request, res: Response) => {
    return this.handleMetadataUpdate(req, res, this.metadataService.updateTaskType.bind(this.metadataService));
  };

  updateEventType = async (req: Request, res: Response) => {
    return this.handleMetadataUpdate(req, res, this.metadataService.updateEventType.bind(this.metadataService));
  };

  updateNoteType = async (req: Request, res: Response) => {
    return this.handleMetadataUpdate(req, res, this.metadataService.updateNoteType.bind(this.metadataService));
  };

  getDocumentTypes = async (req: Request, res: Response) => {
    return this.handleMetadataFetch(req, res, this.metadataService.getDocumentTypes.bind(this.metadataService));
  };

  getTaskTypes = async (req: Request, res: Response) => {
    return this.handleMetadataFetch(req, res, this.metadataService.getTaskTypes.bind(this.metadataService));
  };

  getEventTypes = async (req: Request, res: Response) => {
    return this.handleMetadataFetch(req, res, this.metadataService.getEventTypes.bind(this.metadataService));
  };

  getNoteTypes = async (req: Request, res: Response) => {
    return this.handleMetadataFetch(req, res, this.metadataService.getNoteTypes.bind(this.metadataService));
  };

  private async handleMetadataFetch(req: Request, res: Response, fetchMethod: (user: any, project_id: string) => Promise<any>) {
    const { project_id } = req.params;
    // @ts-ignore
    const user = req.user || {};

    const result = await fetchMethod(user, project_id);

    return genericResponse({ res, data: result });
  }

  private async handleMetadataCreation(req: Request, res: Response, createMethod: (user: any, payload: CreateMetadataType) => Promise<any>) {
    const payload = req.body as CreateMetadataType;
    const user = req.user || {};

    const result = await createMethod(user, payload);

    return genericResponse({ res, data: result });
  }

  private async handleMetadataUpdate(req: Request, res: Response, updateMethod: (user: any, payload: Partial<CreateMetadataType>, metadata_id: string) => Promise<any>) {
    const payload = req.body as CreateMetadataType;
    const { metadata_id } = req.params;
    const user = req.user || {};

    const result = await updateMethod(user, payload, metadata_id);

    return genericResponse({ res, data: result });
  }
}
