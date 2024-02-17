import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { v4 as uuidv4 } from "uuid";
import { users } from "../db/schema";
import { FunctionResult } from "./model";

type CreateUserArg = {
	user: {
		email: string;
		name: string;
		password_hash: string;
	};
	db: DrizzleD1Database;
};
export const createUser = async ({
	user,
	db,
}: CreateUserArg): Promise<FunctionResult<string | null>> => {
	try {
		const newUser = {
			id: uuidv4(),
			...user,
		};
		await db.insert(users).values(newUser).execute();
		return { data: newUser.id, error: null, status: 201 };
	} catch (e) {
		if (e instanceof Error) {
			return { data: null, error: e.message, status: 400 };
		}
		return { data: null, error: "internal server error", status: 500 };
	}
};

type LoginUserArg = {
	user: {
		email: string;
		password: string;
	};
	db: DrizzleD1Database;
};

export const getUser = async ({
	db,
	user,
}: LoginUserArg): Promise<
	FunctionResult<{
		name: string;
		email: string;
		id: string;
		password_hash: string;
	}>
> => {
	try {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.email, user.email))
			.get();
		if (result === undefined) {
			return { data: null, error: "User not found", status: 404 };
		}
		return { data: result, error: null, status: 200 };
	} catch (e) {
		if (e instanceof Error) {
			return { data: null, error: e.message, status: 400 };
		}
		return { data: null, error: "internal server error", status: 500 };
	}
};
