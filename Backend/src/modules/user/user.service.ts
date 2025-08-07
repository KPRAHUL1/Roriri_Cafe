import { db } from "../../shared/lib/db";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Constants
const SALT_ROUNDS = 12;
const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Types based on your existing schema
interface CreateUserPayload {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'Student' | 'Employee' | 'Staff' | 'Visitor';
  status?: 'Active' | 'Inactive' | 'Blocked';
  department?: string;
  balance?: number;
  pin?: string;
  qrCodeImage?: string;
}

interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  userType?: 'Student' | 'Employee' | 'Staff' | 'Visitor';
  status?: 'Active' | 'Inactive' | 'Blocked';
  department?: string;
  qrCodeImage?: string;
}

interface RechargePayload {
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'BankTransfer';
  notes?: string;
  reference?: string;
  rechargedBy?: string; // Admin ID
}

export async function getAllUsers(filters?: {
  status?: string;
  userType?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  
  if (filters?.status) {
    where.status = filters.status;
  } else {
    where.status = 'Active'; 
  }
  
  if (filters?.userType) {
    where.userType = filters.userType;
  }
  
  if (filters?.department) {
    where.department = {
      contains: filters.department,
      mode: 'insensitive'
    };
  }
  
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { userId: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        status: true,
        pin:true,
        balance: true,
        department: true,
        qrCode: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
            purchases: true
          }
        }
      }
    }),
    db.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getUserById(id: string) {
  return await db.user.findUnique({
    where: {
      userId: id,
      
    },
    include: {
    
      transactions: {
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      },
      recharges: {
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          admin: {
            select: {
              name: true,
              username: true
            }
          }
        }
      },
      purchases: {
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          product: {
            select: {
              name: true,
              price: true
            }
          }
        }
      },
      tokens: {
        where: {
          status: 'Pending'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      }
    },
  });
}

export async function getUserByQrCode(qrCode: string) {
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
      pin: true, 
      pinAttempts: true,
      pinLockedUntil: true,
      lastUsed: true,
      createdAt: true,
    },
  });

  if (user) {
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastUsed: new Date(),
      },
    });
    const { pin, ...userWithoutPin } = user;
    return {
      ...userWithoutPin,
      hasPin: !!pin,
      isLocked: user.pinLockedUntil && new Date() < user.pinLockedUntil
    };
  }

  return null;
}

export async function getUserByUserId(userId: string) {
  return await db.user.findFirst({
    where: {
      userId: userId,
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
      pin:true,
      department: true,
      qrCode: true,
      lastUsed: true,
      createdAt: true,
    }
  });
}

export async function createUser(payload: CreateUserPayload) {
  const qrCode = generateQrCode(payload.userType, payload.name);
  
  let hashedPin = null;
  if (payload.pin && payload.pin.length === 4) {
    hashedPin = await bcrypt.hash(payload.pin, SALT_ROUNDS);
  }
  
  return await db.$transaction(async (prisma) => {
    const user = await prisma.user.create({
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
        pin: hashedPin,
        pinAttempts: 0,
        pinLockedUntil: null
      },
    });

    if (payload.balance && payload.balance > 0) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'Recharge',
          amount: payload.balance,
          balanceBefore: 0,
          balanceAfter: payload.balance,
          description: 'Initial balance on account creation',
          reference: user.id
        }
      });
    }

    return user;
  });
}

export async function updateUserById(id: string, payload: UpdateUserPayload) {
  return await db.user.update({
    where: {
      id: id,
    },
    data: {
      ...payload,
      updatedAt: new Date(),
    },
  });
}

export async function updateUserBalance(id: string, amount: number, operation: 'add' | 'subtract', description?: string) {
  const user = await db.user.findUnique({
    where: { id: id },
    select: { balance: true, name: true, status: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'Active') {
    throw new Error('Cannot update balance for inactive user');
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

  return await db.$transaction(async (prisma) => {
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        balance: newBalance,
        updatedAt: new Date(),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: id,
        type: operation === 'add' ? 'Recharge' : 'Purchase',
        amount: amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: description || `Balance ${operation === 'add' ? 'added' : 'deducted'}`,
      }
    });

    return updatedUser;
  });
}

