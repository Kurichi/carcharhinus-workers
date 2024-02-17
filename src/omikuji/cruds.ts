import { desc, eq } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { omikuji, omikujiDraw } from "./../db/schema";
import { FunctionResult } from "./model";

export const getOmikujis = async (
	db: DrizzleD1Database,
): Promise<
	FunctionResult<
		| {
				id: string;
				grade: string;
				probability: number;
				created_at: Date | null;
				updated_at: Date | null;
		  }[]
		| null
	>
> => {
	try {
		const omikujis = await db.select().from(omikuji).orderBy(omikuji.id).all();
		return { data: omikujis, error: null, status: 200 };
	} catch (e) {
		if (e instanceof Error) {
			return { data: null, error: e.message, status: 500 };
		}
		return { data: null, error: "internal server error", status: 500 };
	}
};

export const insertOmikujiDraw = async (
	db: DrizzleD1Database,
	userId: string,
	omikujiId: string,
): Promise<FunctionResult<string | null>> => {
	try {
		await db
			.insert(omikujiDraw)
			.values({ user_id: userId, omikuji_id: omikujiId })
			.execute();
		return { data: "success", error: null, status: 201 };
	} catch (e) {
		if (e instanceof Error) {
			return { data: null, error: e.message, status: 500 };
		}
		return { data: null, error: "internal server error", status: 500 };
	}
};

export const getLatestDraw = async (
	db: DrizzleD1Database,
	userId: string,
): Promise<FunctionResult<{ drawAt: Date | null; omikuji_id: string }>> => {
	try {
		const draw = await db
			.select()
			.from(omikujiDraw)
			.where(eq(omikujiDraw.user_id, userId))
			.orderBy(desc(omikujiDraw.created_at))
			.get();
		if (!draw) {
			return { data: null, error: null, status: 200 };
		}
		return {
			data: { drawAt: draw.created_at, omikuji_id: draw.omikuji_id },
			error: null,
			status: 200,
		};
	} catch (e) {
		if (e instanceof Error) {
			return { data: null, error: e.message, status: 500 };
		}
		return { data: null, error: "internal server error", status: 500 };
	}
};
