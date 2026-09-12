import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import db from '@/lib/server/db/db';
import { productUseCases } from '@/lib/server/useCases';

export const instant = false;

async function handleCleanup(request: Request): Promise<NextResponse> {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const result = await productUseCases.cleanupOldZeroStockProducts(db);
    const durationMs = Date.now() - startTime;

    console.info('[cron:cleanup-stock]', {
      deletedCount: result.deletedCount,
      ids: result.ids,
      durationMs,
    });

    return NextResponse.json({
      deletedCount: result.deletedCount,
      ids: result.ids,
      durationMs,
    });
  } catch (error) {
    console.error('[cron:cleanup-stock] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { handleCleanup as GET, handleCleanup as POST };
