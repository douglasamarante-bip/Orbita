CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`share_key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`color` text DEFAULT '#c2f970' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_brands_owner` ON `brands` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_brands_email` ON `brands` (`email`);--> statement-breakpoint
CREATE TABLE `connections` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`provider` text NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`refresh_token` text,
	`expires` integer,
	`updated` text NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_connections_brand_provider` ON `connections` (`brand_id`,`provider`);--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`provider` text NOT NULL,
	`day` text NOT NULL,
	`followers` integer,
	`reach` integer,
	`views` integer,
	`interactions` integer,
	`post_metrics` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_metrics_day` ON `metrics` (`brand_id`,`provider`,`day`);--> statement-breakpoint
CREATE TABLE `oauth` (
	`state` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`brand_id` text NOT NULL,
	`provider` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`title` text NOT NULL,
	`caption` text NOT NULL,
	`platform` text NOT NULL,
	`format` text NOT NULL,
	`media` text DEFAULT '[]' NOT NULL,
	`scheduled_at` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`feedback` text DEFAULT '' NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`remote_id` text,
	`container_id` text,
	`error` text,
	`created` text NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_posts_brand` ON `posts` (`brand_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_due` ON `posts` (`status`,`scheduled_at`);