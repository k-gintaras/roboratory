import { setupTaggingDatabase } from './index';
import { PostgresService } from '../services-reuse/postgres-service';

const database = "tagging_private";

async function main() {
  const service = new PostgresService();
  await setupTaggingDatabase(service, database);
  await service.close();
  console.log('✅ Tagging database schema setup complete');
}

main().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
