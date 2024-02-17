import { v4 as uuidV4 } from "uuid";
export type BalanceTransactionType = "deposit" | "withdraw";

export type BalanceTransaction = {
	id: string;
	userId: string;
	type: BalanceTransactionType;
	amount: number;
	timestamp?: Date;
};

export const NewBalanceTransaction = (
	userId: string,
	type: BalanceTransactionType,
	amount: number,
): BalanceTransaction => {
	return {
		id: uuidV4(),
		userId,
		type,
		amount,
	};
};
