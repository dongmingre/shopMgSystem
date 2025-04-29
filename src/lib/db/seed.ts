import { db, schema } from ".";
import { v4 as uuidv4 } from 'uuid';
import { hash } from 'bcrypt';

// 加密密码的函数
async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// 初始化数据库
async function seed() {
  console.log("🌱 开始初始化数据库...");
  
  try {
    // 创建初始管理员用户
    const adminPassword = await hashPassword("admin123");
    const nowTimestamp = Date.now();
    
    await db.insert(schema.users).values({
      username: "admin",
      password: adminPassword,
      name: "超级管理员",
      role: "admin",
      email: "admin@example.com",
      phone: "13800000000",
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    });
    console.log("✅ 创建管理员用户成功");
    
    // 创建商品类别
    const categories = [
      { name: "饮料", description: "各类饮用水、果汁、碳酸饮料等", createdAt: nowTimestamp, updatedAt: nowTimestamp },
      { name: "零食", description: "糖果、巧克力、饼干、膨化食品等", createdAt: nowTimestamp, updatedAt: nowTimestamp },
      { name: "果蔬", description: "新鲜水果和蔬菜", createdAt: nowTimestamp, updatedAt: nowTimestamp },
      { name: "日用品", description: "生活必需的日常用品", createdAt: nowTimestamp, updatedAt: nowTimestamp },
      { name: "乳制品", description: "牛奶、酸奶、奶酪等乳制品", createdAt: nowTimestamp, updatedAt: nowTimestamp },
    ];
    
    for (const category of categories) {
      await db.insert(schema.categories).values(category);
    }
    console.log("✅ 创建商品类别成功");
    
    // 查询创建的类别
    const createdCategories = await db.select().from(schema.categories);
    
    // 创建商品示例
    const products = [
      {
        name: "矿泉水 550ml",
        barcode: "6901234567890",
        description: "纯净水，无污染",
        categoryId: createdCategories.find(c => c.name === "饮料")?.id,
        purchasePrice: 1.0,
        sellingPrice: 2.0,
        unit: "瓶",
        minStock: 20,
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      },
      {
        name: "进口零食大礼包",
        barcode: "6901234567891",
        description: "各类进口零食组合",
        categoryId: createdCategories.find(c => c.name === "零食")?.id,
        purchasePrice: 25.0,
        sellingPrice: 39.9,
        unit: "包",
        minStock: 10,
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      },
      {
        name: "有机蔬菜礼盒",
        barcode: "6901234567892",
        description: "新鲜有机蔬菜组合",
        categoryId: createdCategories.find(c => c.name === "果蔬")?.id,
        purchasePrice: 20.0,
        sellingPrice: 30.0,
        unit: "盒",
        minStock: 10,
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      },
      {
        name: "每日鲜奶",
        barcode: "6901234567893",
        description: "当日新鲜挤出的牛奶",
        categoryId: createdCategories.find(c => c.name === "乳制品")?.id,
        purchasePrice: 6.0,
        sellingPrice: 9.9,
        unit: "升",
        minStock: 15,
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      },
      {
        name: "健康五谷粗粮",
        barcode: "6901234567894",
        description: "五谷杂粮组合",
        categoryId: createdCategories.find(c => c.name === "零食")?.id,
        purchasePrice: 20.0,
        sellingPrice: 29.9,
        unit: "包",
        minStock: 10,
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      },
    ];
    
    for (const product of products) {
      await db.insert(schema.products).values(product);
    }
    console.log("✅ 创建商品数据成功");
    
    // 查询创建的产品
    const createdProducts = await db.select().from(schema.products);
    
    // 更新库存表
    for (const product of createdProducts) {
      await db.insert(schema.inventory).values({
        productId: product.id,
        quantity: Math.floor(Math.random() * 50) + 5, // 随机库存量
        lastRestocked: nowTimestamp,
        updatedAt: nowTimestamp
      });
    }
    console.log("✅ 初始化库存数据成功");
    
    // 创建供应商
    const suppliers = [
      {
        name: "全国食品供应链",
        contactPerson: "李经理",
        phone: "13911112222",
        email: "li@supplier.com",
        address: "北京市朝阳区xx路xx号",
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp
      },
      {
        name: "优质果蔬配送",
        contactPerson: "王采购",
        phone: "13922223333",
        email: "wang@fruits.com",
        address: "上海市浦东新区xx路xx号",
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp
      },
      {
        name: "日用品批发市场",
        contactPerson: "张总",
        phone: "13933334444",
        email: "zhang@daily.com",
        address: "广州市天河区xx路xx号",
        status: "active",
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp
      },
    ];
    
    for (const supplier of suppliers) {
      await db.insert(schema.suppliers).values(supplier);
    }
    console.log("✅ 创建供应商数据成功");
    
    console.log("✅ 数据库初始化完成！");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
  }
}

// 如果直接运行此脚本，则执行seed函数
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("初始化数据库时出错:", error);
      process.exit(1);
    });
}

export default seed;