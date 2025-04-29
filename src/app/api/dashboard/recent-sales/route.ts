import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, users } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "10");

      // 获取最近的销售记录
      const recentSales = await db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          amount: sales.finalAmount,
          discount: sales.discount,
          saleDate: sales.saleDate,
          customerName: sales.customerName,
          cashier: users.name,
        })
        .from(sales)
        .leftJoin(users, eq(sales.userId, users.id))
        .orderBy(desc(sales.saleDate))
        .limit(limit);

      return NextResponse.json({
        success: true,
        data: recentSales
      });
    } catch (error) {
      console.error("获取最近销售数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取最近销售数据失败" },
        { status: 500 }
      );
    }
  });
}