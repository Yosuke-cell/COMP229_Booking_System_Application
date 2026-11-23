/* Purrfect Stack | COMP229 | Developers: Gyubin Mun 301520556; Yosuke Nakamura 301526834; Juan Rojas 301520306; Tolga Unal 301439216; Yuhan Su 301533347. API and form handlers. */
const $ = (s) => document.querySelector(s),
  modal = $("#modal"),
  body = $("#modalBody");
let base =
    localStorage.getItem("cafe-api") ||
    "https://comp229-booking-system-application.onrender.com",
  token = sessionStorage.getItem("cafe-token") || "",
  bookings = [],
  selectedCat = "Mochi";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4500);
}
function open(html) {
  body.innerHTML = html;
  if (!modal.open) modal.showModal();
}
function logout() {
  token = "";
  sessionStorage.removeItem("cafe-token");
  updateAccount();
}
function updateAccount() {
  $("#account").textContent = token ? "Log out" : "Log in";
}
async function api(path, method = "GET", data, auth = false) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(base + path, {
      method,
      signal: controller.signal,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Authorization: "Bearer " + token } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (response.status === 401 && auth) {
      logout();
      throw Error("Your session has expired. Please log in again.");
    }
    if (!response.ok || result.success === false)
      throw Error(
        response.status === 409
          ? "That time is already booked. Please choose another time."
          : result.message || "Request failed.",
      );
    return result;
  } catch (e) {
    if (e.name === "AbortError")
      throw Error("The server took too long to respond. Please retry.");
    if (e instanceof TypeError)
      throw Error("Cannot connect to the café server. Please try again later.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
function error(e) {
  const el = $("#formError");
  if (el) el.textContent = e.message;
  else notify(e.message);
}
function formEnd(label) {
  return (
    '<p id="formError" class="error" role="alert"></p><button class="primary" type="submit">' +
    label +
    "</button>"
  );
}
function authForm(signup = false) {
  open(
    '<p class="eyebrow">YOUR ACCOUNT</p><h2>' +
      (signup ? "Create an account." : "Log in.") +
      '</h2><form id="authForm">' +
      (signup
        ? '<div class="row"><label>First name<input name="firstName" required autocomplete="given-name"></label><label>Last name<input name="lastName" required autocomplete="family-name"></label></div>'
        : "") +
      '<label>Email<input type="email" name="email" required autocomplete="email"></label><label>Password<input type="password" name="password" minlength="6" required autocomplete="' +
      (signup ? "new-password" : "current-password") +
      '"></label>' +
      formEnd(signup ? "Create account" : "Log in") +
      '</form><p><button id="switchAuth">' +
      (signup ? "Already a member? Log in" : "New here? Create an account") +
      "</button></p>",
  );
  $("#switchAuth").onclick = () => authForm(!signup);
  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("[type=submit]");
    button.disabled = true;
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (signup) await api("/api/users", "POST", data);
      const r = await api("/api/users/signin", "POST", {
        email: data.email,
        password: data.password,
      });
      token = r.token;
      sessionStorage.setItem("cafe-token", token);
      updateAccount();
      bookForm();
    } catch (e) {
      error(e);
    } finally {
      button.disabled = false;
    }
  };
}
function localDate(value) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function bookForm(booking) {
  if (!token) {
    authForm();
    return;
  }
  open(
    '<p class="eyebrow">RESERVATIONS</p><h2>' +
      (booking ? "Edit your visit." : "Plan your visit.") +
      '</h2><form id="bookingForm"><label>Cat name<input name="catName" required value="' +
      esc(booking?.catName || selectedCat) +
      '"></label><label>Visit title<input name="title" required value="' +
      esc(booking?.title || "Cat café visit") +
      '"></label><div class="row"><label>Start time<input type="datetime-local" name="startDate" required value="' +
      (booking ? localDate(booking.startDate) : "") +
      '"></label><label>End time<input type="datetime-local" name="endDate" required value="' +
      (booking ? localDate(booking.endDate) : "") +
      '"></label></div><small>Times use your device’s timezone: ' +
      esc(Intl.DateTimeFormat().resolvedOptions().timeZone) +
      '</small><label>Notes (optional)<textarea name="description">' +
      esc(booking?.description || "") +
      "</textarea></label><p>Reservations start as pending. The café will confirm your visit.</p>" +
      formEnd(booking ? "Save changes" : "Request reservation") +
      "</form>",
  );
  $("#bookingForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      error(Error("End time must be after start time."));
      return;
    }
    const button = e.target.querySelector("[type=submit]");
    button.disabled = true;
    try {
      data.startDate = new Date(data.startDate).toISOString();
      data.endDate = new Date(data.endDate).toISOString();
      await api(
        "/api/bookings" + (booking ? "/" + encodeURIComponent(booking.id) : ""),
        booking ? "PUT" : "POST",
        data,
        true,
      );
      notify(booking ? "Visit updated." : "Reservation requested.");
      await myBookings();
      availability();
    } catch (e) {
      error(e);
    } finally {
      button.disabled = false;
    }
  };
}
async function myBookings() {
  if (!token) {
    authForm();
    return;
  }
  open("<h2>Your visits.</h2><p>Loading reservations…</p>");
  try {
    bookings = (await api("/api/bookings", "GET", null, true)).data;
    open(
      '<h2>Your visits.</h2><p>Admins see all reservations; members see their own.</p><button id="newVisit">Plan another visit</button><div>' +
        (bookings.length
          ? bookings
              .map(
                (b, i) =>
                  '<article class="booking"><h3>' +
                  esc(b.title) +
                  "</h3><p>" +
                  esc(b.catName) +
                  " · " +
                  esc(b.status) +
                  "</p><p>" +
                  esc(new Date(b.startDate).toLocaleString("en-CA")) +
                  " — " +
                  esc(new Date(b.endDate).toLocaleString("en-CA")) +
                  "</p><p>" +
                  esc(b.description) +
                  "</p>" +
                  (b.status !== "cancelled"
                    ? '<button data-edit="' +
                      i +
                      '">Edit</button><button data-cancel="' +
                      i +
                      '">Cancel visit</button>'
                    : "") +
                  "</article>",
              )
              .join("")
          : '<p class="notice">You have no reservations yet.</p>') +
        "</div>",
    );
    $("#newVisit").onclick = () => bookForm();
    body
      .querySelectorAll("[data-edit]")
      .forEach((b) => (b.onclick = () => bookForm(bookings[b.dataset.edit])));
    body
      .querySelectorAll("[data-cancel]")
      .forEach(
        (b) => (b.onclick = () => cancelVisit(bookings[b.dataset.cancel])),
      );
  } catch (e) {
    open(
      '<h2>Your visits.</h2><p class="error">' +
        esc(e.message) +
        '</p><button id="retry">Try again</button>',
    );
    $("#retry").onclick = myBookings;
  }
}
function cancelVisit(b) {
  open(
    "<h2>Cancel this visit?</h2><p>" +
      esc(b.title) +
      " with " +
      esc(b.catName) +
      '</p><p id="formError" class="error" role="alert"></p><button id="keep">Keep visit</button> <button id="confirmCancel" class="primary">Cancel visit</button>',
  );
  $("#keep").onclick = myBookings;
  $("#confirmCancel").onclick = async (e) => {
    e.target.disabled = true;
    try {
      await api(
        "/api/bookings/" + encodeURIComponent(b.id),
        "DELETE",
        null,
        true,
      );
      notify("Visit cancelled.");
      myBookings();
      availability();
    } catch (err) {
      error(err);
      e.target.disabled = false;
    }
  };
}
async function availability() {
  const target = $("#availability");
  target.textContent = "Loading availability…";
  try {
    const list = (await api("/api/bookings/public")).data;
    target.innerHTML = list.length
      ? list
          .map(
            (b) =>
              "<p><strong>" +
              esc(b.catName) +
              "</strong> · " +
              esc(new Date(b.startDate).toLocaleString("en-CA")) +
              " — " +
              esc(new Date(b.endDate).toLocaleString("en-CA")) +
              " · Busy</p>",
          )
          .join("")
      : "<p>No upcoming busy times are listed. Availability is confirmed when you submit a reservation.</p>";
  } catch (e) {
    target.textContent = e.message;
  }
}
$("#close").onclick = () => modal.close();
$("#account").onclick = () => {
  if (token) {
    logout();
    notify("You have logged out.");
  } else authForm();
};
$("#my").onclick = myBookings;
document
  .querySelectorAll("[data-book]")
  .forEach((b) => (b.onclick = () => bookForm()));
document.querySelectorAll("[data-cat]").forEach(
  (b) =>
    (b.onclick = () => {
      selectedCat = b.dataset.cat;
      bookForm();
    }),
);
$("#refresh").onclick = availability;
$("#connection input").value = base;
$("#connection").onsubmit = (e) => {
  e.preventDefault();
  const url = new URL(new FormData(e.target).get("url"));
  if (!["http:", "https:"].includes(url.protocol)) return;
  const next = url.href.replace(/\/$/, "");
  if (next !== base) logout();
  base = next;
  localStorage.setItem("cafe-api", base);
  availability();
  notify("API connection updated.");
};
updateAccount();
availability();
