CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`available` integer DEFAULT true
);
--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `user`;