import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 残高履歴テーブル
export const balanceTransactions = sqliteTable("balance_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	type: text("type", { enum: ["deposit", "withdraw"] }).notNull(),
	amount: integer("amount").notNull(),
	timestamp: integer("timestamp", { mode: "timestamp_ms" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});
