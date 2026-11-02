CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`stage` integer NOT NULL,
	`place` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`photo_key` text,
	`reply_to` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_note_per_stage` ON `notes` (`participant_id`,`stage`,`kind`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`arrived` integer DEFAULT 0 NOT NULL,
	`finished` integer DEFAULT 0 NOT NULL,
	`consent` text DEFAULT 'pending' NOT NULL,
	`left_session` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_token_hash_unique` ON `participants` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `room_role` ON `participants` (`room_id`,`role`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_code_unique` ON `rooms` (`code`);