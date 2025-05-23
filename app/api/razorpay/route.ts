import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendOrderEvent } from "@/app/api/services/rotue";

// Generate the Razorpay signature for verification
const generatedSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
) => {
  const keySecret = process.env.RAZORPAY_YOUR_SECRET as string;

  return crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
};

// Handle the POST request
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, DB_ORDER_ID } =
    await request.json();

    // Verify the signature
    const signature = generatedSignature(razorpay_order_id, razorpay_payment_id);
    if (signature !== razorpay_signature) {
      return NextResponse.json(
        { message: "Payment verification failed", isOk: false },
        { status: 400 }
      );
    }

    // Fetch the order from the database using DB_ORDER_ID
    const order = await prisma.order.findFirst({
      where: { id: DB_ORDER_ID }, // Assuming DB_ORDER_ID is defined
      include: {
        User: true,  // Includes related user data
        Product: true, // Includes related product data
      },
    });
    

    // Check if the order exists and razorpay_order_id matches
    if (!order) {
      return NextResponse.json(
        { message: "Order not found", isOk: false },
        { status: 404 }
      );
    }

    if(order.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json(
        { message: "Order not found", isOk: false },
        { status: 404 })
    };

    const updatedOrder = await prisma.order.update({
      where: { id: DB_ORDER_ID },
      data: { paymentStatus: "PAID",  razorpay_payment_id : razorpay_payment_id},
    }
  );

    await sendOrderEvent(order , "order.placed");

    return NextResponse.json(
      { message: "Payment verified and order updated successfully", isOk: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment or updating order:", error);
    return NextResponse.json(
      { message: "Internal server error", isOk: false },
      { status: 500 }
    );
  }
}
