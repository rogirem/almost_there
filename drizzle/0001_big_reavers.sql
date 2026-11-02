DROP INDEX `one_note_per_stage`;--> statement-breakpoint
CREATE UNIQUE INDEX `one_note_per_stage` ON `notes` (`participant_id`,`stage`,`kind`) WHERE kind <> 'reply';--> statement-breakpoint
ALTER TABLE `rooms` ADD `story_version` integer DEFAULT 1 NOT NULL;