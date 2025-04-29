import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, inventory, categories, stockMovements, users } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq, like, and, lt, gt } from "drizzle-orm";

// 获取库存列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";
      const categoryFilter = searchParams.get("category") || "";
      const status = searchParams.get("status") || "all"; // all, low, outOfStock
      
      // 构建查询
      let query = db
        .select({
          id: inventory.id,
          productId: products.id,
          name: products.name,
          barcode: products.barcode,
          categoryId: products.categoryId,
          categoryName: categories.name,
          quantity: inventory.quantity,
          minStock: products.minStock,
          purchasePrice: products.purchasePrice,
          sellingPrice: products.sellingPrice,
          image: products.image,
          lastRestocked: inventory.lastRestocked,
          updatedAt: inventory.updatedAt
        })
        .from(inventory)
        .innerJoin(products, eq(inventory.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id));
      
      // 添加过滤条件
      const conditions = [];
      
      if (search) {
        conditions.push(
          like(products.name, `%${search}%`)
        );
      }
      
      if (categoryFilter) {
        conditions.push(
          eq(products.categoryId, parseInt(categoryFilter))
        );
      }
      
      if (status === "low") {
        conditions.push(
          and(
            lt(inventory.quantity, products.minStock),
            gt(inventory.quantity, 0)
          )
        );
      } else if (status === "outOfStock") {
        conditions.push(
          eq(inventory.quantity, 0)
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // 执行查询
      const inventoryItems = await query;
      
      return NextResponse.json({
        success: true,
        data: inventoryItems
      });
    } catch (error) {
      console.error("获取库存列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取库存列表失败" },
        { status: 500 }
      );
    }
  });
}