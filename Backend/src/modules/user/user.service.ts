import { db } from "../../shared/lib/db";
import { v4 as uuidv4 } from 'uuid';

// Get all active users
export async function getAllUsers() {
  return await db.user.findMany({
    where: {
      status: 'Active',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get user by ID
export async function getUserById(id: any) {
  return await db.user.findUnique({
    where: {
      id: id,
    },
    include: {
      transactions: {
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

// Get user by QR code - main scanner function
export async function getUserByQrCode(qrCode: any) {
  const user = await db.user.findFirst({
    where: {
      qrCode: qrCode,
      status: 'Active',
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      userType: true,
      status: true,
      balance: true,
      department: true,
      qrCode: true,
      qrCodeImage: true,
      lastUsed: true,
      createdAt: true,
    },
  });

  if (user) {
    // Update last used timestamp
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastUsed: new Date(),
      },
    });
  }

  return user;
}

// Get user by custom userId field
export async function getUserByUserId(userId: any) {
  return await db.user.findFirst({
    where: {
      userId: userId,
      status: 'Active',
    },
  });
}

// Create new user with QR code generation
export async function createUser(payload: any) {
  // Generate unique QR code
  const qrCode = generateQrCode(payload.userType, payload.name);
  
  return await db.user.create({
    data: {
      userId: payload.userId || generateUserId(payload.userType),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      userType: payload.userType,
      status: payload.status || 'Active',
      qrCode: qrCode,
      qrCodeImage: payload.qrCodeImage,
      balance: payload.balance || 0.00,
      department: payload.department,
    },
  });
}

// Update user by ID
export async function updateUserById(id: any, payload: any) {
  return await db.user.update({
    where: {
      id: id,
    },
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      userType: payload.userType,
      status: payload.status,
      department: payload.department,
      qrCodeImage: payload.qrCodeImage,
      updatedAt: new Date(),
    },
  });
}

// Update user balance
export async function updateUserBalance(id: any, amount: number, operation: string) {
  const user = await db.user.findUnique({
    where: { id: id },
    select: { balance: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const currentBalance = parseFloat(user.balance.toString());
  let newBalance: number;

  if (operation === 'add') {
    newBalance = currentBalance + amount;
  } else if (operation === 'subtract') {
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }
    newBalance = currentBalance - amount;
  } else {
    throw new Error('Invalid operation. Use "add" or "subtract"');
  }

  return await db.user.update({
    where: {
      id: id,
    },
    data: {
      balance: newBalance,
      updatedAt: new Date(),
    },
  });
}

// Recharge user balance and create recharge record
export async function rechargeUserBalance(userId: any, payload: any) {
  const { amount, paymentMethod, notes, rechargedBy } = payload;

  // Use transaction to ensure data consistency
  return await db.$transaction(async (prisma) => {
    // Update user balance
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: {
          increment: amount,
        },
        updatedAt: new Date(),
      },
    });

    // Create recharge record
    const recharge = await prisma.recharge.create({
      data: {
        userId: userId,
        amount: amount,
        paymentMethod: paymentMethod,
        notes: notes,
        rechargedBy: rechargedBy,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'Recharge',
        amount: amount,
        balanceBefore: updatedUser.balance - amount,
        balanceAfter: updatedUser.balance,
        description: `Balance recharged via ${paymentMethod}`,
        reference: recharge.id,
      },
    });

    return {
      user: updatedUser,
      recharge: recharge,
    };
  });
}

// Soft delete user
export async function deleteUserById(id: any) {
  return await db.user.update({
    where: {
      id: id,
    },
    data: {
      status: 'Inactive',
      updatedAt: new Date(),
    },
  });
}

// Helper functions
function generateQrCode(userType: string, name: string): string {
  const prefix = userType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const nameCode = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  return `${prefix}${nameCode}${timestamp}`;
}

function generateUserId(userType: string): string {
  const prefix = userType === 'Student' ? 'STU' : 
                 userType === 'Employee' ? 'EMP' : 
                 userType === 'Staff' ? 'STF' : 'VST';
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${prefix}${randomNum}`;
}