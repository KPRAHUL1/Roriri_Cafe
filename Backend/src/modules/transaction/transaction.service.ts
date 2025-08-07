import { db } from "../../shared/lib/db";
import { Prisma } from '@prisma/client';

export async function createTransaction(userId: string, items: any[], totalAmount: number) {
  if (!userId || !items || totalAmount <= 0) {
    throw new Error('Invalid transaction data');
  }

  const result = await db.$transaction(async (tx: any) => {
    const user = await tx.user.findUnique({ where: { userId } });

    if (!user || user.balance < totalAmount) {
      throw new Error('Insufficient balance or user not found');
    }

    const newBalance = user.balance - totalAmount;

    await tx.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        type: 'Purchase',
        amount: totalAmount,
        balanceBefore: user.balance,
        balanceAfter: newBalance,
        description: `Purchase of ${items.length} items`,
        reference: `ORDER_${Date.now()}`,
        items: items as Prisma.JsonValue,
      },
    });

    const createdPurchases = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.id } });

      if (!product || !product.isActive || product.stock < item.quantity) {
        throw new Error(`Invalid or out-of-stock product: ${item.id}`);
      }

      const itemTotal = product.price * item.quantity;

      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          productId: item.id,
          transactionId: transaction.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalAmount: itemTotal,
        },
      });

      await tx.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } },
      });

      createdPurchases.push(purchase);
    }

    return {
      orderId: transaction.id,
      newBalance,
      estimatedTime: '15 mins',
      purchases: createdPurchases,
    };
  });

  return result;
}
