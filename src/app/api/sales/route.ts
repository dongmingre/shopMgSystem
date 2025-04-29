import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, users, stockMovements, inventory } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { desc, eq, like, and, sql } from "drizzle-orm";

// 获取销售列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";
      const dateFilter = searchParams.get("date") || "";
      const paymentFilter = searchParams.get("payment") || "";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;
      
      // 构建查询条件
      const conditions = [];
      
      if (search) {
        conditions.push(
          sql`(${sales.customerName} LIKE ${'%' + search + '%'} OR ${sales.invoiceNumber} LIKE ${'%' + search + '%'})`
        );
      }
      
      if (dateFilter) {
        // 转换日期字符串为时间戳范围
        const selectedDate = new Date(dateFilter);
        const startOfDay = selectedDate.setHours(0, 0, 0, 0);
        const endOfDay = selectedDate.setHours(23, 59, 59, 999);
        
        conditions.push(
          and(
            sql`${sales.saleDate} >= ${startOfDay}`,
            sql`${sales.saleDate} <= ${endOfDay}`
          )
        );
      }
      
      if (paymentFilter) {
        conditions.push(eq(sales.paymentMethod, paymentFilter));
      }
      
      // 计算销售记录总数
      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const totalSales = countQuery[0].count;
      
      // 查询销售列表和每笔销售的商品数量
      const salesWithItemCount = await db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          userId: sales.userId,
          userName: users.name,
          customerName: sales.customerName,
          customerPhone: sales.customerPhone,
          saleDate: sales.saleDate,
          totalAmount: sales.totalAmount,
          discount: sales.discount,
          finalAmount: sales.finalAmount,
          paymentMethod: sales.paymentMethod,
          notes: sales.notes,
          itemCount: sql<number>`(SELECT COUNT(*) FROM ${saleItems} WHERE ${saleItems.saleId} = ${sales.id})`,
          createdAt: sales.createdAt,
        })
        .from(sales)
        .leftJoin(users, eq(sales.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sales.saleDate))
        .limit(limit)
        .offset(offset);
      
      return NextResponse.json({
        success: true,
        data: {
          sales: salesWithItemCount,
          pagination: {
            total: totalSales,
            page,
            limit,
            totalPages: Math.ceil(totalSales / limit)
          }
        }
      });
    } catch (error) {
      console.error("获取销售列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取销售列表失败" },
        { status: 500 }
      );
    }
  });
}

// 创建销售记录
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const {
        customerName,
        customerPhone,
        items,
        discount = 0,
        notes = "",
        paymentMethod = "cash"
      } = body;
      
      // 验证商品列表
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, message: "销售商品不能为空" },
          { status: 400 }
        );
      }
      
      // 生成唯一的发票号
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const invoiceNumber = `INV${timestamp.toString().slice(-8)}${randomSuffix}`;
      
      // 计算总金额
      let totalAmount = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return NextResponse.json(
            { success: false, message: "商品信息不完整" },
            { status: 400 }
          );
        }
        
        totalAmount += item.quantity * item.unitPrice;
      }
      
      // 应收金额（减去折扣后）      
      const finalAmount = Math.max(0, totalAmount - discount);
      
      // 创建销售记录
      const [newSale] = await db
        .insert(sales)
        .values({
          invoiceNumber,
          userId: user.id,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          saleDate: timestamp,
          totalAmount,
          discount,
          finalAmount,
          paymentMethod,
          notes,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
      
      if (!newSale) {
        return NextResponse.json(
          { success: false, message: "创建销售记录失败" },
          { status: 500 }
        );
      }
      
      // 添加销售明细
      const saleItemsData = items.map(item => ({
        saleId: newSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        createdAt: timestamp
      }));
      
      await db.insert(saleItems).values(saleItemsData);
      
      // 更新库存（减少库存）
      for (const item of items) {
        try {
          // 1. 使用Drizzle ORM的方式更新库存，而不是原始SQL
          await db
            .update(inventory)
            .set({ 
              quantity: sql`${inventory.quantity} - ${item.quantity}`,
              updatedAt: timestamp
            })
            .where(eq(inventory.productId, item.productId));
          
          // 2. 添加库存变动记录
          await db.insert(stockMovements).values({
            productId: item.productId,
            quantity: -item.quantity, // 负数表示库存减少
            type: 'sale',
            referenceId: newSale.id,
            userId: user.id,
            notes: `销售: ${invoiceNumber}`,
            timestamp
          });
        } catch (error) {
          console.error(`更新商品ID ${item.productId} 的库存失败:`, error);
          // 继续处理其他商品，不中断整个流程
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "销售创建成功",
        data: {
          id: newSale.id,
          invoiceNumber: newSale.invoiceNumber
        }
      });
    } catch (error) {
      console.error("创建销售记录失败:", error);
      return NextResponse.json(
        { success: false, message: "创建销售记录失败，请稍后再试" },
        { status: 500 }
      );
    }
  });
}