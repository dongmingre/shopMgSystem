import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, inventory, categories } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 1. 首先获取所有分类
      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .orderBy(categories.name);
      
      // 2. 查询每个分类中的商品数量
      const productsByCategory = await db
        .select({
          categoryId: products.categoryId,
          totalProducts: count(),
        })
        .from(products)
        .groupBy(products.categoryId);
      
      // 3. 查询每个分类的库存价值
      const inventoryValueByCategory = await db
        .select({
          categoryId: products.categoryId,
          totalValue: sql`SUM(${products.price} * COALESCE(${inventory.quantity}, 0))`,
        })
        .from(products)
        .leftJoin(inventory, eq(products.id, inventory.productId))
        .groupBy(products.categoryId);
      
      // 4. 查询每个分类的低库存商品数量
      const lowStockByCategory = await db
        .select({
          categoryId: products.categoryId,
          lowStockCount: count(),
        })
        .from(products)
        .leftJoin(inventory, eq(products.id, inventory.productId))
        .where(sql`COALESCE(${inventory.quantity}, 0) < ${products.minStock}`)
        .groupBy(products.categoryId);
      
      // 5. 计算所有低库存商品总数
      const lowStockResult = await db
        .select({
          count: count(),
        })
        .from(products)
        .leftJoin(inventory, eq(products.id, inventory.productId))
        .where(sql`COALESCE(${inventory.quantity}, 0) < ${products.minStock}`);
      
      const lowStockCount = lowStockResult[0]?.count || 0;
      
      // 6. 计算库存总价值
      const totalValueResult = await db
        .select({
          value: sql`SUM(${products.price} * COALESCE(${inventory.quantity}, 0))`,
        })
        .from(products)
        .leftJoin(inventory, eq(products.id, inventory.productId));
      
      const totalValue = totalValueResult[0]?.value || 0;
      
      // 7. 整合所有数据
      const categorySummary = allCategories.map(category => {
        const productCount = productsByCategory.find(p => p.categoryId === category.id);
        const inventoryValue = inventoryValueByCategory.find(i => i.categoryId === category.id);
        const lowStock = lowStockByCategory.find(l => l.categoryId === category.id);
        
        return {
          categoryName: category.name,
          totalProducts: Number(productCount?.totalProducts || 0),
          totalValue: Number(inventoryValue?.totalValue || 0),
          lowStockCount: Number(lowStock?.lowStockCount || 0),
        };
      });
      
      return NextResponse.json({
        success: true,
        data: {
          categorySummary,
          lowStockCount: Number(lowStockCount),
          totalValue: Number(totalValue)
        }
      });
    } catch (error) {
      console.error("获取库存报表数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取库存报表数据失败" },
        { status: 500 }
      );
    }
  });
}