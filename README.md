# Kindle — Daily Streak Tracker

A fun daily habit tracker where users can create an account, log in, build daily streaks, unlock fire rewards, earn badges, and track their progress.

## Features

- Username and password signup/login
- Daily streak counter
- Only one check-in per day
- XP and levels
- Daily goals
- Mood check-ins
- Daily notes
- Weekly progress tracker
- Monthly completion calendar
- Achievement badges
- Mystery-box rewards
- Streak freezes
- Streak recovery quests
- Unlockable fire skins:
  - Orange fire: starter fire
  - Blue fire: 10-day streak
  - Purple fire: 50-day streak
  - White fire: 100-day streak
  - Rainbow fire: 1,000-day streak
- Local friend challenge
- Optional check-in sound effect

## Files

- `index.html` — the structure and content of the website
- `styles.css` — the colors, layout, mobile design, and animations
- `app.js` — signup, login, streak rules, rewards, and interactions
- `.gitignore` — files Git should ignore

## How to use it

1. Keep all files in the same folder.
2. Open `index.html` in a browser.
3. Create an account.
4. Set a goal and check in each day.

## How data is saved

This version uses browser `localStorage`.

That means:

- Your accounts are saved in the browser.
- Your streak stays saved after refreshing.
- Data is only available on the same browser and device.
- Passwords are not secure enough for a real public app yet.

## Future improvements

For a real public version, add:

- A database
- Secure password hashing
- Real friend accounts
- Shared friend challenges
- Leaderboards
- Cloud backups
- Email login and password reset
