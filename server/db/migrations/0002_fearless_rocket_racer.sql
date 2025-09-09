ALTER TABLE `products` ADD `userId` text NOT NULL REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `products_userId_idx` ON `products` (`userId`);