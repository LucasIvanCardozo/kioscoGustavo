import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';
import type { Session } from 'next-auth';
import type z from 'zod';
import createAction, { type CreateActionResponse } from '@/lib/server/actions/createAction';
import { auth } from '@/lib/server/auth/auth';

const ACTION_ERROR_CODES = {
  UNAUTHORIZED: '401',
  FORBIDDEN: '403',
} as const;

const unauthorizedActionError = (
  message = 'Debes iniciar sesión para realizar esta acción.',
) => new Error(message, { cause: ACTION_ERROR_CODES.UNAUTHORIZED });

const forbiddenActionError = (message = 'No tienes permiso para realizar esta acción.') =>
  new Error(message, { cause: ACTION_ERROR_CODES.FORBIDDEN });

export type ActionContext<TSchema extends z.Schema> = {
  data: z.infer<TSchema>;
  session: Session;
  db: PrismaClient | Prisma.TransactionClient;
};

type ProtectedActionOptions<TSchema extends z.Schema, TResult> = {
  schema: TSchema | null;
  authorize?: (context: ActionContext<TSchema>) => Promise<boolean> | boolean;
  db?: PrismaClient | Prisma.TransactionClient;
  handler: (context: ActionContext<TSchema>) => Promise<TResult>;
};

export const createProtectedAction = <TSchema extends z.Schema, TResult>({
  schema,
  authorize,
  db: dbProvider,
  handler,
}: ProtectedActionOptions<TSchema, TResult>): CreateActionResponse<z.infer<TSchema>, TResult> =>
  createAction(schema, async ({ data, db }) => {
    let session: Session | null;
    try {
      session = await auth();
    } catch (err) {
      console.error('[createProtectedAction] auth() failed:', err);
      throw unauthorizedActionError();
    }
    if (!session) {
      throw unauthorizedActionError();
    }

    const dbToUse = dbProvider ?? db;

    if (authorize) {
      const isAuthorized = await authorize({
        data,
        session,
        db: dbToUse,
      });

      if (!isAuthorized) {
        throw forbiddenActionError();
      }
    }

    return handler({
      data,
      session,
      db: dbToUse,
    });
  });
