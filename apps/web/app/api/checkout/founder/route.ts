import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; userId?: string };
  const email = body.email?.trim().toLowerCase();
  const userId = body.userId?.trim();

  if (!email || !userId) {
    return NextResponse.json({ error: "Email and user ID are required." }, { status: 400 });
  }

  const capResponse = await fetch(`${API_BASE_URL}/api/billing/cap`, { cache: "no-store" });
  if (!capResponse.ok) {
    return NextResponse.json({ error: "Could not verify founder availability." }, { status: 502 });
  }

  const cap = (await capResponse.json()) as { cap_reached?: boolean };
  if (cap.cap_reached) {
    return NextResponse.json({ error: "All founder seats are currently taken." }, { status: 409 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: userId,
    line_items: [{ price: process.env.STRIPE_FOUNDER_PRICE_ID!, quantity: 1 }],
    success_url: `${SITE_URL}/founder/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/founder/checkout?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
