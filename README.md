# Kindle — Daily Streak Tracker

A simple daily habit tracker that lets people create an account, log in, and increase their streak once per day.

## How to run it

1. Download or clone this project.
2. Open `index.html` in a web browser.
3. Create an account and click the daily check-in button.

No installation or server is needed for this version.

## How the project is organized

- `index.html` — the page structure: forms, buttons, cards, and text.
- `styles.css` — all visual design: colors, layout, responsive phone styles, and animations.
- `app.js` — the behavior: signup, login, streak rules, and saved data.

## The key streak rule

When a person clicks the check-in button, the app saves today's date. When the page is loaded again, it compares that saved date to today:

```js
if (currentUser.lastCheckin === todayKey()) return;
```

That line stops a second check-in on the same day. If the previous check-in was yesterday, the streak increases by one. Otherwise, it starts back at one:

```js
currentUser.streak = currentUser.lastCheckin && dayDiff(currentUser.lastCheckin, todayKey()) === 1
  ? currentUser.streak + 1
  : 1;
```

## Where accounts are saved

This first version uses your browser's `localStorage`, so it is great for learning and prototypes. The accounts only exist in the specific browser on the specific device you used. A real public website should use a backend and securely hash passwords instead.

## Next improvements to try

1. Add a habit name (for example, “Read 10 pages”).
2. Let users choose an avatar.
3. Add a calendar history view.
4. Connect the site to a real database and authentication service.
