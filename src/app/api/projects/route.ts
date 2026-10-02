import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

const createSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url().startsWith("https://", { message: "Website URL must use https://" }),
  language: z.string().default("en"),
  targetCountry: z.string().default("IN"),
  targetCity: z.string().optional().nullable(),
  siteType: z.enum(["local", "global"]).default("local"),
  settings: z.record(z.string(), z.any()).optional(),
  businessDescription: z.string().min(100, "Business description must be at least 100 characters"),
  industry: z.string().optional(),
  audience: z.string().optional(),
  productsServices: z.string().optional(),
  competitors: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const list = await db.query.projects.findMany({
      where: eq(projects.userId, session.userId!),
      orderBy: desc(projects.createdAt),
    });
    return NextResponse.json({ success: true, projects: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createSchema.parse(body);

    const siteType = data.siteType || (data.targetCity ? "local" : "global");
    const targetCity = siteType === "local" ? (data.targetCity?.trim() || null) : null;
    const settings = {
      ...(data.settings || {}),
      siteType,
    };

    const [project] = await db
      .insert(projects)
      .values({
        name: data.name,
        websiteUrl: data.websiteUrl,
        language: data.language,
        targetCountry: data.targetCountry,
        targetCity,
        settings,
        businessDescription: data.businessDescription,
        industry: data.industry,
        audience: data.audience,
        productsServices: data.productsServices,
        competitors: data.competitors,
        userId: session.userId!,
      })
      .returning();

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
