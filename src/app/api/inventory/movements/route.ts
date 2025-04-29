import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockMovements, products, users } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

// 获取库存变动记录
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      
      const movements = await db
        .select({
          id: stockMovements.id,
          productId: stockMovements.productId,
          productName: products.name,
          quantity: stockMovements.quantity,
          type: stockMovements.type,
          notes: stockMovements.notes,
          userId: stockMovements.userId,
          userName: users.name,
          timestamp: stockMovements.timestamp
        })
        .from(stockMovements)
        .innerJoin(products, eq(stockMovements.productId, products.id))
        .innerJoin(users, eq(stockMovements.userId, users.id))
        .orderBy(desc(stockMovements.timestamp))
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        data: movements
      });
    } catch (error) {
      console.error("获取库存变动记录失败:", error);
      return NextResponse.json(
        { success: false, message: "获取库存变动记录失败" },
        { status: 500 }
      );
    }
  });
}