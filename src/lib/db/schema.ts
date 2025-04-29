import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 数据库Schema定义 - 更新于2025-04-29

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'manager', 'staff'] }).notNull().default('staff'),
  email: text('email'),
  phone: text('phone'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 商品类别表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 商品表
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  barcode: text('barcode').unique(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  purchasePrice: real('purchase_price').notNull(), // 进价
  sellingPrice: real('selling_price').notNull(), // 售价
  unit: text('unit').notNull(), // 单位（如：个、kg、箱）
  minStock: integer('min_stock').notNull().default(10), // 最低库存预警
  image: text('image'), // 商品图片URL
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 库存表
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull().default(0),
  lastRestocked: integer('last_restocked'),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 供应商表
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 采购订单表
export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(), // 订单创建人
  orderDate: integer('order_date').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  expectedDeliveryDate: integer('expected_delivery_date'),
  status: text('status', { enum: ['pending', 'delivered', 'cancelled'] }).notNull().default('pending'),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 采购订单详情表
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 销售记录表
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(), // 销售人员
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  saleDate: integer('sale_date').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  totalAmount: real('total_amount').notNull().default(0),
  discount: real('discount').default(0),
  finalAmount: real('final_amount').notNull().default(0),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'mobile'] }).notNull().default('cash'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 销售详情表
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').references(() => sales.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 库存变动记录表
export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(), // 正数表示入库，负数表示出库
  type: text('type', { enum: ['purchase', 'sale', 'adjustment', 'return'] }).notNull(),
  referenceId: integer('reference_id'), // 可能关联到采购单或销售单
  notes: text('notes'),
  userId: integer('user_id').references(() => users.id).notNull(), // 操作人员
  timestamp: integer('timestamp').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});

// 系统设置表
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  settingsData: text('settings_data').notNull(), // JSON格式存储的设置数据
  updatedBy: integer('updated_by').references(() => users.id).notNull(),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`)
});