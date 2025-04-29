import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, products } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { and, gte, lte, eq, sql, desc, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 获取查询参数
      const searchParams = request.nextUrl.searchParams;
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const limit = parseInt(searchParams.get("limit") || "10");
      
      // 验证日期参数
      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, message: "开始日期和结束日期为必填项" },
          { status: 400 }
        );
      }
      
      // 将日期字符串转换为时间戳
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate + "T23:59:59").getTime();
      
      // 获取热销商品数据
      const topProducts = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          totalQuantity: sum(saleItems.quantity),
          totalAmount: sum(saleItems.totalPrice)
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(
          and(
            gte(sales.saleDate, startTimestamp),
            lte(sales.saleDate, endTimestamp)
          )
        )
        .groupBy(saleItems.productId, products.name)
        .orderBy(desc(sum(saleItems.quantity)))
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        data: topProducts.map(product => ({
          productId: product.productId,
          productName: product.productName,
          totalQuantity: Number(product.totalQuantity) || 0,
          totalAmount: Number(product.totalAmount) || 0
        }))
      });
    } catch (error) {
      console.error("获取热销商品数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取热销商品数据失败" },
        { status: 500 }
      );
    }
  });
}