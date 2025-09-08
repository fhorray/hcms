CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`price` real NOT NULL,
	`inStock` integer DEFAULT true,
	`tags` text,
	`releaseDate` text,
	`categoryId` integer NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_categoryId_idx` ON `products` (`categoryId`);--> statement-breakpoint
CREATE INDEX `products_title_idx` ON `products` (`title`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `products_inStock_idx` ON `products` (`inStock`);