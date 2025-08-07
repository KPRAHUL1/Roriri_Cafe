import { db } from "../../shared/lib/db";

export async function getAllProducts() {
  return await db.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getProductById(id:any) {
  return await db.product.findUnique({
    where: {
      id: id,
    },
  });
}

export async function createProduct(payload:any) {
  return await db.product.create({
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock || 0,
      minStock: payload.minStock || 5,
      imageUrl: payload.imageUrl,
      imagePath: payload.imagePath,
      category: payload.category,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    },
  });
}

export async function updateProductById(id:any, payload:any) {
  return await db.product.update({
    where: {
      id: id,
    },
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      minStock: payload.minStock,
      imageUrl: payload.imageUrl,
      imagePath: payload.imagePath,
      category: payload.category,
      isActive: payload.isActive,
      updatedAt: new Date(),
    },
  });
}

export async function updateProductStock(id:any, newStock:any, reason:any) {
  const product = await db.product.findUnique({
    where: { id: id },
    select: { stock: true, name: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  return await db.$transaction(async (prisma) => {
    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        stock: newStock,
        updatedAt: new Date(),
      },
    });

    await prisma.stockLog.create({
      data: {
        productId: id,
        oldStock: product.stock,
        newStock: newStock,
        change: newStock - product.stock,
        reason: reason || 'Manual update',
        notes: `Stock updated from ${product.stock} to ${newStock}`,
      },
    });

    return updatedProduct;
  });
}

export async function deleteProductById(id:any) {
  return await db.product.update({
    where: {
      id: id,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
}