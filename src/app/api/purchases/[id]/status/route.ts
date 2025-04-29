import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, purchaseOrderItems, inventory, stockMovements, products } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 更新采购订单状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const purchaseOrderId = parseInt(params.id);
      const { status } = await request.json();
      
      // 验证状态值
      if (!["pending", "delivered", "cancelled"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "无效的状态值" },
          { status: 400 }
        );
      }
      
      // 查询当前采购订单
      const currentOrder = await db
        .select({
          id: purchaseOrders.id,
          status: purchaseOrders.status,
          orderNumber: purchaseOrders.orderNumber
        })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .limit(1);
      
      if (currentOrder.length === 0) {
        return NextResponse.json(
          { success: false, message: "采购订单不存在" },
          { status: 404 }
        );
      }
      
      const oldStatus = currentOrder[0].status;
      
      // 如果状态没有变化，直接返回成功
      if (oldStatus === status) {
        return NextResponse.json({
          success: true,
          message: "状态未发生变化",
          data: { id: purchaseOrderId, status }
        });
      }
      
      const timestamp = Date.now();
      
      // 更新采购订单状态
      await db
        .update(purchaseOrders)
        .set({
          status,
          updatedAt: timestamp
        })
        .where(eq(purchaseOrders.id, purchaseOrderId));
      
      // 如果订单从其他状态变为已完成状态，则更新库存
      if (status === "delivered" && oldStatus !== "delivered") {
        // 查询采购单中的商品明细
        const orderItems = await db
          .select({
            productId: purchaseOrderItems.productId,
            quantity: purchaseOrderItems.quantity
          })
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
        
        // 更新每个商品的库存
        for (const item of orderItems) {
          // 1. 更新库存表
          const inventoryItem = await db
            .select({ id: inventory.id, quantity: inventory.quantity })
            .from(inventory)
            .where(eq(inventory.productId, item.productId))
            .limit(1);
          
          if (inventoryItem.length > 0) {
            // 更新已存在的库存记录
            await db
              .update(inventory)
              .set({
                quantity: inventoryItem[0].quantity + item.quantity,
                lastRestocked: timestamp,
                updatedAt: timestamp
              })
              .where(eq(inventory.id, inventoryItem[0].id));
          } else {
            // 创建新的库存记录
            await db.insert(inventory).values({
              productId: item.productId,
              quantity: item.quantity,
              lastRestocked: timestamp,
              createdAt: timestamp,
              updatedAt: timestamp
            });
          }
          
          // 2. 添加库存变动记录
          await db.insert(stockMovements).values({
            productId: item.productId,
            quantity: item.quantity, // 正数表示库存增加
            type: 'purchase',
            referenceId: purchaseOrderId,
            userId: user.id,
            notes: `采购入库: ${currentOrder[0].orderNumber}`,
            timestamp
          });
        }
        
        return NextResponse.json({
          success: true,
          message: "采购订单已标记为已完成，库存已更新",
          data: { id: purchaseOrderId, status }
        });
      }
      
      // 如果订单从已完成状态变为其他状态，需要回滚库存
      if (oldStatus === "delivered" && status !== "delivered") {
        // 查询采购单中的商品明细
        const orderItems = await db
          .select({
            productId: purchaseOrderItems.productId,
            quantity: purchaseOrderItems.quantity
          })
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
        
        // 更新每个商品的库存
        for (const item of orderItems) {
          // 获取当前库存
          const inventoryItem = await db
            .select({ id: inventory.id, quantity: inventory.quantity })
            .from(inventory)
            .where(eq(inventory.productId, item.productId))
            .limit(1);
          
          if (inventoryItem.length > 0) {
            const newQuantity = Math.max(0, inventoryItem[0].quantity - item.quantity);
            
            // 更新库存
            await db
              .update(inventory)
              .set({
                quantity: newQuantity,
                updatedAt: timestamp
              })
              .where(eq(inventory.id, inventoryItem[0].id));
            
            // 添加库存变动记录
            await db.insert(stockMovements).values({
              productId: item.productId,
              quantity: -item.quantity, // 负数表示库存减少
              type: 'adjustment',
              referenceId: purchaseOrderId,
              userId: user.id,
              notes: `采购订单回滚: ${currentOrder[0].orderNumber}`,
              timestamp
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          message: "采购订单状态已更新，库存已回滚",
          data: { id: purchaseOrderId, status }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: "采购订单状态已更新",
        data: { id: purchaseOrderId, status }
      });
    } catch (error) {
      console.error("更新采购订单状态失败:", error);
      return NextResponse.json(
        { success: false, message: "更新采购订单状态失败" },
        { status: 500 }
      );
    }
  });
}