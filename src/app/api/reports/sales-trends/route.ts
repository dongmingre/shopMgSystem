import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { and, gte, lte, sql, desc, count, sum } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 获取查询参数
      const searchParams = request.nextUrl.searchParams;
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      
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
      
      // 按日期分组获取销售数据
      const dailySalesData = await db
        .select({
          date: sql`DATE(DATETIME(${sales.saleDate} / 1000, 'unixepoch'))`,
          salesAmount: sum(sales.finalAmount),
          salesCount: count()
        })
        .from(sales)
        .where(
          and(
            gte(sales.saleDate, startTimestamp),
            lte(sales.saleDate, endTimestamp)
          )
        )
        .groupBy(sql`DATE(DATETIME(${sales.saleDate} / 1000, 'unixepoch'))`)
        .orderBy(sql`DATE(DATETIME(${sales.saleDate} / 1000, 'unixepoch'))`, "asc");
      
      // 获取总销售金额和数量
      const [totalSales] = await db
        .select({
          totalAmount: sum(sales.finalAmount),
          totalCount: count()
        })
        .from(sales)
        .where(
          and(
            gte(sales.saleDate, startTimestamp),
            lte(sales.saleDate, endTimestamp)
          )
        ) || [{ totalAmount: 0, totalCount: 0 }];
      
      return NextResponse.json({
        success: true,
        data: {
          salesByDate: dailySalesData.map(item => ({
            date: item.date,
            salesAmount: Number(item.salesAmount) || 0,
            salesCount: Number(item.salesCount) || 0
          })),
          totalSalesAmount: Number(totalSales.totalAmount) || 0,
          totalSalesCount: Number(totalSales.totalCount) || 0
        }
      });
    } catch (error) {
      console.error("获取销售趋势数据失败:", error);
      return NextResponse.json(
        { success: false, message: "获取销售趋势数据失败" },
        { status: 500 }
      );
    }
  });
}