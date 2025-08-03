import nodemailer from 'nodemailer';

export async function sendPurchaseEmail(to: string, transactionId: string, productName: string, quantity: number, totalCost: number) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SmartCanteen" <${process.env.MAIL_USER}>`,
    to,
    subject: `✅ Purchase Confirmed - ${productName}`,
    html: `
      <h2>Thank you for your purchase!</h2>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Total:</strong> ₹${totalCost}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
    `,
  });
}
