import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { balanceTransactions, userCustomer } from "../db/schema";
import { BalanceTransaction, NewBalanceTransaction } from "./domain";

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
		await tx.insert(balanceTransactions).values(transaction).execute();
	});
	return transaction;
};

// =================
// === 残高の取得 ===
// =================

export type CreatePaymentIntentInput = {
	userId: string;
	email: string;
	amount: number;
};

export type CreatePaymentIntentOutput = {
	clientSecret: string;
	automaticPayment: boolean;
};

export const CreatePaymentIntent = async (
	c: Context,
	input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentOutput> => {
	const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
	const db = drizzle(c.env.DB);

	// Customerの取得
	const uc = await db
		.select()
		.from(userCustomer)
		.where(eq(userCustomer.userId, input.userId))
		.get();

	let customerId = uc?.customerId;

	// Customerが存在しない場合，新規作成
	if (!uc) {
		const customer = await stripe.customers.create({
			email: input.email,
		});
		await db
			.insert(userCustomer)
			.values({
				userId: input.userId,
				customerId: customer.id,
			})
			.execute();
		customerId = customer.id;
	}

	const paymentMethods = await stripe.paymentMethods.list({
		customer: customerId,
		type: "card",
	});

	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: input.amount,
			currency: "jpy",
			setup_future_usage: "off_session",
			payment_method: paymentMethods.data[0].id,
			customer: customerId,
			metadata: {
				userId: input.userId,
			},
			off_session: true,
			confirm: true,
		});
		return {
			clientSecret: paymentIntent.client_secret ?? "",
			automaticPayment: true,
		};
	} catch (e) {
		if (e instanceof Stripe.errors.StripeError) {
			const paymentIntents = await stripe.paymentIntents.retrieve(
				//@ts-ignore
				e.raw.payment_intent.id,
			);
			return {
				clientSecret: paymentIntents.client_secret ?? "",
				automaticPayment: false,
			};
		}
		throw new HTTPException(500, { message: "create payment intents failed" });
	}
};
