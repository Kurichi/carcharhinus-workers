import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import Stripe from "stripe";
import { z } from "zod";
import { CreatePaymentIntent } from "./usecase";

type Bindings = {
	STRIPE_SECRET_KEY: string;
	STRIPE_PUBLISHABLE_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
};

type Variables = {
	userId: string;
};

const balance = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const chargeSchema = zValidator(
	"json",
	z.object({
		amount: z.number().min(100).max(100000),
	}),
);

balance.post("/create-payment-intent", chargeSchema, async (c) => {
	const { amount } = c.req.valid("json");

	const payment = await CreatePaymentIntent(c, {
		// userId: c.var.userId,
		userId: "test-user-id",
		amount,
	});

	return c.json(payment);
});

balance.get("/webhook", async (c) => {
	const sig = c.req.header("stripe-signature");
	if (!sig) {
		return c.json({ error: "No signature" }, 400);
	}

	const body = await c.req.text();
	let event: Stripe.Event;

	// verify
	try {
		const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
		event = stripe.webhooks.constructEvent(
			body,
			sig,
			c.env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		return c.json({ error: "Webhook signature verification failed" }, 400);
	}

	// handle
	switch (event.type) {
		case "payment_intent.succeeded": {
			// const amount = event.data.object.amount;
			console.log("PaymentIntent was successful!");
			console.log(event.data.object.customer);
			break;
		}
		default:
			console.log(`Unhandled event type ${event.type}`);
	}
});

export { balance };
