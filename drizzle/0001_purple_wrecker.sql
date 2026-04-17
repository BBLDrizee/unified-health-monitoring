CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` varchar(32) NOT NULL,
	`eventId` int,
	`severity` varchar(32) NOT NULL,
	`message` text NOT NULL,
	`notificationSent` int NOT NULL DEFAULT 0,
	`acknowledged` int NOT NULL DEFAULT 0,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`heartDiseaseConfidenceThreshold` int NOT NULL DEFAULT 70,
	`fallDetectionRiskLevel` varchar(32) NOT NULL DEFAULT 'high',
	`enableHeartDiseaseAlerts` int NOT NULL DEFAULT 1,
	`enableFallDetectionAlerts` int NOT NULL DEFAULT 1,
	`enableEmailNotifications` int NOT NULL DEFAULT 1,
	`enableInAppNotifications` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_thresholds_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_thresholds_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fall_detection_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`impactArea` varchar(64) NOT NULL,
	`riskLevel` varchar(32) NOT NULL,
	`injuryDetail` text,
	`confidenceScore` int,
	`poseData` text,
	`rawPayload` text,
	`alertTriggered` int DEFAULT 0,
	`alertSentAt` timestamp,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fall_detection_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `heart_disease_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(32) NOT NULL,
	`confidenceScore` int NOT NULL,
	`age` int,
	`sex` varchar(10),
	`cholesterol` int,
	`bloodPressureSystolic` int,
	`bloodPressureDiastolic` int,
	`heartRate` int,
	`glucose` int,
	`smoker` int,
	`exerciseFrequency` int,
	`rawPayload` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `heart_disease_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtt_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brokerUrl` varchar(256) NOT NULL,
	`brokerPort` int NOT NULL,
	`isConnected` int NOT NULL DEFAULT 0,
	`lastConnectedAt` timestamp,
	`lastDisconnectedAt` timestamp,
	`lastHeartbeatAt` timestamp,
	`subscriptionStatus` varchar(256),
	`connectionError` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mqtt_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `mqtt_state_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_thresholds` ADD CONSTRAINT `alert_thresholds_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fall_detection_events` ADD CONSTRAINT `fall_detection_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `heart_disease_events` ADD CONSTRAINT `heart_disease_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mqtt_state` ADD CONSTRAINT `mqtt_state_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;