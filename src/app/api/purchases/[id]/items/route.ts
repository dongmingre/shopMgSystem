import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrderItems, purchaseOrders, products } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 获取指定采购订单的商品明细
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const purchaseOrderId = parseInt(params.id);
      
      // 验证采购订单是否存在
      const purchaseOrder = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .limit(1);
      
      if (purchaseOrder.length === 0) {
        return NextResponse.json(
          { success: false, message: "采购订单不存在" },
          { status: 404 }
        );
      }
      
      // 查询采购订单商品明细
      const items = await db
        .select({
          id: purchaseOrderItems.id,
          productId: purchaseOrderItems.productId,
          productName: products.name,
          quantity: purchaseOrderItems.quantity,
          unitPrice: purchaseOrderItems.unitPrice,
          totalPrice: purchaseOrderItems.totalPrice,
          createdAt: purchaseOrderItems.createdAt
        })
        .from(purchaseOrderItems)
        .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
        .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
      
      return NextResponse.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error("获取采购订单详情失败:", error);
      return NextResponse.json(
        { success: false, message: "获取采购订单详情失败" },
        { status: 500 }
      );
    }
  });
}