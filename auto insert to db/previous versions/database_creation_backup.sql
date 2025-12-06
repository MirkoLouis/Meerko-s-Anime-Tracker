-- ------------------------------------------------------
-- Create Database
-- ------------------------------------------------------
drop database if exists `anime_tracker`;

CREATE DATABASE `anime_tracker`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `anime_tracker`;

-- ------------------------------------------------------
-- Table: studio
-- ------------------------------------------------------
DROP TABLE IF EXISTS `studio`;
CREATE TABLE `studio` (
  `StudioID` int NOT NULL AUTO_INCREMENT,
  `studio_name` varchar(255) NOT NULL,
  `rating` enum('1','2','3','4','5') DEFAULT NULL,
  PRIMARY KEY (`StudioID`),
  UNIQUE KEY `studio_name` (`studio_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table: anime
-- ------------------------------------------------------
DROP TABLE IF EXISTS `anime`;
CREATE TABLE `anime` (
  `AnimeID` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `type` enum('TV','Movie','ONA','OVA','Special') NOT NULL,
  `episodes` int DEFAULT '12',
  `status` enum('Airing','Completed','Upcoming') NOT NULL,
  `airing_start` date DEFAULT NULL,
  `airing_end` date DEFAULT NULL,
  `rating` enum('1','2','3','4','5','6','7','8','9','10') DEFAULT NULL,
  `synopsis` text,
  `StudioID` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`AnimeID`),
  UNIQUE KEY `title` (`title`),
  KEY `StudioID` (`StudioID`),
  CONSTRAINT `anime_ibfk_1`
        FOREIGN KEY (`StudioID`) REFERENCES `studio` (`StudioID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table: tags
-- ------------------------------------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `TagID` int NOT NULL AUTO_INCREMENT,
  `tag` varchar(50) NOT NULL,
  PRIMARY KEY (`TagID`),
  UNIQUE KEY `tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table: user
-- ------------------------------------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `userpassword` varchar(255) NOT NULL,
  `display_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `first_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `display_name` (`display_name`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table: watchlist
-- ------------------------------------------------------
DROP TABLE IF EXISTS `watchlist`;
CREATE TABLE `watchlist` (
  `WatchlistID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `AnimeID` int NOT NULL,
  `status` enum('Completed','Watching','Plan to Watch') DEFAULT NULL,
  `date_added` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`WatchlistID`),
  KEY `UserID` (`UserID`),
  KEY `AnimeID` (`AnimeID`),
  CONSTRAINT `watchlist_ibfk_1`
        FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`),
  CONSTRAINT `watchlist_ibfk_2`
        FOREIGN KEY (`AnimeID`) REFERENCES `anime` (`AnimeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table: anime_tags
-- ------------------------------------------------------
DROP TABLE IF EXISTS `anime_tags`;
CREATE TABLE `anime_tags` (
  `AnimeID` int NOT NULL,
  `TagID` int NOT NULL,
  PRIMARY KEY (`AnimeID`, `TagID`),
  KEY `TagID` (`TagID`),
  CONSTRAINT `anime_tags_ibfk_1`
        FOREIGN KEY (`AnimeID`) REFERENCES `anime` (`AnimeID`) ON DELETE CASCADE,
  CONSTRAINT `anime_tags_ibfk_2`
        FOREIGN KEY (`TagID`) REFERENCES `tags` (`TagID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
