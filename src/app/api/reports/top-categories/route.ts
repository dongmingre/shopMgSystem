import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, products, categories } from "@/lib/db/schema";
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
      
      // 获取销售分类数据
      const topCategories = await db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          totalQuantity: sum(saleItems.quantity),
          totalAmount: sum(saleItems.totalPrice)
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            gte(sales.saleDate, startTimestamp),
            lte(sales.saleDate, endTimestamp)
          )
        )
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sum(saleItems.totalPrice)))
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        data: topCategories.map(category => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          totalQuantity: Number(category.totalQuantity) || 0,
          totalAmount: Number(category.totalAmount) || 0
        }))
      });
    } catch (error) {
      console.error("获取销售分类数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取销售分类数据失败" },
        { status: 500 }
      );
    }
  });
}