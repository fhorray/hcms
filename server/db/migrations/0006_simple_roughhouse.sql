CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`published` integer DEFAULT false,
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
