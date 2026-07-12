const SUPABASE_URL = "https://dnvobmkryzyobnxsibmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_5fRZO99faxkHEQ_IupqSAQ_VkUFX9Oi";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = selector => document.querySelector(selector);

let sessionUser = null;
let profile = null;
let checkins = [];
let friends = [];
let requests = [];

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}

function setError(id, message) {
  $(id).textContent = message || "";
}

function fireForStreak(streak) {
  if (streak >= 1000) return "rainbow";
  if (streak >= 100) return "white";
  if (streak >= 50) return "purple";
  if (streak >= 10) return "blue";
  return "orange";
}

function fireName(fire) {
  return {
    orange: "Classic fire",
    blue: "Blue fire",
    purple: "Purple fire",
    white: "White fire",
    rainbow: "Rainbow fire"
  }[fire];
}

function avatarHTML(person, className = "") {
  return `
    <div
      class="avatar ${person.avatar_hair || "short"} ${person.avatar_outfit || "hoodie"} ${className}"
      style="--avatar-color: ${person.avatar_color || "#f05a2a"}"
    ></div>
  `;
}

function localDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single();

  if (error) {
    showToast("Could not load your profile.");
    return;
  }

  profile = data;
}

async function loadCheckins() {
  const { data } = await supabaseClient
    .from("checkins")
    .select("checkin_date")
    .eq("user_id", sessionUser.id);

  checkins = data || [];
}

async function loadFriends() {
  const { data } = await supabaseClient
    .from("friend_requests")
    .select("*")
    .or(`requester_id.eq.${sessionUser.id},receiver_id.eq.${sessionUser.id}`);

  const allRequests = data || [];

  const ids = [...new Set(
    allRequests.map(item =>
      item.requester_id === sessionUser.id
        ? item.receiver_id
        : item.requester_id
    )
  )];

  let otherProfiles = [];

  if (ids.length) {
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("*")
      .in("id", ids);

    otherProfiles = profiles || [];
  }

  const findProfile = id => otherProfiles.find(item => item.id === id);

  friends = allRequests
    .filter(item => item.status === "accepted")
    .map(item => {
      const friendId = item.requester_id === sessionUser.id
        ? item.receiver_id
        : item.requester_id;

      return findProfile(friendId);
    })
    .filter(Boolean);

  requests = allRequests
    .filter(item => item.status === "pending" && item.receiver_id === sessionUser.id)
    .map(item => ({
      ...item,
      person: findProfile(item.requester_id)
    }))
    .filter(item => item.person);
}

async function refreshApp() {
  await loadProfile();
  await Promise.all([loadCheckins(), loadFriends()]);
  render();
}

function render() {
  if (!profile) return;

  const checkedToday = checkins.some(item => item.checkin_date === localDate());
  const selectedFire = profile.equipped_fire || "orange";
  const unlockedFire = fireForStreak(profile.streak);

  $("#displayName").textContent = profile.username;
  $("#goalText").textContent = profile.bio || "One small action is all it takes.";
  $("#streakNumber").textContent = profile.streak;
  $("#xpNumber").textContent = profile.xp;
  $("#levelNumber").textContent = Math.floor(profile.xp / 100) + 1;
  $("#xpBar").style.width = `${profile.xp % 100}%`;

  $("#streakFlame").className = `streak-flame fire-${selectedFire}`;
  $("#fireName").textContent = `${fireName(unlockedFire)} unlocked`;

  $("#streakMessage").textContent = checkedToday
    ? "You showed up today. Amazing work!"
    : "Your spark is ready for today.";

  $("#checkinHeading").textContent = checkedToday
    ? "You did it today!"
    : "Ready when you are.";

  $("#checkinText").textContent = checkedToday
    ? "Come back tomorrow to protect your streak."
    : "Take a moment and add today to your story.";

  $("#checkinButton").disabled = checkedToday;
  $("#checkinButton").textContent = checkedToday
    ? "✓ Today is complete"
    : "🔥 Check in today";

  $("#openMyProfile").innerHTML = avatarHTML(profile);

  renderCalendar();
  renderFriends();
  renderProfileEditor();
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  const checkedDates = checkins.map(item => item.checkin_date);

  $("#calendar").innerHTML = Array.from({ length: days }, (_, index) => {
    const day = index + 1;

    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return `
      <div class="calendar-day ${checkedDates.includes(date) ? "done" : ""}">
        ${day}
      </div>
    `;
  }).join("");
}

