CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`stage` integer NOT NULL,
	`place` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`note_id` text,
	`deliver_at` integer NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`stage` integer NOT NULL,
	`place` text NOT NULL,
	`source_id` text,
	`started_at` integer NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visit_stage` ON `visits` (`participant_id`,`stage`);--> statement-breakpoint
ALTER TABLE `participants` ADD `route_json` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `phase` text DEFAULT 'waiting' NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `current_place` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `due_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `reply_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `last_seen` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `last_activity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `participants` ADD `observed_signal` text DEFAULT '' NOT NULL;