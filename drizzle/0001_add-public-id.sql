ALTER TABLE `user` ADD `public_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `user` SET `public_id` = 'ct' || lower(hex(randomblob(6))) WHERE `public_id` = '';--> statement-breakpoint
CREATE UNIQUE INDEX `user_public_id_unique` ON `user` (`public_id`);
