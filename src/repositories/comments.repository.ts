import { injectable } from 'tsyringe';

import { Comments, CommentsModelType } from '@/models/comments.model';
import BaseRepository from './base.repository';

@injectable()
export class CommentRepository extends BaseRepository<CommentsModelType, Comments> {
  constructor() {
    super(Comments);
  }
}