function personRow(person, buttonText = "", buttonAction = "") {
  return `
    <article class="person-row">
      ${avatarHTML(person, "person-avatar")}

      <div class="person-info">
        <strong>@${person.username}</strong>
        <small>${person.streak} day streak · Level ${Math.floor(person.xp / 100) + 1}</small>
      </div>

      <button class="small-button" data-profile="${person.id}">View</button>

      ${buttonText
        ? `<button class="small-button" data-action="${buttonAction}" data-id="${person.id}">${buttonText}</button>`
        : ""
      }
    </article>
  `;
}

function renderFriends() {
  $("#requestsList").innerHTML = requests.length
    ? requests.map(item => personRow(item.person, "Accept", `accept:${item.id}`)).join("")
    : `<p class="muted">No friend requests yet.</p>`;

  $("#friendsList").innerHTML = friends.length
    ? friends.map(person => personRow(person)).join("")
    : `<p class="muted">Search for a username to add your first friend.</p>`;
}

function renderProfileEditor() {
  const fire = profile.equipped_fire || "orange";

  $("#myProfilePreview").className = `profile-preview bg-${profile.profile_background}`;

  $("#myProfilePreview").innerHTML = `
    ${avatarHTML(profile)}
    <h2>@${profile.username}</h2>
    <p>${profile.bio || "No bio yet — make your profile yours!"}</p>
    <p><strong>🔥 ${profile.streak} day streak</strong></p>
  `;

  $("#profileBackground").value = profile.profile_background;
  $("#avatarColor").value = profile.avatar_color;
  $("#avatarHair").value = profile.avatar_hair;
  $("#avatarOutfit").value = profile.avatar_outfit;
  $("#equippedFire").value = fire;
  $("#profileBio").value = profile.bio;
}

async function checkIn() {
  const { data, error } = await supabaseClient.rpc("check_in_today");

  if (error) {
    showToast(error.message);
    return;
  }

  if (data?.[0]?.already_checked_in) {
    showToast("You already checked in today.");
    return;
  }

  showToast("🔥 Streak updated! You earned 25 XP.");
  await refreshApp();
}

async function searchUsers() {
  const username = $("#searchUsername").value.trim();

  if (!username) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .ilike("username", `%${username}%`)
    .neq("id", sessionUser.id)
    .limit(10);

  if (error) {
    showToast("Could not search profiles.");
    return;
  }

  $("#searchResults").innerHTML = data.length
    ? data.map(person => personRow(person, "Add friend", `add:${person.id}`)).join("")
    : `<p class="muted">No usernames matched that search.</p>`;
}

async function sendFriendRequest(personId) {
  const { error } = await supabaseClient
    .from("friend_requests")
    .insert({
      requester_id: sessionUser.id,
      receiver_id: personId
    });

  showToast(error ? "That request could not be sent." : "Friend request sent!");
}

async function acceptRequest(requestId) {
  const { error } = await supabaseClient
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (error) {
    showToast("Could not accept that request.");
    return;
  }

  showToast("You are now friends! ✨");
  await refreshApp();
}

async function openProfile(id) {
  let person = friends.find(friend => friend.id === id);

  if (!person) {
    const { data } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    person = data;
  }

  if (!person) return;

  $("#modalContent").innerHTML = `
    <section class="profile-preview bg-${person.profile_background}">
      ${avatarHTML(person)}
      <h2>@${person.username}</h2>
      <p>${person.bio || "This person has not written a bio yet."}</p>
      <p><strong>🔥 ${person.streak} day streak · Level ${Math.floor(person.xp / 100) + 1}</strong></p>
    </section>
  `;

  $("#profileModal").classList.remove("hidden");
}

