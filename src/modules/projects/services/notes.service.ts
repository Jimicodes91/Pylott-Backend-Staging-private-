import { StatusCodes } from 'http-status-codes';
import Objection from 'objection';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import { CommentRepository, DocumentAttachmentsRepository, DocumentsRepository, ProjectNotesRepository, ProjectRepository, UserRepository } from '@/repositories';

import { CommentsModelType, DocumentsModelType, ProjectNotesModelType, UserModelType } from '@/models';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory, MetadataType } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { CreateComment, CreateNote, EnrichedComment, EnrichedNote, NoteMentionMetadata } from '@/shared/types/projects.type';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';

@injectable()
export class NotesService {
  private traceId = '[Notes Service]';

  constructor(
    private readonly cloudinary: Cloudinary,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly commentRepository: CommentRepository,
    private readonly notesRepository: ProjectNotesRepository,
    private readonly documentRepository: DocumentsRepository,
    private readonly attachmentRepository: DocumentAttachmentsRepository,
  ) {}

  async createNote(user: UserModelType, project_id: string, payload: CreateNote): Promise<ServiceType> {
    try {
      const noteId = uuidv4();
      const documentId = uuidv4();

      const project = await this.projectRepository.findOne({ id: project_id, company_id: user.company_id });
      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      const notesData: Partial<ProjectNotesModelType> = {
        id: noteId,
        author_id: user.id,
        company_id: user.company_id,
        content: payload.content,
        metadata: JSON.stringify({ mentions: payload.mentions ?? [] }),
      };

      const documentData: Partial<DocumentsModelType> = {
        company_id: user.company_id,
        type: MetadataType.TASK,
        is_visible_to_client: true,
        id: documentId,
        note_id: noteId,
      };

      await Objection.Model.transaction(async (trx) => {
        await this.notesRepository.create(notesData, trx);
        const extendedDocsData = { ...documentData, name: `Note ${noteId} documents` };

        if (payload.attachments && payload.attachments.length) {
          await this.documentRepository.create(extendedDocsData, trx);

          await payload.attachments.forEach(async (fileData) => {
            if (!fileData.includes('http')) {
              const fileName = `${project_id}/${noteId}`;
              const { data } = await this.cloudinary.upload(DocumentsDirectory.NOTES, fileData, fileName);
              if (data) await this.attachmentRepository.create({ document_id: documentId, media_url: data }, trx);
            }
          });
        }
      });

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.NOTE_CREATED,
        {
          user_id: user.id,
          company_id: user.company_id,
          description: 'Note added',
          entity_description: user.name.replace(/^./, (c) => c.toUpperCase()),
          entity_id: noteId,
        },
        project_id,
      );

      // if (payload.mentions && payload.mentions.length) {
      //   const mentionedUsers = await this.userRepository.findAllWhereIdIn(payload.mentions);
      //   // send mail
      // }

      return {
        status: true,
        message: 'Note created successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred creating project note ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getAllNotes(project_id: string, company_id: string, user_id: string): Promise<ServiceType> {
    try {
      const notes = await this.notesRepository.getAllNotes(company_id, project_id);

      if (!notes.length) {
        return {
          status: true,
          data: [],
          message: 'No notes found',
        };
      }

      const enrichedNotes = await this.batchEnrichNotesWithMentions(notes, user_id);

      return {
        status: true,
        data: enrichedNotes,
        message: 'Notes retrieved successfully',
      };
    } catch (error) {
      console.log(`${this.traceId} Error fetching project notes`, {
        project_id,
        company_id,
        error: error?.message,
        stack: error?.stack,
      });

      return {
        status: false,
        data: null,
        message: 'Failed to retrieve notes. Please try again later.',
      };
    }
  }

  async getNoteDetails(project_id: string, company_id: string, note_id: string): Promise<ServiceType> {
    try {
      const note = await this.notesRepository.getNoteDetails(company_id, project_id, note_id);

      if (!note) {
        return {
          status: true,
          data: [],
          message: 'No notes found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const [enrichedNote] = await this.batchEnrichNotesWithMentions([note]);

      return {
        status: true,
        data: enrichedNote,
        message: 'Note details fetched successfully',
      };
    } catch (error) {
      console.log(`${this.traceId} Error fetching project notes`, {
        project_id,
        company_id,
        error: error?.message,
        stack: error?.stack,
      });

      return {
        status: false,
        data: null,
        message: 'Failed to retrieve notes. Please try again later.',
      };
    }
  }

  async createComment(user: UserModelType, project_id: string, note_id: string, payload: CreateComment): Promise<ServiceType> {
    try {
      const commentId = uuidv4();

      const project = await this.projectRepository.findOne({ id: project_id, company_id: user.company_id });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const note = await this.notesRepository.findOne({ id: note_id, company_id: user.company_id });
      if (!note) {
        return {
          status: false,
          message: 'Note not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const commentData: Partial<CommentsModelType> = {
        id: commentId,
        project_id,
        author_id: user.id,
        note_id,
        content: payload.content,
      };

      await this.commentRepository.create(commentData);

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.COMMENT_CREATED,
        {
          user_id: user.id,
          company_id: user.company_id,
          description: 'Comment added to note',
          entity_description: user.name.replace(/^./, (c) => c.toUpperCase()),
          entity_id: commentId,
        },
        project_id,
      );

      return {
        status: true,
        message: 'Comment created successfully',
        data: { commentId },
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error creating comment ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred while creating comment',
      };
    }
  }

  async getNoteComments(user: UserModelType, project_id: string, note_id: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({ id: project_id, company_id: user.company_id });
      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const note = await this.notesRepository.findOne({ id: note_id, company_id: user.company_id });
      if (!note) {
        return {
          status: false,
          message: 'Note not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const comments = await this.commentRepository.findMany({
        note_id,
        project_id,
      });

      if (!comments.length) {
        return {
          status: true,
          data: [],
          message: 'No comments found',
        };
      }

      const enrichedComments = await this.enrichCommentsWithAuthors(comments);

      return {
        status: true,
        data: enrichedComments,
        message: 'Comments retrieved successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error fetching comments ===> ${JSON.stringify({
          user_id: user.id,
          project_id,
          note_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred while fetching comments',
        data: null,
      };
    }
  }

  private async enrichCommentsWithAuthors(comments: CommentsModelType[]): Promise<EnrichedComment[]> {
    const authorIds = comments.map((comment) => comment.author_id);
    const authors = await this.userRepository.findAllWhereIdIn(authorIds);

    const authorMap = new Map(authors.map((author) => [author.id, author]));

    return comments.map((comment) => {
      const author = authorMap.get(comment.author_id);
      return {
        ...comment,
        author: author
          ? {
              id: author.id,
              name: author.name,
              email: author.email,
              avatar: author?.pfp,
            }
          : null,
      };
    });
  }

  async deleteComment(user: UserModelType, project_id: string, note_id: string, comment_id: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({ id: project_id, company_id: user.company_id });
      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const note = await this.notesRepository.findOne({ id: note_id, company_id: user.company_id });
      if (!note) {
        return {
          status: false,
          message: 'Note not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const comment = await this.commentRepository.findOne({
        id: comment_id,
        note_id,
        project_id,
      });

      if (!comment) {
        return {
          status: false,
          message: 'Comment not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      // Only allow author or admin to delete
      if (comment.author_id !== user.id) {
        return {
          status: false,
          message: 'Unauthorized to delete this comment',
          statusCode: StatusCodes.FORBIDDEN,
        };
      }

      await this.commentRepository.delete({ id: comment_id }, false);

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.COMMENT_DELETED,
        {
          user_id: user.id,
          company_id: user.company_id,
          description: 'Comment deleted from note',
          entity_description: user.name.replace(/^./, (c) => c.toUpperCase()),
          entity_id: comment_id,
        },
        project_id,
      );

      return {
        status: true,
        message: 'Comment deleted successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error deleting comment ===> ${JSON.stringify({
          user_id: user.id,
          project_id,
          note_id,
          comment_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred while deleting comment',
      };
    }
  }

  private async batchEnrichNotesWithMentions(notes: any[], currentUserId?: string): Promise<EnrichedNote[]> {
    const allMentionedUserIds = new Set<string>();

    notes.forEach((note) => {
      try {
        const metadata: NoteMentionMetadata = JSON.parse(note.metadata || '{}');
        if (metadata.mentions?.length) metadata.mentions.forEach((userId) => allMentionedUserIds.add(userId));
      } catch {
        // Silently handle invalid metadata
      }
    });

    const mentionedUsers = allMentionedUserIds.size ? await this.userRepository.findAllWhereIdIn(Array.from(allMentionedUserIds)) : [];

    const userMap = new Map(mentionedUsers.map((user) => [user.id, user]));

    return notes.map((note) => {
      try {
        const metadata: NoteMentionMetadata = JSON.parse(note.metadata || '{}');

        if (!metadata.mentions?.length) return note;

        const noteUsers = metadata.mentions.map((userId) => userMap.get(userId)).filter(Boolean);

        if (!noteUsers.length) return note;

        let highlightedContent = note.content;
        const displayNames: string[] = [];
        const isMentionedUser = noteUsers.some((user) => user.id === currentUserId);

        noteUsers.forEach((user) => {
          const mention = `@${user.name.split(' ')[0]}`;
          highlightedContent = highlightedContent.replace(new RegExp(mention, 'g'), `<mention data-user-id="${user.id}">${mention}</mention>`);
          displayNames.push(user.name);
        });

        return {
          ...note,
          parsed_mentions: {
            userIds: metadata.mentions,
            display_names: displayNames,
            highlighted_Content: highlightedContent,
            is_mentioned_user: isMentionedUser,
          },
        };
      } catch (error) {
        console.log(`${this.traceId} Failed to process mentions for note ${note.id}`, error);
        return note;
      }
    });
  }
}
