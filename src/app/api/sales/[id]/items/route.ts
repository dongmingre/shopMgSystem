import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saleItems, sales, products } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 获取指定销售的商品明细
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const saleId = parseInt(params.id);
      
      // 验证销售记录是否存在
      const saleRecord = await db
        .select()
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1);
      
      if (saleRecord.length === 0) {
        return NextResponse.json(
          { success: false, message: "销售记录不存在" },
          { status: 404 }
        );
      }
      
      // 查询销售商品明细
      const items = await db
        .select({
          id: saleItems.id,
          productId: saleItems.productId,
          productName: products.name,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          createdAt: saleItems.createdAt
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, saleId));
      
      return NextResponse.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error("获取销售详情失败:", error);
      return NextResponse.json(
        { success: false, message: "获取销售详情失败" },
        { status: 500 }
      );
    }
  });
}