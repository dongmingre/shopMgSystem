import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';

// 初始化SQLite数据库连接
const sqlite = new Database(join(process.cwd(), 'realshop.db'));
export const db = drizzle(sqlite, { schema });

// 导出schema，这样可以在其他地方使用
export { schema };