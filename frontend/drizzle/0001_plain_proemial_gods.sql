CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acquirerTicker` varchar(10) NOT NULL,
	`targetTicker` varchar(10) NOT NULL,
	`dealValue` int NOT NULL,
	`premium` int NOT NULL,
	`paymentType` enum('cash','stock','mixed') NOT NULL,
	`crossBorder` int NOT NULL DEFAULT 0,
	`sameIndustry` int NOT NULL DEFAULT 0,
	`dealQualityScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historicalDeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealName` varchar(255) NOT NULL,
	`acquirer` varchar(100) NOT NULL,
	`target` varchar(100) NOT NULL,
	`sector` varchar(100) NOT NULL,
	`dealValue` int NOT NULL,
	`premium` int NOT NULL,
	`paymentType` enum('cash','stock','mixed') NOT NULL,
	`crossBorder` int NOT NULL DEFAULT 0,
	`sameIndustry` int NOT NULL DEFAULT 0,
	`outcome` enum('success','failed','pending') NOT NULL,
	`announcementDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historicalDeals_id` PRIMARY KEY(`id`)
);
