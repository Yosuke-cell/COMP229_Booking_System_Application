/* Purrfect Stack | COMP229
 * Developers: Gyubin Mun 301520556; Yosuke Nakamura 301526834;
 * Juan Rojas 301520306; Tolga Unal 301439216; Yuhan Su 301533347.
 * React dashboard and profile forms use existing backend endpoints only.
 * External libraries: React/ReactDOM (Meta, https://react.dev), Bootstrap grid
 * (Bootstrap contributors, https://getbootstrap.com). Photography: Unsplash.
 */

// The token payload identifies the profile; the server enforces authorization.
function sessionUser() {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

// Load and update the signed-in user's profile through existing user routes.
async function profileForm() {
  if (!token) {
    authForm();
    return;
  }
  const identity = sessionUser();
  if (!identity?.id) {
    logout();
    authForm();
    return;
  }
  open("<h2>Your profile.</h2><p>Loading profile…</p>");
  try {
    const user = (
      await api(
        "/api/users/" + encodeURIComponent(identity.id),
        "GET",
        null,
        true,
      )
    ).data;
    open(
      '<h2>Your profile.</h2><form id="profileForm"><div class="row"><label>First name<input name="firstName" autocomplete="given-name" required value="' +
        esc(user.firstName) +
        '"></label><label>Last name<input name="lastName" autocomplete="family-name" required value="' +
        esc(user.lastName) +
        '"></label></div><label>Email<input name="email" type="email" autocomplete="email" required value="' +
        esc(user.email) +
        '"></label><label>New password (optional)<input name="password" type="password" minlength="6" autocomplete="new-password"></label><small>Leave the password empty to keep your current password.</small>' +
        formEnd("Save profile") +
        "</form>",
    );
    $("#profileForm").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.target.querySelector("[type=submit]");
      button.disabled = true;
      const data = Object.fromEntries(new FormData(event.target));
      if (!data.password) delete data.password;
      try {
        await api(
          "/api/users/" + encodeURIComponent(identity.id),
          "PUT",
          data,
          true,
        );
        notify("Profile updated.");
        modal.close();
      } catch (err) {
        error(err);
      } finally {
        button.disabled = false;
      }
    };
  } catch (err) {
    open('<h2>Your profile.</h2><p class="error">' + esc(err.message) + "</p>");
  }
}

// Render persistent records from the API. Cancellation retains the record.
function BookingDashboard({ records }) {
  const h = React.createElement;
  const [status, setStatus] = React.useState("all");
  const shown = records.filter(
    (record) => status === "all" || record.status === status,
  );
  return h(
    "div",
    null,
    h("p", { className: "eyebrow" }, "YOUR ACCOUNT"),
    h("h2", null, "Booking dashboard"),
    h(
      "p",
      null,
      records.length +
        " reservations · " +
        records.filter((r) => r.status === "pending").length +
        " pending",
    ),
    h(
      "div",
      { className: "dashboard-actions" },
      h("button", { onClick: () => bookForm() }, "New reservation"),
      h("button", { onClick: profileForm }, "Edit profile"),
    ),
    h(
      "label",
      null,
      "Filter by status",
      h(
        "select",
        { value: status, onChange: (e) => setStatus(e.target.value) },
        ...["all", "pending", "confirmed", "cancelled"].map((value) =>
          h(
            "option",
            { key: value, value },
            value === "all"
              ? "All reservations"
              : value[0].toUpperCase() + value.slice(1),
          ),
        ),
      ),
    ),
    shown.length
      ? h(
          "div",
          null,
          ...shown.map((record) =>
            h(
              "article",
              { className: "booking", key: record.id },
              h("h3", null, record.title),
              h(
                "span",
                { className: "status-label status-" + record.status },
                record.status,
              ),
              h("p", null, record.catName),
              h(
                "p",
                null,
                new Date(record.startDate).toLocaleString("en-CA") +
                  " — " +
                  new Date(record.endDate).toLocaleString("en-CA"),
              ),
              h("p", null, record.description || "No notes."),
              record.status !== "cancelled"
                ? h(
                    "div",
                    null,
                    h(
                      "button",
                      { onClick: () => bookForm(record) },
                      "Edit reservation",
                    ),
                    h(
                      "button",
                      { onClick: () => cancelVisit(record) },
                      "Cancel reservation",
                    ),
                  )
                : null,
            ),
          ),
        )
      : h("p", { className: "notice" }, "No reservations match this status."),
  );
}

// Preserve a usable API-backed list if a CDN is unavailable.
const fallbackBookings = myBookings;
myBookings = async function () {
  if (!token) {
    authForm();
    return;
  }
  if (!window.React || !window.ReactDOM) {
    return fallbackBookings();
  }
  open("<h2>Booking dashboard</h2><p>Loading reservations…</p>");
  try {
    bookings = (await api("/api/bookings", "GET", null, true)).data;
    open('<div id="dashboardRoot"></div>');
    ReactDOM.createRoot($("#dashboardRoot")).render(
      React.createElement(BookingDashboard, { records: bookings }),
    );
  } catch (err) {
    open(
      '<h2>Booking dashboard</h2><p class="error">' +
        esc(err.message) +
        '</p><button id="retry">Try again</button>',
    );
    $("#retry").onclick = myBookings;
  }
};
$("#my").onclick = myBookings;
$("#profile").onclick = profileForm;
