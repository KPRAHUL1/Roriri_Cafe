import { db } from "../../shared/lib/db";
import nodemailer from "nodemailer";

export async function createToken({ purchaseId, items }: { purchaseId: string, items: any[] }) {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { user: true },
  });

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  const existingToken = await db.token.findUnique({
    where: { purchaseId },
  });

  if (existingToken) {
    return existingToken; 
  }

  const tokenNumber = `TK-${Date.now().toString().slice(-6)}`;

  const email = purchase.user.email;
  const unitPrice = purchase.unitPrice;

  if (!email) {
    throw new Error("User does not have an email");
  }

  const token = await db.token.create({
    data: {
      userId: purchase.userId,
      purchaseId: purchase.id,
      tokenNumber,
      totalAmount: purchase.totalAmount,
      items: JSON.stringify(items),
      sentTo: email,
      sentAt: new Date(),
      emailSent: true,
      smsSent: false,
      status: "Pending",
    
    },
  });
  console.log(items);
  

await sendTokenEmail(purchase.user.email, tokenNumber, items, unitPrice);


  return token;
}

async function sendTokenEmail(to: string, tokenNumber: string, items: any[], grandTotal: number) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kprahul1143@gmail.com",         
      pass: "evqa zlee flqk kikc",          
    },
  });

const itemList = items
    .map((item) => {
      const name = item.name || "Unnamed";
      const qty = item.quantity || 0;
      const unit = item.price || 0;
      const itemTotal = qty * unit;

      return `• ${name} x ${qty} @ ₹${unit} = ₹${itemTotal}`;
    })
    .join("<br>");

console.log("EMAIL ITEMS:", items);

  const mailOptions = {
    from: "Roriri Cafe<kprahul1143@gmail.com>",
    to,
    subject: `🧾 Roriri Cafe Token: ${tokenNumber}`,
    html: `
      <h2>✅ Order Confirmation</h2>
       <p><strong>Token Number:</strong> ${tokenNumber}</p>
      <p><strong>Total:</strong> ₹${grandTotal}</p>
      <p><strong>Items:</strong><br>${itemList}</p>
      <br />
      <p>Thank you for ordering from Roriri Cafe!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

