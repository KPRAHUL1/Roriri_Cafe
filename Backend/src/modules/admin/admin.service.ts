import { db } from "../../shared/lib/db";
import { hashPassword, comparePassword, generateToken } from "../../shared/lib/utils/auth";

export async function registerAdmin(payload: any) {
  const existing = await db.admin.findUnique({
    where: { email: payload.email },
  });
  if (existing) throw new Error("Admin already exists");

  const hashed = await hashPassword(payload.password);

  const admin = await db.admin.create({
    data: {
      name: payload.name,
      email: payload.email,
      username: payload.username,
      password: hashed,
      role: payload.role || "Staff",
      ...(payload.phone && { phone: payload.phone }),
    },
  });

  return { message: "Registered Successfully", admin };
}


export async function loginAdmin(payload: any) {
  const admin = await db.admin.findUnique({
    where: { email: payload.email },
  });

  if (!admin) throw new Error("Invalid credentials");

  const valid = await comparePassword(payload.password, admin.password);

  if (!valid) throw new Error("Invalid credentials");

  const token = generateToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return {
    message: "Login successful",
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}
