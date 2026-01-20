# VictoryVerse
VictoryVerse is a fullstack gaming hub for competitive gamers - featuring user profiles, live leaderboards, news scraping, and mod downloads.

## Features
- User Authentication - Secure login/logout system with session handling.
- Dynamic Game Pages - Backgrounds and YouTube videos loaded per game.
- Live Leaderboards - Data scraped from online sources.
- Profile Customization - Upload profile pictures and banners.
- News Aggregation - Game news pulled automatically.

## Tech Stack
Frontend: HTML, CSS, JavaScript  
Backend: Node.js, Express.js  
Database: MySQL (Workbench)  
Other: Axios, Cheerio, Puppeteer

## UI Screenshots

<img width="1920" height="850" alt="VictoryVerseHome" src="https://github.com/user-attachments/assets/3117d599-d146-415f-b391-911b99f684da" />


<img width="1920" height="862" alt="VictoryVerseLogIn" src="https://github.com/user-attachments/assets/41d8d837-2b66-4b31-bced-09c9bf0ba032" />


<img width="1920" height="856" alt="VictoryVerseUser" src="https://github.com/user-attachments/assets/77fcab19-dea1-4371-87bb-b7c539c37f31" />


## Installation & Setup
```bash
# Clone the repo
git clone https://github.com/42Duff/VictoryVerse.git
cd VictoryVerse

# Install dependencies
npm install

# Create .env file  
cp .env.example .env  # Mac/Linux  
copy .env.example .env  # Windows

# Fill in environment variables

## Database Setup
1. Open MySQL Workbench (or your preferred client).
2. Create a new database (for example: `victoryverse`).
3. Run the SQL script located in `db/schema_and_seed.sql` to create tables and insert starter data.
   ```sql
   source db/schema_and_seed.sql;```
   

4. Update your .env file with your database name, username, and password.

# Run the app
npm start
```

## Future Improvements
- Improve UI (specifically leaderboards page and update designs overall)
- Improve UX for leaderboards page. Try to speed up loading times.
- Add an event that changes the welcome page when a user logs in. Currently when they go back to this page it's just blank.
- Find a workaround for the news page. Currently when scraping news from IGN, the links on the news page bring up different articles in a scroll area instead of opening new pages. Also improve on the UI by having news articles presented differently.
 There is also currently an error where the link is a subtitle of the article and not the main title/header.
- Add an upload/download feature for the mods page. Add a method of preventing suspicious files from being uploaded.
- Improve UI for users page. Also add a social section where users can add friends, post status updates, reply to other users threads, upload highlights, short clips, videos, etc.
- Add a 'Clans' section where users can create/join clans and compete against others.
- Hypothetically would like to look into adding a player stats tracker, although this may involve logging into console platform accounts which is not accessible.
