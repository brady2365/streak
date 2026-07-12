const $ = selector => document.querySelector(selector);

const usersKey = "kindle-complete-users";
const sessionKey = "kindle-complete-session";

const fires = [
  { id: "orange", name: "Classic fire", milestone: 0, color: "orange" },
  { id: "blue", name: "Blue fire", milestone: 10, color: "blue" },
  { id: "purple", name: "Purple fire", milestone: 50, color: "purple" },
  { id: "white", name: "White fire", milestone: 100, color: "white" },
  { id: "rainbow", name: "Rainbow fire", milestone: 1000, color: "rainbow" }
];

const badges = [
  { days: 1, icon: "🌱", name: "First Spark" },
  { days: 7, icon: "⚡", name: "Week Warrior" },
  { days: 30, icon: "🏆", name: "Monthly Master" },
  { days: 100, icon: "💎", name: "Centurion" },
  { days: 1000, icon: "👑", name: "Legend" }
];

let user = null;

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function differenceInDays(firstDate, secondDate) {
  const first = new Date(firstDate + "T00:00:00");
  const second = new Date(secondDate + "T00:00:00");

  return Math.round((second - first) / 86400000);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(usersKey) || "{}");
}

function saveUser() {
  const users = getUsers();
  users[user.username] = user;
  localStorage.setItem(usersKey, JSON.stringify(users));
}

function newUser(username, password) {
  return {
    username,
    password,
    streak: 0,
    xp: 0,
    freezes: 1,
    lastCheckin: null,
    checkedDates: [],
    moods: {},
    notes: {},
    goal: "",
    equippedFire: "orange",
    unlockedFires: ["orange"],
    friend: "",
    sound: true,
    recoveryReady: false
  };
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}

function playSuccessSound() {
  if (!user.sound) return;

  const audio = new AudioContext();
  const sound = audio.createOscillator();
  const volume = audio.createGain();

  sound.frequency.value = 660;
  volume.gain.setValueAtTime(.08, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .25);

  sound.connect(volume);
  volume.connect(audio.destination);
  sound.start();
  sound.stop(audio.currentTime + .25);
}

function openApp() {
  $("#authScreen").classList.add("hidden");
  $("#appScreen").classList.remove("hidden");
  render();
}

function render() {
  user.equippedFire ||= "orange";
  user.unlockedFires ||= ["orange"];
  user.moods ||= {};
  user.notes ||= {};
  user.checkedDates ||= [];
  user.goal ||= "";

  document.body.className = `fire-${user.equippedFire}`;

  $("#nameText").textContent = user.username;
  $("#todayText").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());

  $("#streakNumber").textContent = user.streak;
  $("#freezeNumber").textContent = user.freezes;
  $("#goalInput").value = user.goal;

  const today = getToday();
  const checkedIn = user.lastCheckin === today;
  const missedDays = user.lastCheckin && differenceInDays(user.lastCheckin, today) > 1;

  $("#streakMessage").textContent = checkedIn
    ? "You showed up today. Amazing work!"
    : user.streak
      ? "Your spark is ready for today."
      : "Your streak is waiting for you.";

  $("#checkinTitle").textContent = checkedIn ? "You did it today!" : "Ready when you are.";
  $("#checkinDescription").textContent = checkedIn
    ? "Come back tomorrow to keep your momentum going."
    : user.goal
      ? `Today's goal: ${user.goal}`
      : "Take a moment and add today to your story.";

  $("#checkinButton").disabled = checkedIn;
  $("#checkinButton").textContent = checkedIn
    ? "✓ Today is complete"
    : "🔥 Add to daily streak";

  $("#recoveryCard").classList.toggle(
    "hidden",
    !missedDays || checkedIn || user.recoveryReady || user.freezes > 0
  );

  const level = Math.floor(user.xp / 100) + 1;
  const currentLevelXp = user.xp % 100;

  $("#levelNumber").textContent = level;
  $("#xpNumber").textContent = user.xp;
  $("#xpBar").style.width = `${currentLevelXp}%`;

  $("#soundButton").textContent = `Sound: ${user.sound ? "on" : "off"}`;
  $("#dailyNote").value = user.notes[today] || "";

  renderMoods();
  renderWeek();
  renderFires();
  renderBadges();
  renderCalendar();
  renderFriend();

  saveUser();
}

