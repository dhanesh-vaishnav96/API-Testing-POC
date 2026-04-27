// ============================================================
//  Testing API - POC  |  Frontend Application Logic
// ============================================================

const API = "";  // same origin

// ---------- Token helpers ----------

function getToken() {
    return localStorage.getItem("jwt_token");
}

function setToken(token) {
    localStorage.setItem("jwt_token", token);
}

function clearToken() {
    localStorage.removeItem("jwt_token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken(),
    };
}

// ---------- Message helpers ----------

function showMsg(elementId, text, isError) {
    var el = document.getElementById(elementId);
    el.innerHTML = "";
    var div = document.createElement("div");
    div.className = "msg " + (isError ? "msg-error" : "msg-success");
    div.textContent = text;
    el.appendChild(div);
}

function clearMsg(elementId) {
    document.getElementById(elementId).innerHTML = "";
}

// ---------- Page navigation ----------

function showPage(page) {
    var pages = document.querySelectorAll(".page");
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }
    var target = document.getElementById("page-" + page);
    if (target) {
        target.classList.add("active");
    }

    // If navigating to dashboard, refresh user list
    if (page === "dashboard") {
        loadUsers();
    }
}

function updateNav(loggedIn) {
    document.getElementById("nav-login-btn").classList.toggle("hidden", loggedIn);
    document.getElementById("nav-register-btn").classList.toggle("hidden", loggedIn);
    document.getElementById("nav-dashboard-btn").classList.toggle("hidden", !loggedIn);
    document.getElementById("nav-logout-btn").classList.toggle("hidden", !loggedIn);
}

// ---------- AUTH: Register ----------

function handleRegister() {
    var name = document.getElementById("register-name").value.trim();
    var email = document.getElementById("register-email").value.trim();
    var password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
        showMsg("register-msg", "All fields are required.", true);
        return;
    }
    if (password.length < 6) {
        showMsg("register-msg", "Password must be at least 6 characters.", true);
        return;
    }

    fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, password: password }),
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 201) {
                showMsg("register-msg", result.body.message, false);
                // Clear form
                document.getElementById("register-name").value = "";
                document.getElementById("register-email").value = "";
                document.getElementById("register-password").value = "";
            } else {
                showMsg("register-msg", result.body.detail || "Registration failed.", true);
            }
        })
        .catch(function () {
            showMsg("register-msg", "Network error. Is the server running?", true);
        });
}

// ---------- AUTH: Login ----------

function handleLogin() {
    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value;

    if (!email || !password) {
        showMsg("login-msg", "Email and password are required.", true);
        return;
    }

    fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 200) {
                setToken(result.body.access_token);
                updateNav(true);
                showPage("dashboard");
                // Clear form
                document.getElementById("login-email").value = "";
                document.getElementById("login-password").value = "";
                clearMsg("login-msg");
            } else {
                showMsg("login-msg", result.body.detail || "Login failed.", true);
            }
        })
        .catch(function () {
            showMsg("login-msg", "Network error. Is the server running?", true);
        });
}

// ---------- AUTH: Logout ----------

function logout() {
    clearToken();
    updateNav(false);
    showPage("login");
}

// ---------- USERS: Load all ----------

function loadUsers() {
    clearMsg("dashboard-msg");

    fetch(API + "/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 200) {
                renderUsersTable(result.body);
            } else {
                showMsg("dashboard-msg", "Failed to load users.", true);
            }
        })
        .catch(function () {
            showMsg("dashboard-msg", "Network error.", true);
        });
}

