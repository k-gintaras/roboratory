import { PostgresService } from '../services-reuse/postgres-service';
import { importTagGroupsAndTags } from './music-tag-importer';

(async () => {
  const service = new PostgresService();
  await importTagGroupsAndTags(service);
  await service.close();
  console.log('✅ Tag groups and tags imported from music-data.csv');
})();
