import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories, inventory } from "@/lib/db/schema";
import { withAuth, withRole } from "@/lib/auth";
import { eq, like, desc, asc, and, inArray } from "drizzle-orm";

// 获取商品列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      // 查询参数
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("categoryId") || null;
      const status = searchParams.get("status") || null;
      const sortBy = searchParams.get("sortBy") || "id";
      const sortOrder = searchParams.get("sortOrder") || "desc";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;

      // 构建查询条件
      let query = db
        .select({
          id: products.id,
          name: products.name,
          barcode: products.barcode,
          description: products.description,
          categoryId: products.categoryId,
          categoryName: categories.name,
          purchasePrice: products.purchasePrice,
          sellingPrice: products.sellingPrice,
          unit: products.unit,
          minStock: products.minStock,
          image: products.image,
          status: products.status,
          quantity: inventory.quantity,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(inventory, eq(products.id, inventory.productId));

      // 添加过滤条件
      if (search) {
        query = query.where(
          like(products.name, `%${search}%`)
        );
      }

      if (categoryId) {
        query = query.where(eq(products.categoryId, parseInt(categoryId)));
      }

      if (status) {
        query = query.where(eq(products.status, status));
      }

      // 计算总记录数
      const countQuery = await db
        .select({ count: products.id })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            search ? like(products.name, `%${search}%`) : undefined,
            categoryId ? eq(products.categoryId, parseInt(categoryId)) : undefined,
            status ? eq(products.status, status) : undefined
          )
        )
        .then(result => result.length);

      // 排序
      if (sortBy === "name") {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(products.name))
          : query.orderBy(desc(products.name));
      } else if (sortBy === "price") {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(products.sellingPrice))
          : query.orderBy(desc(products.sellingPrice));
      } else if (sortBy === "category") {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(categories.name))
          : query.orderBy(desc(categories.name));
      } else {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(products.id))
          : query.orderBy(desc(products.id));
      }

      // 分页
      query = query.limit(limit).offset(offset);

      // 执行查询
      const productsList = await query;

      // 获取所有商品类别
      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));

      return NextResponse.json({
        success: true,
        data: {
          products: productsList,
          categories: allCategories,
          pagination: {
            total: countQuery,
            page,
            limit,
            pages: Math.ceil(countQuery / limit)
          }
        }
      });
    } catch (error) {
      console.error("获取商品列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取商品列表失败" },
        { status: 500 }
      );
    }
  });
}

// 创建新商品
export async function POST(request: NextRequest) {
  return withRole(request, async (req, user) => {
    try {
      const body = await request.json();
      console.log("接收到的商品数据:", body);

      const {
        name,
        barcode,
        description,
        categoryId,
        price, // 前端使用price统一作为售价
        image,
        status,
        minStock,
        initialStock
      } = body;

      // 验证必填字段
      if (!name) {
        return NextResponse.json(
          { success: false, message: "商品名称为必填项" },
          { status: 400 }
        );
      }

      if (!price && price !== 0) {
        return NextResponse.json(
          { success: false, message: "商品价格为必填项" },
          { status: 400 }
        );
      }

      if (!categoryId) {
        return NextResponse.json(
          { success: false, message: "商品分类为必填项" },
          { status: 400 }
        );
      }

      // 验证条形码唯一性
      if (barcode) {
        const existingProduct = await db
          .select()
          .from(products)
          .where(eq(products.barcode, barcode))
          .limit(1);
          
        if (existingProduct.length > 0) {
          return NextResponse.json(
            { success: false, message: "条形码已存在" },
            { status: 400 }
          );
        }
      }

      // 插入商品记录
      const nowTimestamp = Date.now();
      const [newProduct] = await db
        .insert(products)
        .values({
          name,
          barcode: barcode || null,
          description: description || null,
          categoryId: parseInt(categoryId.toString()),
          purchasePrice: price, // 如果没有提供进货价，默认使用售价
          sellingPrice: price,
          unit: "个", // 默认单位
          minStock: minStock || 10,
          image: image || null,
          status: status || "active",
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp
        })
        .returning();

      // 创建库存记录
      if (newProduct) {
        await db
          .insert(inventory)
          .values({
            productId: newProduct.id,
            quantity: initialStock || 0,
            updatedAt: nowTimestamp
          });
      }

      return NextResponse.json({
        success: true,
        message: "商品创建成功",
        data: newProduct
      });
    } catch (error) {
      console.error("创建商品失败:", error);
      return NextResponse.json(
        { success: false, message: "创建商品失败，请稍后再试" },
        { status: 500 }
      );
    }
  }, ["admin", "manager"]);
}

// 批量更新商品
export async function PUT(request: NextRequest) {
  return withRole(request, async (req, user) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, message: "缺少商品ID" },
          { status: 400 }
        );
      }

      // 准备更新数据
      const nowTimestamp = Date.now();
      const updateValues = {
        ...updateData,
        updatedAt: nowTimestamp
      };

      // 更新商品信息
      const [updatedProduct] = await db
        .update(products)
        .set(updateValues)
        .where(eq(products.id, id))
        .returning();

      // 如果提供了库存数量，更新库存
      if (body.stock !== undefined) {
        // 先检查该商品是否已有库存记录
        const existingInventory = await db
          .select()
          .from(inventory)
          .where(eq(inventory.productId, id));

        if (existingInventory.length > 0) {
          // 更新现有库存
          await db
            .update(inventory)
            .set({
              quantity: body.stock,
              updatedAt: nowTimestamp
            })
            .where(eq(inventory.productId, id));
        } else {
          // 创建新库存记录
          await db
            .insert(inventory)
            .values({
              productId: id,
              quantity: body.stock,
              updatedAt: nowTimestamp
            });
        }
      }

      return NextResponse.json({
        success: true,
        message: "商品更新成功",
        data: updatedProduct
      });
    } catch (error) {
      console.error("更新商品失败:", error);
      return NextResponse.json(
        { success: false, message: "更新商品失败，请稍后再试" },
        { status: 500 }
      );
    }
  }, ["admin", "manager"]);
}

// 删除商品
export async function DELETE(request: NextRequest) {
  return withRole(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      const ids = searchParams.get("ids");

      if (!id && !ids) {
        return NextResponse.json(
          { success: false, message: "缺少商品ID" },
          { status: 400 }
        );
      }

      // 单个删除
      if (id) {
        await db.delete(inventory).where(eq(inventory.productId, parseInt(id)));
        await db.delete(products).where(eq(products.id, parseInt(id)));

        return NextResponse.json({
          success: true,
          message: "商品删除成功"
        });
      }

      // 批量删除
      if (ids) {
        const idArray = ids.split(",").map(id => parseInt(id.trim()));
        
        await db.delete(inventory).where(inArray(inventory.productId, idArray));
        await db.delete(products).where(inArray(products.id, idArray));

        return NextResponse.json({
          success: true,
          message: `${idArray.length}个商品删除成功`
        });
      }

      return NextResponse.json(
        { success: false, message: "请求无效" },
        { status: 400 }
      );
    } catch (error) {
      console.error("删除商品失败:", error);
      return NextResponse.json(
        { success: false, message: "删除商品失败，请稍后再试" },
        { status: 500 }
      );
    }
  }, ["admin"]);
}