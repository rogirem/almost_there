CREATE INDEX `messages_participant_delivery` ON `messages` (`participant_id`,`deliver_at`);--> statement-breakpoint
CREATE INDEX `notes_room_place` ON `notes` (`room_id`,`place`);