import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";


const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(request: NextRequest) {
   // Brute-force guard: 5 login tries per minute per IP.
  const gate = checkRateLimit(`login:${clientIp(request)}`, 5, 60_000);
  if (!gate.allowed) {
    return NextResponse.json({ success: false, message: "Too many login tries. Wait a minute and try again." }, { status: 429 });
  }
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    const user = await loginUser(data.email, data.password);
    if ("needOtp" in user && user.needOtp) {
      return NextResponse.json({ success: true, needOtp: true });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
