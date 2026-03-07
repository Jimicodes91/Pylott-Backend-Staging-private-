import knex from 'knex';
import config from '../knexfile';

const db = knex(config);

interface TableInfo {
  tableName: string;
  exists: boolean;
  columns?: string[];
  indexes?: string[];
}

async function verifySchema(): Promise<void> {
  console.log('🔍 Verifying database schema...\n');

  const tables = [
    'workspaces',
    'users',
    'user_permissions',
    'contacts',
    'contact_invites',
    'project_tasks',
    'projects',
    'notifications',
    'audit_logs',
    'security_logs'
  ];

  const results: TableInfo[] = [];

  for (const tableName of tables) {
    const exists = await db.schema.hasTable(tableName);
    const info: TableInfo = { tableName, exists };

    if (exists) {
      // Get columns
      const columns = await db(tableName).columnInfo();
      info.columns = Object.keys(columns);

      // Get indexes (MySQL specific)
      try {
        const indexes = await db.raw(`SHOW INDEX FROM ${tableName}`);
        info.indexes = [...new Set(indexes[0].map((idx: any) => idx.Key_name))] as string[];
      } catch (error) {
        info.indexes = ['Error fetching indexes'];
      }
    }

    results.push(info);
  }

  // Print results
  console.log('📊 Schema Verification Results:\n');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\n📋 Table: ${result.tableName}`);
    console.log(`   Status: ${result.exists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (result.exists && result.columns) {
      console.log(`   Columns (${result.columns.length}): ${result.columns.join(', ')}`);
    }

    if (result.exists && result.indexes) {
      console.log(`   Indexes (${result.indexes.length}): ${result.indexes.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // Check specific requirements
  console.log('\n🔎 Checking Specific Requirements:\n');

  // Check users table modifications
  if (results.find(r => r.tableName === 'users')?.exists) {
    const usersColumns = results.find(r => r.tableName === 'users')?.columns || [];
    const requiredUserFields = ['workspace_id', 'status', 'is_primary_admin', 'deactivated_at', 'deactivated_by'];
    
    console.log('Users table enhancements:');
    requiredUserFields.forEach(field => {
      const exists = usersColumns.includes(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field}`);
    });
  }

  // Check contacts table modifications
  if (results.find(r => r.tableName === 'contacts')?.exists) {
    const contactsColumns = results.find(r => r.tableName === 'contacts')?.columns || [];
    const requiredContactFields = ['workspace_id', 'status', 'user_id', 'invited_at', 'invited_by', 'closed_projects'];
    
    console.log('\nContacts table enhancements:');
    requiredContactFields.forEach(field => {
      const exists = contactsColumns.includes(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field}`);
    });
  }

  // Check project_tasks table modifications
  if (results.find(r => r.tableName === 'project_tasks')?.exists) {
    const tasksColumns = results.find(r => r.tableName === 'project_tasks')?.columns || [];
    const requiredTaskFields = ['visibility', 'document_url', 'due_date', 'task_type_id'];
    const removedTaskFields = ['start_date'];
    
    console.log('\nProject tasks table enhancements:');
    requiredTaskFields.forEach(field => {
      const exists = tasksColumns.includes(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field} (should exist)`);
    });
    removedTaskFields.forEach(field => {
      const exists = tasksColumns.includes(field);
      console.log(`   ${!exists ? '✅' : '❌'} ${field} (should be removed)`);
    });
  }

  // Check projects table modifications
  if (results.find(r => r.tableName === 'projects')?.exists) {
    const projectsColumns = results.find(r => r.tableName === 'projects')?.columns || [];
    const requiredProjectFields = ['client_contact_id', 'notes'];
    
    console.log('\nProjects table enhancements:');
    requiredProjectFields.forEach(field => {
      const exists = projectsColumns.includes(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field}`);
    });
  }

  // Summary
  const allTablesExist = results.every(r => r.exists);
  console.log('\n' + '='.repeat(80));
  console.log(`\n${allTablesExist ? '✅ All tables exist!' : '⚠️  Some tables are missing'}`);
  console.log('\n✨ Schema verification complete!\n');

  await db.destroy();
}

// Run verification
verifySchema()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error verifying schema:', error);
    process.exit(1);
  });