function renderMoods() {
  const todayMood = user.moods[getToday()];

  document.querySelectorAll(".mood").forEach(button => {
    button.classList.toggle("selected", button.dataset.mood === todayMood);
  });
}

function renderWeek() {
  const today = new Date();
  const monday = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;

  monday.setDate(today.getDate() - mondayOffset);

  const names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  $("#week").innerHTML = names.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const complete = user.checkedDates.includes(key);
    const isToday = key === getToday();

    return `
      <div class="day ${complete ? "done" : ""} ${isToday ? "today" : ""}">
        <div class="day-name">${name}</div>
        <div class="day-dot">${complete ? "✓" : date.getDate()}</div>
      </div>
    `;
  }).join("");
}

function renderFires() {
  $("#fires").innerHTML = fires.map(fire => {
    const unlocked = user.streak >= fire.milestone || user.unlockedFires.includes(fire.id);
    const equipped = user.equippedFire === fire.id;

    return `
      <article class="fire-card ${unlocked ? "" : "locked"} ${equipped ? "equipped" : ""}">
        <span class="fire-preview ${fire.color}">🔥</span>
        <strong>${fire.name}</strong>
        <small>${fire.milestone === 0 ? "Starter reward" : `${fire.milestone} day reward`}</small>
        <button data-fire="${fire.id}" ${unlocked ? "" : "disabled"}>
          ${equipped ? "Equipped" : unlocked ? "Equip" : "Locked"}
        </button>
      </article>
    `;
  }).join("");
}

function renderBadges() {
  $("#badges").innerHTML = badges.map(badge => `
    <div class="badge ${user.streak >= badge.days ? "earned" : ""}">
      ${badge.icon} ${badge.name}<br>
      <small>${badge.days} days</small>
    </div>
  `).join("");
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  $("#calendar").innerHTML = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return `
      <div class="calendar-day ${user.checkedDates.includes(key) ? "done" : ""}">
        ${day}
      </div>
    `;
  }).join("");
}

function renderFriend() {
  if (user.friend) {
    $("#friendTitle").textContent = `${user.friend}'s challenge`;
    $("#friendText").textContent = `You and ${user.friend} are aiming for five check-ins this week. Keep your spark alive!`;
    $("#friendName").value = user.friend;
  }
}

function unlockRewards() {
  fires.forEach(fire => {
    if (user.streak >= fire.milestone && !user.unlockedFires.includes(fire.id)) {
      user.unlockedFires.push(fire.id);
      showToast(`🎁 You unlocked ${fire.name}!`);
    }
  });

  if (user.streak > 0 && user.streak % 7 === 0) {
    user.freezes += 1;
    showToast("🎁 Mystery box: you earned a streak freeze!");
  }
}

function checkIn() {
  const today = getToday();

  if (user.lastCheckin === today) return;

  const missedDays = user.lastCheckin && differenceInDays(user.lastCheckin, today) > 1;
  let protectedStreak = false;

  if (missedDays && user.freezes > 0) {
    user.freezes -= 1;
    protectedStreak = true;
    showToast("❄️ A streak freeze protected your streak!");
  }

  if (missedDays && user.freezes === 0 && !user.recoveryReady && !protectedStreak) {
    $("#recoveryCard").classList.remove("hidden");
    showToast("Complete the recovery quest or your streak will restart.");
    return;
  }

  if (!user.lastCheckin) {
    user.streak = 1;
  } else if (
    differenceInDays(user.lastCheckin, today) === 1 ||
    protectedStreak ||
    user.recoveryReady
  ) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  user.recoveryReady = false;
  user.lastCheckin = today;
  user.xp += 25;
  user.checkedDates = [...new Set([...user.checkedDates, today])];

  unlockRewards();
  saveUser();
  playSuccessSound();

  const surprises = [
    "Your consistency is becoming your superpower.",
    "A small step today creates a stronger tomorrow.",
    "You showed up. That is worth celebrating.",
    "Your future self is proud of this moment."
  ];

  $("#surpriseBox").innerHTML = `
    <strong>✨ Daily surprise!</strong><br>
    ${surprises[Math.floor(Math.random() * surprises.length)]}
  `;

  $("#surpriseBox").classList.remove("hidden");

  showToast("🔥 Streak updated! You earned 25 XP.");
  render();
}

