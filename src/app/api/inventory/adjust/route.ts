import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventory, stockMovements } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 库存调整
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 解析请求数据
      const body = await req.json();
      const { productId, quantity, notes } = body;
      
      // 验证必填字段
      if (!productId || quantity === undefined || quantity === 0) {
        return NextResponse.json(
          { success: false, message: "缺少必要信息" },
          { status: 400 }
        );
      }
      
      // 查询当前库存
      const currentInventory = await db
        .select({ quantity: inventory.quantity })
        .from(inventory)
        .where(eq(inventory.productId, productId))
        .limit(1);
        
      if (currentInventory.length === 0) {
        return NextResponse.json(
          { success: false, message: "未找到该商品的库存记录" },
          { status: 404 }
        );
      }
      
      // 计算新库存量
      const currentQuantity = currentInventory[0].quantity;
      const newQuantity = currentQuantity + quantity;
      
      // 如果调整后库存为负数，返回错误
      if (newQuantity < 0) {
        return NextResponse.json(
          { success: false, message: "库存数量不能小于0" },
          { status: 400 }
        );
      }
      
      // 开始事务，同时更新库存和添加变动记录
      const timestamp = Date.now();
      
      // 更新库存
      await db
        .update(inventory)
        .set({
          quantity: newQuantity,
          updatedAt: timestamp
        })
        .where(eq(inventory.productId, productId));
      
      // 添加库存变动记录
      await db.insert(stockMovements).values({
        productId,
        quantity,
        type: 'adjustment',
        notes: notes || "手动库存调整",
        userId: user.id,
        timestamp
      });
      
      return NextResponse.json({
        success: true,
        message: "库存调整成功",
        data: {
          productId,
          previousQuantity: currentQuantity,
          adjustedQuantity: quantity,
          newQuantity
        }
      });
    } catch (error) {
      console.error("库存调整失败:", error);
      return NextResponse.json(
        { success: false, message: "库存调整失败，请稍后再试" },
        { status: 500 }
      );
    }
  });
}