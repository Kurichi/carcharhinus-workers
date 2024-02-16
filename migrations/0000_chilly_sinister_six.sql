CREATE TABLE `balance_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP
);