$("#loginForm").onsubmit = event => {
  event.preventDefault();

  const username = $("#loginUsername").value.trim();
  const password = $("#loginPassword").value;
  const users = getUsers();

  if (!users[username] || users[username].password !== password) {
    $("#loginError").textContent = "That username or password does not match.";
    return;
  }

  user = users[username];
  localStorage.setItem(sessionKey, username);
  openApp();
};

$("#signupForm").onsubmit = event => {
  event.preventDefault();

  const username = $("#signupUsername").value.trim();
  const password = $("#signupPassword").value;
  const users = getUsers();

  if (users[username]) {
    $("#signupError").textContent = "That username is already taken.";
    return;
  }

  user = newUser(username, password);
  users[username] = user;

  localStorage.setItem(usersKey, JSON.stringify(users));
  localStorage.setItem(sessionKey, username);

  openApp();
};

$("#showSignup").onclick = () => {
  $("#loginView").classList.add("hidden");
  $("#signupView").classList.remove("hidden");
};

$("#showLogin").onclick = () => {
  $("#signupView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
};

$("#logoutButton").onclick = () => {
  localStorage.removeItem(sessionKey);
  user = null;

  $("#appScreen").classList.add("hidden");
  $("#authScreen").classList.remove("hidden");
};

$("#checkinButton").onclick = checkIn;

$("#questButton").onclick = () => {
  user.recoveryReady = true;
  saveUser();

  $("#recoveryCard").classList.add("hidden");
  showToast("✦ Quest complete! Your streak can now be restored.");
};

$("#soundButton").onclick = () => {
  user.sound = !user.sound;
  saveUser();
  render();
};

$("#moodButtons").onclick = event => {
  const button = event.target.closest("[data-mood]");

  if (!button) return;

  user.moods[getToday()] = button.dataset.mood;
  saveUser();

  renderMoods();
  showToast("Mood saved!");
};

$("#saveNote").onclick = () => {
  user.notes[getToday()] = $("#dailyNote").value.trim();
  saveUser();

  showToast("Your note is saved.");
};

$("#saveGoal").onclick = () => {
  user.goal = $("#goalInput").value.trim();
  saveUser();

  showToast("Daily goal saved!");
  render();
};

$("#fires").onclick = event => {
  const button = event.target.closest("[data-fire]");

  if (!button || button.disabled) return;

  user.equippedFire = button.dataset.fire;
  saveUser();

  render();
  showToast("🔥 Fire equipped!");
};

$("#saveFriend").onclick = () => {
  user.friend = $("#friendName").value.trim();
  saveUser();

  renderFriend();
  showToast(user.friend ? `Challenge saved with ${user.friend}!` : "Friend challenge cleared.");
};

document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(button => {
      button.classList.remove("active");
    });

    tab.classList.add("active");

    $("#todayTab").classList.toggle("hidden", tab.dataset.tab !== "today");
    $("#journeyTab").classList.toggle("hidden", tab.dataset.tab !== "journey");
  };
});

const savedSession = localStorage.getItem(sessionKey);

if (savedSession && getUsers()[savedSession]) {
  user = getUsers()[savedSession];
  openApp();
}
