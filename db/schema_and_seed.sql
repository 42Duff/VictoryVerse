DROP TABLE IF EXISTS Support_Tickets;
DROP TABLE IF EXISTS Game_Streams;
DROP TABLE IF EXISTS Game_Reviews;
DROP TABLE IF EXISTS Mods;
DROP TABLE IF EXISTS Clan_Memberships;
DROP TABLE IF EXISTS Clans;
DROP TABLE IF EXISTS Trades;
DROP TABLE IF EXISTS InGame_Purchases;
DROP TABLE IF EXISTS Leaderboards;
DROP TABLE IF EXISTS Player_Progress ;
DROP TABLE IF EXISTS Achievements;
DROP TABLE IF EXISTS Games;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Gaming_Platforms;


CREATE TABLE Gaming_Platforms (
    platform_id   SERIAL PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL UNIQUE,
    manufacturer  VARCHAR(50),
    release_date  DATE
);

-- Create table for Users (Players, Developers, Admins)
CREATE TABLE Users (
    user_id          SERIAL PRIMARY KEY,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    email            VARCHAR(100) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    role            ENUM('Player','Developer','Admin') NOT NULL DEFAULT 'Player',
    date_joined      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_login       TIMESTAMP,
    profile_picture  VARCHAR(255) DEFAULT 'defaultPFP.png',
    banner_image VARCHAR(255) DEFAULT 'defaultBanner.jpg',
    platform_id      INT REFERENCES Gaming_Platforms(platform_id) ON DELETE SET NULL
);


CREATE TABLE Games (
    game_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    genre VARCHAR(50),
    developer_id INT REFERENCES Users(user_id) ON DELETE SET NULL,
    release_date DATE,
    description TEXT,
    platform VARCHAR(100),
    price DECIMAL(10,2),
    dlc_available BOOLEAN DEFAULT FALSE,
    image VARCHAR(255),    -- <-- New column for cover image filename
    background_image VARCHAR(255),
    video_url VARCHAR(255)
);



-- Create table for Achievements
CREATE TABLE Achievements (
    achievement_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INT,
    date_earned TIMESTAMP
);

-- Create table for Player Progress (Tracks achievements for players)
CREATE TABLE Player_Progress (
    progress_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    achievement_id INT REFERENCES Achievements(achievement_id) ON DELETE CASCADE,
    date_earned TIMESTAMP
);