function renderUsersTable(users) {
    var tbody = document.getElementById("users-tbody");
    tbody.innerHTML = "";

    if (users.length === 0) {
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No users found.";
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var tr = document.createElement("tr");

        var tdId = document.createElement("td");
        tdId.textContent = u.id;
        tr.appendChild(tdId);

        var tdName = document.createElement("td");
        tdName.textContent = u.name;
        tr.appendChild(tdName);

        var tdEmail = document.createElement("td");
        tdEmail.textContent = u.email;
        tr.appendChild(tdEmail);

        var tdDate = document.createElement("td");
        tdDate.textContent = u.created_at ? new Date(u.created_at).toLocaleString() : "—";
        tr.appendChild(tdDate);

        var tdActions = document.createElement("td");
        tdActions.className = "actions";

        var editBtn = document.createElement("button");
        editBtn.className = "btn btn-small";
        editBtn.textContent = "Edit";
        editBtn.setAttribute("data-id", u.id);
        editBtn.onclick = (function (user) {
            return function () { openEditForm(user); };
        })(u);
        tdActions.appendChild(editBtn);

        var delBtn = document.createElement("button");
        delBtn.className = "btn btn-small btn-danger";
        delBtn.textContent = "Delete";
        delBtn.setAttribute("data-id", u.id);
        delBtn.onclick = (function (userId) {
            return function () { handleDeleteUser(userId); };
        })(u.id);
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    }
}

// ---------- USERS: Create ----------

function handleCreateUser() {
    var name = document.getElementById("create-name").value.trim();
    var email = document.getElementById("create-email").value.trim();
    var password = document.getElementById("create-password").value;

    if (!name || !email || !password) {
        showMsg("create-msg", "All fields are required.", true);
        return;
    }
    if (password.length < 6) {
        showMsg("create-msg", "Password must be at least 6 characters.", true);
        return;
    }

    fetch(API + "/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name, email: email, password: password }),
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 201) {
                showMsg("create-msg", result.body.message + " (ID: " + result.body.id + ")", false);
                document.getElementById("create-name").value = "";
                document.getElementById("create-email").value = "";
                document.getElementById("create-password").value = "";
            } else if (result.status === 401) {
                showMsg("create-msg", "Unauthorized. Please login again.", true);
            } else {
                showMsg("create-msg", result.body.detail || "Failed to create user.", true);
            }
        })
        .catch(function () {
            showMsg("create-msg", "Network error.", true);
        });
}

// ---------- USERS: Edit (open form) ----------

function openEditForm(user) {
    document.getElementById("update-user-id").value = user.id;
    document.getElementById("update-name").value = user.name;
    document.getElementById("update-email").value = user.email;
    document.getElementById("update-password").value = "";
    clearMsg("update-msg");
    showPage("update-user");
}

// ---------- USERS: Update ----------

function handleUpdateUser() {
    var userId = document.getElementById("update-user-id").value;
    var name = document.getElementById("update-name").value.trim();
    var email = document.getElementById("update-email").value.trim();
    var password = document.getElementById("update-password").value;

    if (!name || !email) {
        showMsg("update-msg", "Name and email are required.", true);
        return;
    }

    var payload = { name: name, email: email };
    if (password) {
        if (password.length < 6) {
            showMsg("update-msg", "Password must be at least 6 characters.", true);
            return;
        }
        payload.password = password;
    }

    fetch(API + "/users/" + userId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 200) {
                showMsg("update-msg", result.body.message, false);
            } else {
                showMsg("update-msg", result.body.detail || "Update failed.", true);
            }
        })
        .catch(function () {
            showMsg("update-msg", "Network error.", true);
        });
}

// ---------- USERS: Delete ----------

function handleDeleteUser(userId) {
    if (!confirm("Are you sure you want to delete user #" + userId + "?")) {
        return;
    }

    fetch(API + "/users/" + userId, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    })
        .then(function (res) { return res.json().then(function (data) { return { status: res.status, body: data }; }); })
        .then(function (result) {
            if (result.status === 200) {
                showMsg("dashboard-msg", result.body.message, false);
                loadUsers();  // refresh table
            } else {
                showMsg("dashboard-msg", result.body.detail || "Delete failed.", true);
            }
        })
        .catch(function () {
            showMsg("dashboard-msg", "Network error.", true);
        });
}

// ---------- Init on page load ----------

(function init() {
    if (getToken()) {
        updateNav(true);
        showPage("dashboard");
    } else {
        updateNav(false);
        showPage("login");
    }
})();
