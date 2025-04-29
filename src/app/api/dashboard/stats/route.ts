import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, inventory, sales, saleItems } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq, lt, sql, desc, count, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 获取今日开始时间戳
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      
      // 获取本月开始时间戳
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartTimestamp = firstDayOfMonth.getTime();

      // 1. 获取商品总数
      const totalProductsResult = await db
        .select({ value: count() })
        .from(products);
      const totalProducts = totalProductsResult[0]?.value || 0;

      // 2. 获取低库存商品数量
      const lowStockProductsQuery = await db
        .select({
          id: products.id,
          name: products.name,
          quantity: inventory.quantity,
          minStock: products.minStock
        })
        .from(products)
        .leftJoin(inventory, eq(products.id, inventory.productId))
        .where(
          sql`COALESCE(${inventory.quantity}, 0) < ${products.minStock}`
        );

      const lowStockProducts = lowStockProductsQuery.length;
      
      // 3. 获取今日销售额
      const todaySalesResult = await db
        .select({
          value: sql`COALESCE(SUM(${sales.finalAmount}), 0)`
        })
        .from(sales)
        .where(sql`${sales.saleDate} >= ${todayTimestamp}`);
      const todaySales = Number(todaySalesResult[0]?.value || 0);

      // 4. 获取本月销售额
      const monthlySalesResult = await db
        .select({
          value: sql`COALESCE(SUM(${sales.finalAmount}), 0)`
        })
        .from(sales)
        .where(sql`${sales.saleDate} >= ${monthStartTimestamp}`);
      const monthlySales = Number(monthlySalesResult[0]?.value || 0);

      // 5. 获取总销售额
      const totalSalesResult = await db
        .select({
          value: sql`COALESCE(SUM(${sales.finalAmount}), 0)`,
          count: count()
        })
        .from(sales);
      const totalSales = Number(totalSalesResult[0]?.value || 0);

      // 6. 获取热销商品（销售量最多的前10个）
      let topSellingProducts = [];
      try {
        topSellingProducts = await db
          .select({
            productId: saleItems.productId,
            productName: products.name,
            totalQuantity: sql`COALESCE(SUM(${saleItems.quantity}), 0)`,
            totalSales: sql`COALESCE(SUM(${saleItems.totalPrice}), 0)`
          })
          .from(saleItems)
          .leftJoin(products, eq(saleItems.productId, products.id))
          .groupBy(saleItems.productId, products.name)
          .orderBy(desc(sql`COALESCE(SUM(${saleItems.quantity}), 0)`))
          .limit(10);
      } catch (error) {
        console.error("获取热销商品数据失败:", error);
        // 如果热销商品查询失败，不影响其他统计数据的返回
        topSellingProducts = [];
      }

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          lowStockProducts,
          todaySales,
          monthlySales,
          totalSales,
          topSellingProducts: topSellingProducts || [],
          lowStockProductsList: lowStockProductsQuery.slice(0, 5) // 只返回前5个低库存商品
        }
      });
    } catch (error) {
      console.error("获取统计数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取统计数据失败" },
        { status: 500 }
      );
    }
  });
}