-- Create table for Leaderboards
CREATE TABLE Leaderboards (
    leaderboard_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    score INT,
    placement INT,
    date_achieved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for In-Game Purchases (Items, Skins, DLC)
CREATE TABLE InGame_Purchases (
    purchase_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    item_name VARCHAR(100),
    item_type VARCHAR(50),
    price DECIMAL(10, 2),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Trading System (Player-to-Player trades)
CREATE TABLE Trades (
    trade_id SERIAL PRIMARY KEY,
    buyer_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    seller_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    item_name VARCHAR(100),
    item_type VARCHAR(50),
    trade_value DECIMAL(10, 2),
    trade_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Clans
CREATE TABLE Clans (
    clan_id SERIAL PRIMARY KEY,
    clan_name VARCHAR(100) UNIQUE NOT NULL,
    created_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Clan Membership
CREATE TABLE Clan_Memberships (
    membership_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    clan_id INT REFERENCES Clans(clan_id) ON DELETE CASCADE,
    role ENUM('Leader', 'Member', 'Co-Leader') DEFAULT 'Member',
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Modding Community (Mods, Skins, Custom Content)
CREATE TABLE Mods (
    mod_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    mod_name VARCHAR(100),
    description TEXT,
    uploaded_by INT REFERENCES Users(user_id) ON DELETE CASCADE,
    mod_file_url VARCHAR(255),
    rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Game Reviews
CREATE TABLE Game_Reviews (
    review_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    review_text TEXT,
    rating DECIMAL(3, 2),
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Game Streaming (Twitch, YouTube, etc.)
CREATE TABLE Game_Streams (
    stream_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    stream_platform ENUM('Twitch', 'YouTube', 'Mixer', 'Other') NOT NULL,
    streamer_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    stream_url VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP
);

-- Create table for Support Tickets (Player support requests)
CREATE TABLE Support_Tickets (
    ticket_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    issue_description TEXT,
    issue_type VARCHAR(50),
    ticket_status ENUM('Open', 'Closed', 'In Progress') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

INSERT INTO Gaming_Platforms (name, manufacturer, release_date) VALUES
('Xbox Series X', 'Microsoft', '2020-11-10'),
('PlayStation 5', 'Sony', '2020-11-12'),
('Steam', 'Valve', '2003-09-12');



-- Insert Users
INSERT INTO Users (username, email, password_hash, role, date_joined, last_login, profile_picture, banner_image, platform_id) VALUES
('GamerJay', 'jay@example.com', '$2b$10$9GBUjStByGL/RXdJ.LRDbuy3qw/B/dTry71RIKGvkeQ6Rm8Xszh2S', 'Player', '2025-04-01', '2025-04-01 10:00:00', 'GamerJay_pfp.png', 'GamerJay_banner.jpg', 1),
('SniperMike', 'mike@example.com', '$2b$10$8hM8UKCNqVgBAQ5AkVimpuCxI2p65cQerQ5NqQCmhVigF0r8M0QCq', 'Player', '2025-04-01', '2025-04-01 11:00:00', 'defaultPFP.png', 'defaultBanner.jpg', 2),
('DevAlex', 'alexdev@example.com', 'hashed_pw3', 'Developer', '2025-04-01', '2025-04-01 12:00:00', 'defaultPFP.png', 'defaultBanner.jpg', 3),
('AdminKate', 'kateadmin@example.com', 'hashed_pw4', 'Admin', '2025-04-01', '2025-04-01 13:00:00', 'defaultPFP.png', 'defaultBanner.jpg', 2);

INSERT INTO Games (title, genre, developer_id, release_date, description, platform, price, dlc_available, image, background_image, video_url) VALUES
('GTA V', 'Action-Adventure', 3, '2013-09-17', 'Open-world chaos with missions, driving, and more.', 'PC, PlayStation, Xbox', 29.99, TRUE, 'gta_v_cover.jpg', 'gta_v_bg.jpg', 'https://www.youtube.com/embed/tV95N0TIltc'),
('Apex Legends', 'First-Person Shooter / Battle Royale', 3, '2019-02-04', 'Free-to-play battle royale featuring unique legends.', 'PC, PlayStation, Xbox', 0.00, TRUE, 'apex_legends_cover.jpg', 'apex_bg.jpg', 'https://www.youtube.com/embed/PxOCScALl1M'),
('Call of Duty: Warzone', 'First-Person Shooter / Battle Royale', 3, '2022-11-16', 'Modern warfare shooter with intense campaign and multiplayer.', 'PC, PlayStation, Xbox', 0.00, TRUE, 'cod_warzone_cover.jpg', 'callofduty_bg.jpg', 'https://www.youtube.com/embed/pqPCFUUbMiU'),
('Fortnite', 'Shooter / Battle Royale', 3, '2017-07-25', 'Build and battle to victory in a stylized survival shooter.', 'PC, PlayStation, Xbox, Switch', 0.00, TRUE, 'fortnite_cover.jpg', 'fortnite_bg.jpg', 'https://www.youtube.com/embed/GQm0M7i3veA'),
('Rocket League', 'Sports / Action', 3, '2015-07-07', 'Soccer with rocket-powered cars in fast-paced arenas.', 'PC, PlayStation, Xbox, Switch', 0.00, TRUE, 'rocket_league_cover.jpg', 'rocket_league_bg.jpg', 'https://www.youtube.com/embed/Ig5XAB552no');


-- Insert Achievements
INSERT INTO Achievements (game_id, name, description, points) VALUES
(1, 'Vice City Kingpin', 'Complete all GTA 5 story missions.', 150),
(1, 'Master of Chaos', 'Cause $1 million worth of damage.', 50),
(2, 'Apex Predator', 'Reach Apex Predator rank.', 75),
(2, 'Ultimate Legend', 'Win with every legend.', 60),
(3, 'Veteran Soldier', 'Complete campaign on Veteran.', 100),
(3, 'Multiplayer Ace', 'Win 100 online matches.', 80),
(4, 'Build Champion', 'Win 10 matches with at least 100 builds.', 70),
(4, 'Victory Royale', 'Achieve first place in Solo mode.', 60),
(5, 'Overtime Hero', 'Score in overtime 5 times.', 40),
(5, 'Aerial Ace', 'Score 20 aerial goals.', 60);

-- Insert Player Progress
INSERT INTO Player_Progress (user_id, achievement_id, date_earned) VALUES
(1, 1, '2025-03-31'),
(1, 3, '2025-04-01'),
(2, 2, '2025-04-01'),
(2, 4, '2025-04-02'),
(1, 5, '2025-04-02'),
(2, 8, '2025-04-03');

-- Insert Leaderboards (with kills, deaths, kd_ratio)
INSERT INTO Leaderboards (game_id, user_id, score, placement) VALUES
(1, 1, 4200, 1),
(1, 2, 3900, 2),
(2, 1, 3100, 1),
(2, 2, 2900, 2),
(3, 1, 2800, 1),
(3, 2, 2700, 2),
(4, 1, 3000, 1),
(4, 2, 2950, 2),
(5, 1, 3500, 1),
(5, 2, 3400, 2);



-- Insert In-Game Purchases
INSERT INTO InGame_Purchases (user_id, game_id, item_name, item_type, price) VALUES
(1, 1, 'GTA VIP Pack', 'DLC', 29.99),
(2, 1, 'Vice City Edition', 'DLC', 39.99),
(1, 2, 'Apex Battle Pass', 'DLC', 10.00),
(2, 2, 'Legendary Skin', 'Skin', 7.99),
(1, 3, 'Modern Camo Pack', 'Skin', 5.99),
(2, 3, 'MW Operator Pack', 'DLC', 14.99),
(1, 4, 'Fortnite Battle Pass', 'DLC', 9.99),
(2, 4, 'Victory Skin Pack', 'Skin', 4.99),
(1, 5, 'Rocket Boost Pack', 'DLC', 6.99),
(2, 5, 'Car Custom Bundle', 'Skin', 5.00);

-- Insert Trades
INSERT INTO Trades (buyer_id, seller_id, item_name, item_type, trade_value) VALUES
(1, 2, 'Legendary Skin', 'Skin', 4.00),
(2, 1, 'Apex Battle Pass', 'DLC', 7.00),
(1, 2, 'Rocket Boost Pack', 'DLC', 5.00);

-- Insert Clans
INSERT INTO Clans (clan_name, created_by) VALUES
('Vice Legends', 1),
('Apex Hunters', 2),
('Modern Warfare Elite', 1),
('Build Masters', 2),
('Rocket Pros', 1);

-- Insert Clan Memberships
INSERT INTO Clan_Memberships (user_id, clan_id, role) VALUES
(1, 1, 'Leader'),
(2, 2, 'Leader'),
(1, 3, 'Member'),
(2, 4, 'Member'),
(1, 5, 'Leader');

-- Insert Mods
INSERT INTO Mods (game_id, mod_name, description, uploaded_by, mod_file_url, rating) VALUES
(1, 'GTA Chaos Mod', 'Triggers random events in GTA 5.', 3, 'http://example.com/mods/gta5_chaos', 4.8),
(2, 'Apex Training Arena', 'Practice mode with unlimited ammo.', 3, 'http://example.com/mods/apex_arena', 4.7),
(3, 'COD Zombie Expansion', 'Fan-made zombie mode.', 3, 'http://example.com/mods/cod_zombie', 4.9),
(4, 'Fortnite Classic Mode', 'Restores early map and gameplay.', 3, 'http://example.com/mods/fortnite_classic', 4.6),
(5, 'Rocket League Neon Map', 'Custom neon-themed map.', 3, 'http://example.com/mods/rl_neon', 4.5);



