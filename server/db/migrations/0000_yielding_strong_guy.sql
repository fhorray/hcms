CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`published` integer DEFAULT 0,
	`authorId` integer NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_authorId_idx` ON `posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `posts_title_idx` ON `posts` (`title`);--> statement-breakpoint
CREATE TABLE `posts_tags` (
	`posts_id` integer NOT NULL,
	`tags_id` integer NOT NULL,
	PRIMARY KEY(`posts_id`, `tags_id`),
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tags_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uniq` ON `users` (`email`);