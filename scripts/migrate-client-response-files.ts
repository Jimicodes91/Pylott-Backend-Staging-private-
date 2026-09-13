/**
 * Migration (Part A / Wave 3, Requirement 11.4) — convert legacy base64
 * `task_client_responses.file_url` values into hosted document references.
 *
 * For each response whose `file_url` holds raw base64 (i.e. not an http URL):
 *   1. validate the decoded file (type + size, same as the upload path)
 *   2. upload it to object storage via the existing Cloudinary uploader
 *   3. create a `documents` + `attachments` record linked to the task/project
 *   4. replace the response's `file_url` with the hosted URL reference
 *
 * The script is idempotent (already-hosted rows are skipped) and supports a
 * dry run so it can be inspected before any writes occur.
 *
 * Run:
 *   npx ts-node -r dotenv/config -r tsconfig-paths/register scripts/migrate-client-response-files.ts --dry-run
 *   npx ts-node -r dotenv/config -r tsconfig-paths/register scripts/migrate-client-response-files.ts
 *   npx ts-node -r dotenv/config -r tsconfig-paths/register scripts/migrate-client-response-files.ts --limit=50
 */

import 'reflect-metadata';

import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';

import { documentUpload } from '@/config/env';
import { dbConnect } from '@/database';
import { Attachments } from '@/models/document_attachments.model';
import { Documents } from '@/models/documents.model';
import { ProjectTask } from '@/models/project_task.model';
import { TaskClientResponses } from '@/models/task_client_responses.model';
import { DocumentsDirectory, MetadataType } from '@/shared/enums';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { decodeBase64Attachment, validateFile } from '@/shared/utils/file-validation';

interface Args {
  dryRun: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes('--dry-run');
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
  return { dryRun, limit: Number.isFinite(limit as number) ? (limit as number) : null };
}

function isHostedUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('http');
}

async function run(): Promise<void> {
  const { dryRun, limit } = parseArgs(process.argv.slice(2));
  const knex = dbConnect();
  const cloudinary = new Cloudinary();

  console.log(`\n🔧 Client-response file migration ${dryRun ? '(DRY RUN — no writes)' : ''}`);
  console.log('='.repeat(70));

  // Legacy rows: a non-empty file_url that is NOT already a hosted URL.
  let query = TaskClientResponses.query()
    .whereNotNull('file_url')
    .andWhere('file_url', '!=', '')
    .andWhere('file_url', 'not like', 'http%')
    .whereNull('deleted_at');

  if (limit && limit > 0) query = query.limit(limit);

  const legacyRows = await query;

  console.log(`Found ${legacyRows.length} legacy base64 response(s) to migrate.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of legacyRows) {
    const label = `response ${row.id} (task ${row.task_id})`;

    try {
      // Safety re-check in case the query engine matched unexpectedly.
      if (isHostedUrl(row.file_url)) {
        skipped++;
        continue;
      }

      // Validate the decoded file the same way the live upload path does.
      const buffer = decodeBase64Attachment(row.file_url as string);
      const validation = validateFile(buffer, documentUpload.allowedMimeTypes, documentUpload.maxFileBytes);
      if (!validation.ok) {
        console.warn(`⚠️  Skipping ${label}: ${validation.message}`);
        skipped++;
        continue;
      }

      // Resolve the task to link the document to its project/company.
      const task = await ProjectTask.query().findById(row.task_id);
      if (!task) {
        console.warn(`⚠️  Skipping ${label}: task not found`);
        skipped++;
        continue;
      }

      const fileName = `${task.project_id}/${(row.required_item || 'client-response').trim().replaceAll(' ', '-')}`.toLowerCase();

      if (dryRun) {
        console.log(`• Would migrate ${label} (${(buffer.length / 1024).toFixed(1)} KB, ${validation.detectedMime})`);
        migrated++;
        continue;
      }

      // Upload to storage.
      const upload = await cloudinary.upload(DocumentsDirectory.DOCS, row.file_url as string, fileName);
      if (!upload.status || !upload.data) {
        console.error(`❌ Failed to upload ${label}: storage error`);
        failed++;
        continue;
      }

      const hostedUrl = upload.data;
      const document_id = uuidv4();

      // Persist document + attachment + update the response atomically.
      await Objection.Model.transaction(async (trx) => {
        await Documents.query(trx).insert({
          id: document_id,
          company_id: task.company_id,
          project_id: task.project_id,
          document_type_id: null as any,
          name: row.required_item || 'Client response',
          task_id: row.task_id,
          type: MetadataType.DOCUMENT,
          description: '',
          is_visible_to_client: true,
          does_not_expire: false,
        } as any);

        await Attachments.query(trx).insert({
          document_id,
          media_url: hostedUrl,
        } as any);

        await TaskClientResponses.query(trx).findById(row.id).patch({ file_url: hostedUrl } as any);
      });

      console.log(`✅ Migrated ${label} -> ${hostedUrl}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ${label}: ${(error as Error)?.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Done. ${dryRun ? 'Would migrate' : 'Migrated'}: ${migrated} | Skipped: ${skipped} | Failed: ${failed}`);

  await knex.destroy();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration crashed:', error);
    process.exit(1);
  });
