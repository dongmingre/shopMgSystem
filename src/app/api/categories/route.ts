import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 获取所有分类
      const allCategories = await db.select().from(categories);

      return NextResponse.json({
        success: true,
        data: allCategories
      });
    } catch (error) {
      console.error("获取分类失败:", error);
      return NextResponse.json(
        { success: false, message: "获取分类失败" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      if (!body.name) {
        return NextResponse.json(
          { success: false, message: "分类名称为必填项" },
          { status: 400 }
        );
      }
      
      // 检查分类名称是否已存在
      const existingCategory = await db
        .select()
        .from(categories)
        .where(sql`LOWER(name) = ${body.name.toLowerCase()}`);
        
      if (existingCategory.length > 0) {
        return NextResponse.json(
          { success: false, message: "分类名称已存在" },
          { status: 400 }
        );
      }
      
      // 插入新分类
      const newCategory = await db.insert(categories).values({
        name: body.name,
        description: body.description || null,
      }).returning();
      
      return NextResponse.json({
        success: true,
        data: newCategory[0]
      });
    } catch (error) {
      console.error("创建分类失败:", error);
      return NextResponse.json(
        { success: false, message: "创建分类失败" },
        { status: 500 }
      );
    }
  });
}