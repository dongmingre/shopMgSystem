import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, purchaseOrderItems, users, suppliers } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { desc, eq, like, and, sql } from "drizzle-orm";

// 获取采购订单列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";
      const dateFilter = searchParams.get("date") || "";
      const statusFilter = searchParams.get("status") || "";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;
      
      // 构建查询条件
      const conditions = [];
      
      if (search) {
        conditions.push(
          sql`(${suppliers.name} LIKE ${'%' + search + '%'} OR ${purchaseOrders.orderNumber} LIKE ${'%' + search + '%'})`
        );
      }
      
      if (dateFilter) {
        // 转换日期字符串为时间戳范围
        const selectedDate = new Date(dateFilter);
        const startOfDay = selectedDate.setHours(0, 0, 0, 0);
        const endOfDay = selectedDate.setHours(23, 59, 59, 999);
        
        conditions.push(
          and(
            sql`${purchaseOrders.orderDate} >= ${startOfDay}`,
            sql`${purchaseOrders.orderDate} <= ${endOfDay}`
          )
        );
      }
      
      if (statusFilter) {
        conditions.push(eq(purchaseOrders.status, statusFilter));
      }
      
      // 计算采购订单总数
      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const totalPurchases = countQuery[0].count;
      
      // 查询采购订单列表和每个订单的商品数量
      const purchasesWithItemCount = await db
        .select({
          id: purchaseOrders.id,
          orderNumber: purchaseOrders.orderNumber,
          supplierId: purchaseOrders.supplierId,
          supplierName: suppliers.name,
          userId: purchaseOrders.userId,
          userName: users.name,
          orderDate: purchaseOrders.orderDate,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          status: purchaseOrders.status,
          totalAmount: purchaseOrders.totalAmount,
          notes: purchaseOrders.notes,
          itemCount: sql<number>`(SELECT COUNT(*) FROM ${purchaseOrderItems} WHERE ${purchaseOrderItems.purchaseOrderId} = ${purchaseOrders.id})`,
          createdAt: purchaseOrders.createdAt
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .leftJoin(users, eq(purchaseOrders.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(purchaseOrders.orderDate))
        .limit(limit)
        .offset(offset);
      
      return NextResponse.json({
        success: true,
        data: {
          purchases: purchasesWithItemCount,
          pagination: {
            total: totalPurchases,
            page,
            limit,
            totalPages: Math.ceil(totalPurchases / limit)
          }
        }
      });
    } catch (error) {
      console.error("获取采购订单列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取采购订单列表失败" },
        { status: 500 }
      );
    }
  });
}

// 创建采购订单
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const {
        supplierId,
        items,
        expectedDeliveryDate = null,
        notes = ""
      } = body;
      
      // 验证必填字段
      if (!supplierId || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, message: "缺少必要信息" },
          { status: 400 }
        );
      }
      
      // 生成唯一的订单号
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const orderNumber = `PO${timestamp.toString().slice(-8)}${randomSuffix}`;
      
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
      
      // 创建采购订单
      const [newOrder] = await db
        .insert(purchaseOrders)
        .values({
          orderNumber,
          supplierId,
          userId: user.id,
          orderDate: timestamp,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).getTime() : null,
          status: 'pending',
          totalAmount,
          notes,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();
      
      if (!newOrder) {
        return NextResponse.json(
          { success: false, message: "创建采购订单失败" },
          { status: 500 }
        );
      }
      
      // 添加采购订单明细
      const orderItemsData = items.map(item => ({
        purchaseOrderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      
      await db.insert(purchaseOrderItems).values(orderItemsData);
      
      return NextResponse.json({
        success: true,
        message: "采购订单创建成功",
        data: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber
        }
      });
    } catch (error) {
      console.error("创建采购订单失败:", error);
      return NextResponse.json(
        { success: false, message: "创建采购订单失败，请稍后再试" },
        { status: 500 }
      );
    }
  });
}