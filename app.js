const $ = (s) => document.querySelector(s);
const usersKey = 'kindle-users';
const sessionKey = 'kindle-session';
let currentUser = null;
const todayKey = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const fires = [
  { id: 'orange', name: 'Classic', milestone: 0, color: 'orange' },
  { id: 'blue', name: 'Blue fire', milestone: 10, color: 'blue' },
  { id: 'purple', name: 'Purple fire', milestone: 50, color: 'purple' },
  { id: 'white', name: 'White fire', milestone: 100, color: 'white' },
  { id: 'rainbow', name: 'Rainbow fire', milestone: 1000, color: 'rainbow' }
];
function renderFires() {
  if (!currentUser.equippedFire) {
    currentUser.equippedFire = 'orange';
    saveUser(currentUser);
  }

  document.body.classList.remove(
    'fire-orange',
    'fire-blue',
    'fire-purple',
    'fire-white',
    'fire-rainbow'
  );

  document.body.classList.add(`fire-${currentUser.equippedFire}`);

  $('#fireCollection').innerHTML = fires.map(fire => {
    const unlocked = currentUser.streak >= fire.milestone;
    const equipped = currentUser.equippedFire === fire.id;

    return `
      <article class="fire-reward ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}">
        <span class="fire-preview ${fire.color}">🔥</span>
        <strong>${fire.name}</strong>
        <small>${fire.milestone === 0 ? 'Starter fire' : `Unlock at ${fire.milestone} days`}</small>
        <button data-fire="${fire.id}" ${unlocked ? '' : 'disabled'}>
          ${equipped ? 'Equipped' : unlocked ? 'Equip' : 'Locked'}
        </button>
      </article>
    `;
  }).join('');
}
function users() { return JSON.parse(localStorage.getItem(usersKey) || '{}'); }
function saveUser(user) { const all = users(); all[user.username] = user; localStorage.setItem(usersKey, JSON.stringify(all)); }
function showForm(id) { document.querySelectorAll('.form-view').forEach(x => x.classList.add('hidden')); $('#' + id).classList.remove('hidden'); }
document.querySelectorAll('[data-show]').forEach(b => b.onclick = () => showForm(b.dataset.show));
function login(username, password) {
  const user = users()[username];
  if (!user || user.password !== password) return false;
  currentUser = user; localStorage.setItem(sessionKey, username); openApp(); return true;
}
$('#login').onsubmit = e => { e.preventDefault(); $('#loginError').textContent = login($('#loginUsername').value.trim(), $('#loginPassword').value) ? '' : 'That username or password does not match.'; };
$('#signup').onsubmit = e => {
  e.preventDefault(); const username = $('#signupUsername').value.trim(); const password = $('#signupPassword').value;
  if (users()[username]) { $('#signupError').textContent = 'That username is already taken.'; return; }
  currentUser = { username, password, streak: 0, lastCheckin: null, checkedDates: [] }; saveUser(currentUser); localStorage.setItem(sessionKey, username); openApp();
};
function openApp() { $('#authScreen').classList.add('hidden'); $('#appScreen').classList.remove('hidden'); render(); }
function render() {
  $('#displayName').textContent = currentUser.username;
  $('#todayLabel').textContent = new Intl.DateTimeFormat('en-US', { weekday:'long', month:'short', day:'numeric' }).format(new Date());
  $('#streakNumber').textContent = currentUser.streak;
  const done = currentUser.lastCheckin === todayKey();
  $('#streakMessage').textContent = currentUser.streak ? (done ? 'You showed up today. Amazing work!' : 'Your spark is ready for today.') : 'Your streak is waiting for you.';
  $('#checkinTitle').textContent = done ? 'You did it today!' : 'Ready when you are.';
  $('#checkinText').textContent = done ? 'Come back tomorrow to keep your momentum going.' : 'Take a moment and add today to your story.';
  const button = $('#checkinButton'); button.disabled = done; button.innerHTML = done ? '<span class="button-flame">✓</span><span>Today is complete</span>' : '<span class="button-flame">🔥</span><span>Click to add to your daily streak</span><b>→</b>';
  $('#nextNote').textContent = done ? 'Your next check-in unlocks at midnight.' : 'A new check-in unlocks at midnight.';
  renderWeek();
  renderFires();
}
function renderWeek() {
  const now = new Date(); const mondayOffset = (now.getDay() + 6) % 7; const monday = new Date(now); monday.setDate(now.getDate() - mondayOffset); const names = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  let complete = 0; $('#week').innerHTML = names.map((name, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); const key = d.toISOString().slice(0,10); const isDone = currentUser.checkedDates.includes(key); if(isDone) complete++; const isToday = key === todayKey(); return `<div class="day ${isDone?'done':''} ${isToday?'today':''}"><div class="day-name">${name}</div><div class="day-dot">${isDone?'✓':d.getDate()}</div></div>`; }).join(''); $('#weekCount').textContent = `${complete} / 7 days`;
}
$('#checkinButton').onclick = () => {
  if (currentUser.lastCheckin === todayKey()) return;
  currentUser.streak = currentUser.lastCheckin && dayDiff(currentUser.lastCheckin, todayKey()) === 1 ? currentUser.streak + 1 : 1;
  currentUser.lastCheckin = todayKey(); currentUser.checkedDates = [...new Set([...(currentUser.checkedDates || []), todayKey()])]; saveUser(currentUser); render();
  const toast = $('#toast'); toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 3800);
  $('#streakCard').animate([{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}], {duration:500, easing:'ease-out'});
};
$('#fireCollection').onclick = event => {
  const button = event.target.closest('[data-fire]');

  if (!button || button.disabled) return;

  currentUser.equippedFire = button.dataset.fire;
  saveUser(currentUser);
  render();
};
$('#logout').onclick = () => { localStorage.removeItem(sessionKey); currentUser = null; $('#appScreen').classList.add('hidden'); $('#authScreen').classList.remove('hidden'); showForm('loginForm'); };
const previous = localStorage.getItem(sessionKey); if (previous && users()[previous]) { currentUser = users()[previous]; openApp(); }