export async function rechargeUserBalance(userId: string, payload: RechargePayload) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { balance: true, name: true, status: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'Active') {
    throw new Error('Cannot recharge balance for inactive user');
  }

  if (payload.amount <= 0) {
    throw new Error('Recharge amount must be positive');
  }

  const currentBalance = parseFloat(user.balance.toString());
  const newBalance = currentBalance + payload.amount;

  return await db.$transaction(async (prisma) => {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        balance: newBalance,
        updatedAt: new Date(),
      },
    });
    const recharge = await prisma.recharge.create({
      data: {
        userId: userId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        reference: payload.reference,
        rechargedBy: payload.rechargedBy,
      },
    });
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'Recharge',
        amount: payload.amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Balance recharged via ${payload.paymentMethod}`,
        reference: recharge.id,
      },
    });

    return {
      user: updatedUser,
      recharge: recharge,
    };
  });
}

export async function verifyUserPin(userId: string, pin: string) {
  const user = await db.user.findUnique({
    where: { userId: userId },
    select: {
      pin: true,
      pinAttempts: true,
      pinLockedUntil: true,
      status: true,
      userId: true 
    }
  });

  if (!user || user.status !== 'Active') {
    throw new Error('User not found or inactive');
  }

  if (!user.pin) {
    throw new Error('PIN not set for this user');
  }
  if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
    throw new Error('Account temporarily locked due to too many failed attempts');
  }
  const isValidPin = await bcrypt.compare(pin, user.pin);

  if (isValidPin) {
    await db.user.update({
      where: { userId: user.userId },
      data: { 
        pinAttempts: 0,
        pinLockedUntil: null
      }
    });
    return { success: true, message: 'PIN verified successfully' };
  } else {
    const newAttempts = (user.pinAttempts || 0) + 1;
    
    let updateData: any = { pinAttempts: newAttempts };
    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      updateData.pinLockedUntil = new Date(Date.now() + PIN_LOCK_DURATION);
    }
    
    await db.user.update({
      where: { userId: user.userId },
      data: updateData
    });

    const attemptsRemaining = Math.max(0, MAX_PIN_ATTEMPTS - newAttempts);
    
    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      throw new Error('Account locked due to too many failed attempts');
    }
    
    throw new Error(`Invalid PIN. ${attemptsRemaining} attempts remaining`);
  }
}
export async function setUserPin(userIdentifier: string, pin: string) {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits');
  }
  
  const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
  
  const updatedUser = await db.user.update({
    where: { userId: userIdentifier },
    data: { 
      pin: hashedPin,
      pinAttempts: 0,
      pinLockedUntil: null
    }
  });

  return { success: true, message: 'PIN set successfully' };
}

export async function checkUserHasPin(userId: string) {
  const user = await db.user.findUnique({
    where: { userId: userId },
    select: { pin: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return { hasPin: !!user.pin };
}
export async function deleteUserById(id: string) {
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
export async function getUserStats(userId: string) {
  const [user, transactions, purchases, recharges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        balance: true,
        createdAt: true,
        lastUsed: true
      }
    }),
    db.transaction.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true
    }),
    db.purchase.count({
      where: { userId }
    }),
    db.recharge.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true
    })
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    currentBalance: user.balance,
    totalTransactions: transactions._count,
    totalSpent: transactions._sum.amount || 0,
    totalPurchases: purchases,
    totalRecharges: recharges._count,
    totalRecharged: recharges._sum.amount || 0,
    memberSince: user.createdAt,
    lastActivity: user.lastUsed
  };
}
export async function searchUsers(query: string, filters?: {
  userType?: string;
  department?: string;
  status?: string;
  balanceMin?: number;
  balanceMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: any = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { userId: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters?.userType) {
    where.userType = filters.userType;
  }

  if (filters?.department) {
    where.department = { contains: filters.department, mode: 'insensitive' };
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.balanceMin !== undefined || filters?.balanceMax !== undefined) {
    where.balance = {};
    if (filters.balanceMin !== undefined) {
      where.balance.gte = filters.balanceMin;
    }
    if (filters.balanceMax !== undefined) {
      where.balance.lte = filters.balanceMax;
    }
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo;
    }
  }

  return await db.user.findMany({
    where,
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      userType: true,
      status: true,
      balance: true,
      department: true,
      lastUsed: true,
      createdAt: true
    },
    orderBy: [
      { lastUsed: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 50
  });
}
export async function getUserActivity(userId: string, days: number = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const [transactions, purchases, tokens] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    db.purchase.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      include: {
        product: {
          select: { name: true, price: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    db.token.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  return {
    period: `Last ${days} days`,
    transactions,
    purchases,
    tokens,
    summary: {
      totalTransactions: transactions.length,
      totalPurchases: purchases.length,
      totalSpent: transactions
        .filter(t => t.type === 'Purchase')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      totalRecharged: transactions
        .filter(t => t.type === 'Recharge')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    }
  };
}
export async function exportUserData(userId: string) {
  const userData = await db.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' }
      },
      recharges: {
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { name: true, username: true }
          }
        }
      },
      purchases: {
        include: {
          product: true
        },
        orderBy: { createdAt: 'desc' }
      },
      tokens: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!userData) {
    throw new Error('User not found');
  }
  const { pin, pinAttempts, pinLockedUntil, ...exportData } = userData;

  return exportData;
}
export function validateUserData(userData: CreateUserPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!userData.name?.trim()) {
    errors.push('Name is required');
  }

  if (!userData.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }
  if (userData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(userData.phone.replace(/\s/g, ''))) {
    errors.push('Invalid phone number format');
  }

  if (userData.balance !== undefined && userData.balance < 0) {
    errors.push('Balance cannot be negative');
  }

  if (userData.pin && (userData.pin.length !== 4 || !/^\d{4}$/.test(userData.pin))) {
    errors.push('PIN must be exactly 4 digits');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
export async function getSystemStats() {
  const [
    totalUsers,
    activeUsers,
    usersByType,
    totalBalance,
    recentActivity
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'Active' } }),
    db.user.groupBy({
      by: ['userType'],
      _count: true
    }),
    db.user.aggregate({
      _sum: { balance: true }
    }),
    db.user.count({
      where: {
        lastUsed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    usersByType: usersByType.reduce((acc, item) => ({
      ...acc,
      [item.userType]: item._count
    }), {}),
    totalSystemBalance: totalBalance._sum.balance || 0,
    activeInLast24Hours: recentActivity,
    activityRate: totalUsers > 0 ? (recentActivity / totalUsers * 100).toFixed(1) + '%' : '0%'
  };
}

function generateQrCode(userType: string, name: string): string {
  const prefix = userType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const nameCode = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${nameCode}${timestamp}${randomSuffix}`;
}

function generateUserId(userType: string): string {
  const prefix = userType === 'Student' ? 'STU' : 
                 userType === 'Employee' ? 'EMP' : 
                 userType === 'Staff' ? 'STF' : 'VST';
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${prefix}${year}${randomNum}`;
}