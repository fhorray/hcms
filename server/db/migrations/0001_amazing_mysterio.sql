PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`price` real NOT NULL,
	`inStock` integer DEFAULT true,
	`tags` text,
	`description` text,
	`releaseDate` integer
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "title", "price", "inStock", "tags", "description", "releaseDate") SELECT "id", "title", "price", "inStock", "tags", "description", "releaseDate" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `products_title_idx` ON `products` (`title`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `products_inStock_idx` ON `products` (`inStock`);