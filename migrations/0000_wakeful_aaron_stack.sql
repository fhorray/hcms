CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer DEFAULT '2025-09-12T15:28:13.834Z' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `logs_level_idx` ON `logs` (`level`);--> statement-breakpoint
CREATE INDEX `logs_timestamp_idx` ON `logs` (`timestamp`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`title` text NOT NULL,
	`body` text,
	`published` integer DEFAULT false,
	`tags` text DEFAULT '[]'
);
--> statement-breakpoint
CREATE INDEX `posts_title_idx` ON `posts` (`title`);--> statement-breakpoint
CREATE INDEX `posts_published_idx` ON `posts` (`published`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`title` text NOT NULL,
	`price` integer NOT NULL,
	`in_stock` integer DEFAULT true,
	`tags` text DEFAULT '{}',
	`description` text,
	`release_date` integer
);
--> statement-breakpoint
CREATE INDEX `products_title_idx` ON `products` (`title`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `products_in_stock_idx` ON `products` (`in_stock`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`title` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`available` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);