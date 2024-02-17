import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { balanceTransactions } from "../db/schema";
import { BalanceTransaction, NewBalanceTransaction } from "./domain";

type Config = {
	Bindings: { DB: D1Database };
};

// ================
// === 残高の追加 ===
// ================

export type MakeDepositInput = {
	userId: string;
	amount: number;
};
export type MakeDepositOutput = {
	transaction: BalanceTransaction;
	balance: number;
};

export const MakeDeposit = async (
	c: Context,
	input: MakeDepositInput,
): Promise<BalanceTransaction> => {
	const transaction = NewBalanceTransaction(
		input.userId,
		"deposit",
		input.amount,
	);

	const db = drizzle(c.env.DB);
	await db.transaction(async (tx) => {
		// TODO: 残高の更新
		await tx.insert(balanceTransactions).values(transaction).execute();
	});
	return transaction;
};

// =================
// === 残高の取得 ===
// =================

export type CreatePaymentIntentInput = {
	userId: string;
	amount: number;
};

export type CreatePaymentIntentOutput = {
	clientSecret: string;
	publishableKey: string;
};

export const CreatePaymentIntent = async (
	c: Context,
	input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentOutput> => {
	let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

	try {
		const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
		paymentIntent = await stripe.paymentIntents.create({
			amount: input.amount,
			currency: "jpy",
		});
	} catch (error) {
		throw new HTTPException(500, { message: "create payment intents failed" });
	}

	if (!paymentIntent.client_secret) {
		throw new HTTPException(500, { message: "no client secret" });
	}

	return {
		clientSecret: paymentIntent.client_secret,
		publishableKey: c.env.STRIPE_PUBLISHABLE_KEY,
	};
};
