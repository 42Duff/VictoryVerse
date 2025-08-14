const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

// to hide credentials. example in .env.example
require('dotenv').config({ path: path.join(__dirname, '.env') });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.connect((err) => {
    if (err) {
      console.error('DB connection error:', err);
      return res.status(500).send('Database error');
    }

    connection.query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email], (err, results) => {
      if (err) {
        connection.end();
        return res.status(500).send('Error checking existing users');
      }

      if (results.length > 0) {
        connection.end();
        return res.status(400).send('Username or email already taken');
      }

      const defaultRole = 'Player';
      const defaultProfilePic = 'defaultPFP.png';
      const defaultBanner = 'defaultBanner.jpg';
      
      const insertQuery = `
        INSERT INTO Users (username, email, password_hash, role, profile_picture, banner_image)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        insertQuery,
        [username, email, hashedPassword, defaultRole, defaultProfilePic, defaultBanner],
        (err, result) => {
          if (err) {
            connection.end();
            console.error('Error inserting user:', err);
            return res.status(500).send('Error registering user');
          }

          const newUserId = result.insertId;

          connection.query('SELECT * FROM Users WHERE user_id = ?', [newUserId], (err, rows) => {
            if (err || rows.length === 0) {
              connection.end();
              return res.status(500).send('Error retrieving new user');
            }

            const user = rows[0];

            req.session.user = {
              user_id: user.user_id,
              username: user.username,
              profile_picture: user.profile_picture,
              banner_image: user.banner_image
            };

            connection.end();
            res.json({ message: 'Registration successful', user: req.session.user });
          });
        }
      );
    });
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      connection.end();
      if (err || results.length === 0) {
        return res.status(401).send('Invalid username or password');
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) return res.status(401).send('Invalid username or password');

      req.session.user = {
        user_id: user.user_id,
        username: user.username,
        profile_picture: user.profile_picture,
        banner_image: user.banner_image
      };

      res.send('Login successful');
    }
  );
});

app.get('/getCurrentUser', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.get('/user.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'user.html'));
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = file.fieldname === 'profile_picture'
      ? './public/images/profiles'
      : './public/images/banners';
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    const name = req.session.user.username + '_' + file.fieldname + '.' + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

app.post('/upload-images', upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'banner_image', maxCount: 1 }
]), (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Not logged in');
  }

  const updates = {};
  if (req.files['profile_picture']) {
    updates.profile_picture = req.files['profile_picture'][0].filename;
  }
  if (req.files['banner_image']) {
    updates.banner_image = req.files['banner_image'][0].filename;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).send('No files uploaded');
  }

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const query = 'UPDATE Users SET profile_picture = ?, banner_image = ? WHERE user_id = ?';
  connection.query(query, [
    updates.profile_picture || req.session.user.profile_picture,
    updates.banner_image || req.session.user.banner_image,
    req.session.user.user_id
  ], (err) => {
    connection.end();
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).send('Failed to update user info');
    }

    if (updates.profile_picture) req.session.user.profile_picture = updates.profile_picture;
    if (updates.banner_image) req.session.user.banner_image = updates.banner_image;

    res.send('Images uploaded successfully!');
  });
});

app.post('/remove-profile-picture', (req, res) => {
  if (!req.session.user) return res.status(403).send('Not logged in');

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query(
    'UPDATE Users SET profile_picture = ? WHERE user_id = ?',
    ['defaultPFP.png', req.session.user.user_id],
    (err) => {
      connection.end();
      if (err) return res.status(500).send('Failed to reset profile picture');
      req.session.user.profile_picture = 'defaultPFP.png';
      res.send('\u2705 Profile picture reset to default');
    }
  );
});

app.post('/remove-banner', (req, res) => {
  if (!req.session.user) return res.status(403).send('Not logged in');

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query(
    'UPDATE Users SET banner_image = ? WHERE user_id = ?',
    ['defaultBanner.jpg', req.session.user.user_id],
    (err) => {
      connection.end();
      if (err) return res.status(500).send('Failed to reset banner');
      req.session.user.banner_image = 'defaultBanner.jpg';
      res.send('\u2705 Banner reset to default');
    }
  );
});

app.post('/submit-ticket', (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('You must be logged in to submit a support ticket.');
  }

  const { issue_type, issue_description } = req.body;

  if (!issue_type || !issue_description) {
    return res.status(400).send('Please complete all fields.');
  }

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const query = `
    INSERT INTO Support_Tickets (user_id, issue_description, issue_type, ticket_status)
    VALUES (?, ?, ?, 'Open')
  `;

  connection.query(query, [req.session.user.user_id, issue_description, issue_type], (err) => {
    connection.end();
    if (err) {
      console.error('Error submitting ticket:', err);
      return res.status(500).send('Failed to submit support ticket.');
    }

    res.send('\u2705 Support ticket submitted successfully!');
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.send('Logged out');
  });
});

app.get('/tables', async (req, res) => {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Successfully connected to the database.');

    const table = req.query.table;
    let query = 'SHOW TABLES';
    if (table) {
      query = `SELECT * FROM ${table}`;
    }
    console.log(query);
    connection.query(query, (error, results, fields) => {
      if (error) {
        console.error('Error fetching data:', error);
      } else {
        console.log('Table contents:');
        console.table(results);
        const content = JSON.stringify(results)
        res.send({content});
      }

      connection.end((endErr) => {
        if (endErr) {
          console.error('Error closing connection:', endErr);
        } else {
          console.log('Database connection closed.');
        }
      });
    });
  });
});

app.get('/leaderboard', async (req, res) => {
  const game = req.query.game || 'Rocket League';
  const top = parseInt(req.query.top) || 20;
  const result = await scrapeLeaderboard(game, top);
  console.log(game + ', ' + top + ' gamers');
  res.send({result});
});

app.get('/', async (req, res) => {
  res.redirect('/welcome.html');
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
app.use(cors());

async function scrapeLeaderboard(game, top) {
  const lbinfo = { 
    rocketleague : { url: 'https://rlstats.net/leaderboards/skills', 
      rankrow: '#leaderboard div.center table[data-platform="Steam"] tbody tr' },
    apexlegends : { url: 'https://apex.tracker.gg/apex/leaderboards/stats/origin/RankScore?page=1&legend=all', 
      rankrow: 'table.trn-table tbody tr' },
    callofduty : { url: 'https://cod.tracker.gg/warzone/leaderboards/stats/atvi/default?page=1', 
      rankrow: 'table.trn-table tbody tr' },
    gta5 : { url: 'https://racetime.gg/gtav/leaderboards', 
      rankrow: '#leaderboard div.center table[data-platform="Steam"] tbody tr' },
    fortnite : { url: 'https://fortnitetracker.com/leaderboards', 
      rankrow: 'table.trn-table tbody tr' },
  };
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };
  try {
    const leaderboard = [];
    switch (game) {
      case 'rocketleague': {
        const { data } = await axios.get(lbinfo[game].url,  { headers }); 
        const $ = cheerio.load(data);
        $(lbinfo[game].rankrow).each((index, element) => {
          if (index > 1 && index < top+2) {  // First two rows are not used
            const rank = $(element).find('td').eq(0).text().trim();
            const playerName = $(element).find('td').eq(1).text().trim();
            const playerStat = $(element).find('td').eq(2).text().trim();
            leaderboard.push({ rank, playerName, playerStat });
          }
        });
        console.log("Top " + top + " Leaderboard:", leaderboard);
        return JSON.stringify(leaderboard);
        break;
      }
      case 'callofduty':
      case 'apexlegends': 
      case 'fortnite':  {
        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({ headless: true });
      
        const page = await browser.newPage();

        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        );
        await page.goto(lbinfo[game].url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        page.on('console', msg => {
          console.log('BROWSER LOG:', msg.text());
        });
        await page.waitForSelector(lbinfo[game].rankrow);
        
        const data = await page.evaluate((game, lbinfo) => {
          const rows = document.querySelectorAll(lbinfo[game].rankrow);
          const leaderboard = [];
          console.log("rows.length: " + rows.length);
          rows.forEach((row) => {
            const cols = row.querySelectorAll('td');
            if (cols.length >= 4) {
              leaderboard.push({
                rank: cols[0].innerText.trim(),
                playerName: cols[1].innerText.trim(),
                playerStat: (game == 'callofduty' || game == 'fortnite' 
                  ? (game == 'callofduty' 
                    ? cols[2].innerText.trim() + ' wins out of ' + cols[3].innerText.trim() + ' matches'
                    : cols[3].innerText.trim() + ' wins out of ' + cols[4].innerText.trim() + ' matches')
                  : 'Rank score: ' + cols[2].innerText.trim() + ', Level: ' + cols[3].innerText.trim())
              });
            }
          });
          return leaderboard;
        }, game, lbinfo);

        await browser.close();
        console.log("Top " + top + " Leaderboard:", data.slice(0, top));
        return JSON.stringify(data.slice(0, top));
        break;
      }
    }

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}

async function scrapePlayerStats(playerId) {
    try {
        const { data } = await axios.get(`https://rlstats.net/profile/Xbox/${playerId}`);
        const $ = cheerio.load(data);
        const playerStats = {};
        playerStats.name = $('h1.player-name').text().trim();
        playerStats.rank = $('span.player-rank').text().trim();
        playerStats.mmr = $('span.player-mmr').text().trim();
        console.log(`Stats for player ${playerId}:`, playerStats);
    } catch (error) {
        console.error("Error fetching player stats:", error);
    }
}

const ign = 'https://www.ign.com'
const newsSource = ign + '/news';
app.get('/news', async (req, res) => { 
  try {
    const { data } = await axios.get(newsSource);
    const $ = cheerio.load(data);
    const articles = [];

    $('.item-details').each((i, el) => {
      const t = $(el).contents();
      const tt = $(el).find('.item-subtitle').text().trim();
      const title = tt.substring(tt.indexOf(' - ') + 3);
      console.log(title);
      const l = $(el).find('a').attr('href');
      const link = ign + l;
      console.log(link);
      if (title && link) {
        articles.push({ title, link });
      }
    });

    res.json(articles);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

