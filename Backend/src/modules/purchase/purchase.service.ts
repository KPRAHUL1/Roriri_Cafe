import { db } from '../../shared/lib/db';

interface PurchaseItem {
  productId: string;
  quantity: number;
}

interface PurchaseRequest {
  userId: string;
  items: PurchaseItem[];
}

export async function createPurchase({ userId, items }: PurchaseRequest) {
  if (!userId || !items || items.length === 0) {
    throw new Error("User ID and items are required");
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user || user.status !== "Active") {
    throw new Error("Invalid or inactive user");
  }

  let totalAmount = 0;
  const purchaseDetails = [];

  for (const item of items) {
    const product = await db.product.findUnique({ where: { id: item.productId } });

    if (!product || !product.isActive || product.stock < item.quantity) {
      throw new Error(`Invalid or out-of-stock product: ${item.productId}`);
    }

    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;

    purchaseDetails.push({
      productId: product.id,
      unitPrice: product.price,
      quantity: item.quantity,
      totalAmount: itemTotal,
    });
  }

  if (user.balance < totalAmount) {
    throw new Error("Insufficient balance");
  }

  const transaction = await db.transaction.create({
    data: {
      userId,
      type: "Purchase",
      amount: totalAmount,
      balanceBefore: user.balance,
      balanceAfter: user.balance - totalAmount,
      description: "Food product purchase",
    },
  });

  const createdPurchases = [];

  for (const detail of purchaseDetails) {
    const purchase = await db.purchase.create({
      data: {
        userId,
        productId: detail.productId,
        transactionId: transaction.id,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        totalAmount: detail.totalAmount,
      },
    });

    await db.product.update({
      where: { id: detail.productId },
      data: {
        stock: { decrement: detail.quantity },
      },
    });

    createdPurchases.push(purchase);
  }

  await db.user.update({
    where: { id: userId },
    data: {
      balance: { decrement: totalAmount },
      lastUsed: new Date(),
    },
  });

  return {
    message: "Purchase successful",
    transactionId: transaction.id,
    totalAmount,
    purchases: createdPurchases,
  };
}
