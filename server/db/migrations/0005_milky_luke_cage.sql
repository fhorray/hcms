DROP TABLE `posts`;--> statement-breakpoint
DROP TABLE `posts_tags`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "label") SELECT "id", "label" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "name") SELECT "id", "email", "name" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uniq` ON `users` (`email`);