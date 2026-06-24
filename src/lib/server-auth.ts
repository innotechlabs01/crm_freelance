import { auth } from '@clerk/nextjs/server';

const TEST_USER_ID = 'test-user-playwright';

export async function getAuthUserId(): Promise<string | null> {
  if (process.env.PLAYWRIGHT_TEST === '1') {
    return TEST_USER_ID;
  }
  const { userId } = await auth();
  return userId;
}
