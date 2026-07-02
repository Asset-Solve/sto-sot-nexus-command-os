import { json } from '@/server/http';
import { actionCatalog } from '@/server/domain/registry';

export async function GET() {
  return json({ actions: actionCatalog() });
}
