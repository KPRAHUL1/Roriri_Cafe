import { db } from '../../../shared/lib/db';

export async function getAllOrderHistories() {
  return await db.transaction.findMany({
    where: {
      type: 'Purchase',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      purchases: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
