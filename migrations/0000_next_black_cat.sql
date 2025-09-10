CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"published" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"authorId" integer,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"price" integer NOT NULL,
	"inStock" boolean DEFAULT true,
	"tags" jsonb,
	"description" text,
	"releaseDate" timestamp
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"available" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "posts_title_idx" ON "posts" USING btree ("title");--> statement-breakpoint
CREATE INDEX "posts_published_idx" ON "posts" USING btree ("published");--> statement-breakpoint
CREATE INDEX "posts_authorId_idx" ON "posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "products_title_idx" ON "products" USING btree ("title");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "products_inStock_idx" ON "products" USING btree ("inStock");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");