async function saveProfile() {
  const chosenFire = $("#equippedFire").value;

  const requiredStreak = {
    orange: 0,
    blue: 10,
    purple: 50,
    white: 100,
    rainbow: 1000
  }[chosenFire];

  if (profile.streak < requiredStreak) {
    showToast(`Keep your streak going to unlock ${fireName(chosenFire)}.`);
    return;
  }

  const updates = {
    profile_background: $("#profileBackground").value,
    avatar_color: $("#avatarColor").value,
    avatar_hair: $("#avatarHair").value,
    avatar_outfit: $("#avatarOutfit").value,
    equipped_fire: chosenFire,
    bio: $("#profileBio").value.trim()
  };

  const { error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", sessionUser.id);

  if (error) {
    showToast("Profile could not be saved.");
    return;
  }

  showToast("Profile saved!");
  await refreshApp();
}

$("#loginForm").onsubmit = async event => {
  event.preventDefault();

  setError("#loginError", "");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: $("#loginEmail").value.trim(),
    password: $("#loginPassword").value
  });

  if (error) {
    setError("#loginError", error.message);
  }
};

$("#signupForm").onsubmit = async event => {
  event.preventDefault();

  setError("#signupError", "");

  const username = $("#signupUsername").value.trim();

  const { data: existing } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    setError("#signupError", "That username is already taken.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: $("#signupEmail").value.trim(),
    password: $("#signupPassword").value,
    options: {
      data: { username }
    }
  });

  if (error) {
    setError("#signupError", error.message);
    return;
  }

  if (!data.session) {
    setError("#signupError", "Check your email to confirm your account, then log in.");
  }
};

$("#showSignup").onclick = () => {
  $("#loginView").classList.add("hidden");
  $("#signupView").classList.remove("hidden");
};

$("#showLogin").onclick = () => {
  $("#signupView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
};

$("#checkinButton").onclick = checkIn;
$("#searchButton").onclick = searchUsers;
$("#saveProfile").onclick = saveProfile;
$("#openMyProfile").onclick = () => showPage("profile");

$("#closeModal").onclick = () => {
  $("#profileModal").classList.add("hidden");
};

$("#logoutButton").onclick = () => {
  supabaseClient.auth.signOut();
};

$("#searchResults").onclick = async event => {
  const profileButton = event.target.closest("[data-profile]");
  const actionButton = event.target.closest("[data-action]");

  if (profileButton) {
    await openProfile(profileButton.dataset.profile);
  }

  if (actionButton?.dataset.action.startsWith("add:")) {
    await sendFriendRequest(actionButton.dataset.id);
  }
};

$("#requestsList").onclick = async event => {
  const profileButton = event.target.closest("[data-profile]");
  const actionButton = event.target.closest("[data-action]");

  if (profileButton) {
    await openProfile(profileButton.dataset.profile);
  }

  if (actionButton?.dataset.action.startsWith("accept:")) {
    const requestId = actionButton.dataset.action.split(":")[1];
    await acceptRequest(requestId);
  }
};

$("#friendsList").onclick = async event => {
  const button = event.target.closest("[data-profile]");

  if (button) {
    await openProfile(button.dataset.profile);
  }
};

document.querySelectorAll(".nav-button").forEach(button => {
  button.onclick = () => {
    showPage(button.dataset.page);
  };
});

function showPage(page) {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("#homePage").classList.toggle("hidden", page !== "home");
  $("#friendsPage").classList.toggle("hidden", page !== "friends");
  $("#profilePage").classList.toggle("hidden", page !== "profile");
}

supabaseClient.auth.onAuthStateChange(async (_event, session) => {
  sessionUser = session?.user || null;

  $("#authScreen").classList.toggle("hidden", Boolean(sessionUser));
  $("#appScreen").classList.toggle("hidden", !sessionUser);

  if (sessionUser) {
    await refreshApp();
  }
});

(async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    sessionUser = data.session.user;

    $("#authScreen").classList.add("hidden");
    $("#appScreen").classList.remove("hidden");

    await refreshApp();
  }
})();
