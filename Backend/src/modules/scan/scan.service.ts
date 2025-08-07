import { UserType } from '@prisma/client';
import { db } from '../../shared/lib/db';

export async function scanQRCode(qrCode: string) {
  if (!qrCode) throw new Error('QR Code is required');

  const user = await db.user.findFirst({
    where: {
      OR: [
        { qrCode: qrCode },
        { userId: qrCode },
        { email: qrCode },
        {pin:qrCode}
      ],
      status: 'Active'
    },
    include: {
      transactions: {
        where: { type: 'Purchase' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) throw new Error('User not found');

  return {
    userId: user.userId,
    name: user.name,
    role: user.userType,
    balance: user.balance,
    email: user.email,
    phone: user.phone,
    qrCode:user.qrCode,
    pin:user.pin,
    department:user.department,
    UserType:user.userType,
    recentPurchases: user.transactions,
  };
}