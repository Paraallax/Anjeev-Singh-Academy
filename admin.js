/* ==========================================
   LABCHAT ADMIN PANEL
   Supabase + Static GitHub Pages
========================================== */


/* ==========================================
   SUPABASE
========================================== */

const SUPABASE_URL =
    "https://izobeyuplyramoojazdg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fftKRus4w4NXriH07kWvQg_Up9qWpy6";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* ==========================================
   STATE
========================================== */

let currentAdmin = null;
let currentProfile = null;
let users = [];


/* ==========================================
   DOM
========================================== */

const loadingScreen =
    document.getElementById("loadingScreen");

const adminApp =
    document.getElementById("adminApp");

const adminName =
    document.getElementById("adminName");

const logoutButton =
    document.getElementById("logoutButton");

const usersTableBody =
    document.getElementById("usersTableBody");

const userSearch =
    document.getElementById("userSearch");

const refreshUsersButton =
    document.getElementById("refreshUsersButton");

const totalUsers =
    document.getElementById("totalUsers");

const activeUsers =
    document.getElementById("activeUsers");

const onlineUsers =
    document.getElementById("onlineUsers");

const totalMessages =
    document.getElementById("totalMessages");

const createUserForm =
    document.getElementById("createUserForm");

const createUserButton =
    document.getElementById("createUserButton");

const createUserMessage =
    document.getElementById("createUserMessage");

const newUserEmail =
    document.getElementById("newUserEmail");

const newUserUsername =
    document.getElementById("newUserUsername");

const newUserPassword =
    document.getElementById("newUserPassword");

const newUserRole =
    document.getElementById("newUserRole");

const editUserOverlay =
    document.getElementById("editUserOverlay");

const editUserForm =
    document.getElementById("editUserForm");

const editUserId =
    document.getElementById("editUserId");

const editUsername =
    document.getElementById("editUsername");

const editRole =
    document.getElementById("editRole");

const editStatus =
    document.getElementById("editStatus");

const editUserMessage =
    document.getElementById("editUserMessage");

const closeEditModal =
    document.getElementById("closeEditModal");

const cancelEditButton =
    document.getElementById("cancelEditButton");


/* ==========================================
   START
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


/* ==========================================
   INITIALIZE ADMIN
========================================== */

async function initializeAdmin() {

    console.log(
        "[LabChat Admin] Initializing..."
    );

    try {

        /*
         * Get the authenticated user directly
         * from Supabase Auth.
         */

        const {
            data: {
                user
            },
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "[LabChat Admin] Auth error:",
                error
            );

            showAdminError(
                "Authentication could not be verified."
            );

            return;
        }


        if (!user) {

            console.log(
                "[LabChat Admin] No authenticated user."
            );

            redirectToLogin();

            return;
        }


        currentAdmin =
            user;


        console.log(
            "[LabChat Admin] Authenticated:",
            user.id
        );


        /*
         * Verify admin using the existing
         * Supabase security function.
         */

        const isAdmin =
            await verifyAdmin();


        if (!isAdmin) {

            return;
        }


        /*
         * Load the admin profile.
         */

        const profileLoaded =
            await loadAdminProfile();


        if (!profileLoaded) {

            return;
        }


        /*
         * Load dashboard data.
         */

        await loadUsers();


        updateDashboardStats();


        /*
         * Everything succeeded.
         */

        showAdminApp();


        console.log(
            "[LabChat Admin] Admin panel ready."
        );


    } catch (error) {

        console.error(
            "[LabChat Admin] Fatal error:",
            error
        );

        showAdminError(
            "Could not load the admin panel."
        );
    }
}


/* ==========================================
   VERIFY ADMIN
========================================== */

async function verifyAdmin() {

    console.log(
        "[LabChat Admin] Checking admin permission..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "is_admin"
        );


    if (error) {

        console.error(
            "[LabChat Admin] is_admin() error:",
            error
        );

        showAdminError(
            "Could not verify admin access."
        );

        return false;
    }


    console.log(
        "[LabChat Admin] is_admin():",
        data
    );


    if (data !== true) {

        console.error(
            "[LabChat Admin] User is not an active admin."
        );

        await supabaseClient.auth.signOut();

        redirectToLogin();

        return false;
    }


    return true;
}


/* ==========================================
   LOAD ADMIN PROFILE
========================================== */

async function loadAdminProfile() {

    console.log(
        "[LabChat Admin] Loading admin profile..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, role, is_active"
            )
            .eq(
                "id",
                currentAdmin.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "[LabChat Admin] Profile error:",
            error
        );

        showAdminError(
            "Could not load admin profile."
        );

        return false;
    }


    if (!data) {

        console.error(
            "[LabChat Admin] Profile not found."
        );

        showAdminError(
            "Admin profile was not found."
        );

        return false;
    }


    currentProfile =
        data;


    if (
        currentProfile.role !==
        "admin"
    ) {

        console.error(
            "[LabChat Admin] Profile role is not admin."
        );

        await supabaseClient.auth.signOut();

        redirectToLogin();

        return false;
    }


    if (
        currentProfile.is_active ===
        false
    ) {

        console.error(
            "[LabChat Admin] Admin account inactive."
        );

        await supabaseClient.auth.signOut();

        redirectToLogin();

        return false;
    }


    updateAdminIdentity();


    return true;
}


/* ==========================================
   ADMIN IDENTITY
========================================== */

function updateAdminIdentity() {

    if (!adminName) {
        return;
    }


    adminName.textContent =
        currentProfile?.username ||
        currentAdmin?.email ||
        "Admin";
}


/* ==========================================
   SHOW ADMIN APP
========================================== */

function showAdminApp() {

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );
    }


    if (adminApp) {

        adminApp.classList.remove(
            "hidden"
        );
    }
}


/* ==========================================
   SHOW ERROR
========================================== */

function showAdminError(message) {

    console.error(
        "[LabChat Admin]",
        message
    );


    if (loadingScreen) {

        const strong =
            loadingScreen.querySelector(
                "strong"
            );

        const span =
            loadingScreen.querySelector(
                "span"
            );


        if (strong) {

            strong.textContent =
                "Admin access error";
        }


        if (span) {

            span.textContent =
                message;
        }
    }
}


/* ==========================================
   LOAD USERS
========================================== */

async function loadUsers() {

    if (usersTableBody) {

        usersTableBody.innerHTML =
            `
            <tr>
                <td
                    colspan="5"
                    class="table-empty"
                >
                    Loading users...
                </td>
            </tr>
            `;
    }


    console.log(
        "[LabChat Admin] Loading users..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, role, is_active, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "[LabChat Admin] Users error:",
            error
        );


        showTableMessage(
            "Could not load users."
        );


        return;
    }


    users =
        data || [];


    renderUsers(
        users
    );


    updateDashboardStats();


    console.log(
        "[LabChat Admin] Users loaded:",
        users.length
    );
}


/* ==========================================
   RENDER USERS
========================================== */

function renderUsers(list) {

    if (!usersTableBody) {
        return;
    }


    usersTableBody.innerHTML =
        "";


    if (
        !list ||
        list.length === 0
    ) {

        showTableMessage(
            "No users found."
        );

        return;
    }


    list.forEach(
        user => {

            const row =
                document.createElement(
                    "tr"
                );


            /* USER */

            const userCell =
                document.createElement(
                    "td"
                );


            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "user-cell";


            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "user-avatar";


            avatar.textContent =
                getInitials(
                    user.username ||
                    "U"
                );


            const identity =
                document.createElement(
                    "div"
                );


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "user-name";

            name.textContent =
                user.username ||
                "Unknown";


            const email =
                document.createElement(
                    "div"
                );

            email.className =
                "user-email";


            identity.appendChild(
                name
            );

            identity.appendChild(
                email
            );


            wrapper.appendChild(
                avatar
            );

            wrapper.appendChild(
                identity
            );


            userCell.appendChild(
                wrapper
            );


            /* ROLE */

            const roleCell =
                document.createElement(
                    "td"
                );


            const roleBadge =
                document.createElement(
                    "span"
                );


            roleBadge.className =
                `role-badge ${
                    user.role === "admin"
                        ? "role-admin"
                        : "role-user"
                }`;


            roleBadge.textContent =
                user.role ||
                "user";


            roleCell.appendChild(
                roleBadge
            );


            /* STATUS */

            const statusCell =
                document.createElement(
                    "td"
                );


            const statusBadge =
                document.createElement(
                    "span"
                );


            const active =
                user.is_active !== false;


            statusBadge.className =
                `status-badge ${
                    active
                        ? "status-active"
                        : "status-inactive"
                }`;


            statusBadge.textContent =
                active
                    ? "Active"
                    : "Inactive";


            statusCell.appendChild(
                statusBadge
            );


            /* CREATED */

            const createdCell =
                document.createElement(
                    "td"
                );


            createdCell.textContent =
                formatDate(
                    user.created_at
                );


            /* ACTIONS */

            const actionsCell =
                document.createElement(
                    "td"
                );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "table-actions";


            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type =
                "button";

            editButton.className =
                "action-button";

            editButton.textContent =
                "Edit";


            editButton.addEventListener(
                "click",
                () =>
                    openEditModal(
                        user
                    )
            );


            const statusButton =
                document.createElement(
                    "button"
                );


            statusButton.type =
                "button";


            statusButton.className =
                `action-button ${
                    active
                        ? "danger"
                        : "success"
                }`;


            statusButton.textContent =
                active
                    ? "Deactivate"
                    : "Activate";


            statusButton.addEventListener(
                "click",
                () =>
                    toggleUserStatus(
                        user
                    )
            );


            if (
                user.id ===
                currentAdmin.id
            ) {

                statusButton.disabled =
                    true;

                statusButton.title =
                    "You cannot deactivate yourself.";
            }


            actions.appendChild(
                editButton
            );

            actions.appendChild(
                statusButton
            );


            actionsCell.appendChild(
                actions
            );


            /* ROW */

            row.appendChild(
                userCell
            );

            row.appendChild(
                roleCell
            );

            row.appendChild(
                statusCell
            );

            row.appendChild(
                createdCell
            );

            row.appendChild(
                actionsCell
            );


            usersTableBody.appendChild(
                row
            );
        }
    );
}


/* ==========================================
   SEARCH USERS
========================================== */

if (userSearch) {

    userSearch.addEventListener(
        "input",
        () => {

            const query =
                userSearch.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                renderUsers(
                    users
                );

                return;
            }


            const filtered =
                users.filter(
                    user => {

                        return (
                            String(
                                user.username ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                query
                            )
                        );
                    }
                );


            renderUsers(
                filtered
            );
        }
    );
}


/* ==========================================
   REFRESH USERS
========================================== */

if (refreshUsersButton) {

    refreshUsersButton.addEventListener(
        "click",
        async () => {

            await loadUsers();

            updateDashboardStats();
        }
    );
}


/* ==========================================
   DASHBOARD STATS
========================================== */

function updateDashboardStats() {

    if (!users) {
        return;
    }


    const activeCount =
        users.filter(
            user =>
                user.is_active !== false
        ).length;


    if (totalUsers) {

        totalUsers.textContent =
            users.length;
    }


    if (activeUsers) {

        activeUsers.textContent =
            activeCount;
    }


    if (onlineUsers) {

        onlineUsers.textContent =
            "—";
    }


    if (totalMessages) {

        totalMessages.textContent =
            "—";
    }
}


/* ==========================================
   CREATE USER
========================================== */

if (createUserForm) {

    createUserForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                createUserMessage
            ) {

                createUserMessage.textContent =
                    "";
            }


            const email =
                newUserEmail?.value
                    .trim();


            const username =
                newUserUsername?.value
                    .trim();


            const password =
                newUserPassword?.value;


            const role =
                newUserRole?.value ||
                "user";


            if (
                !email ||
                !username ||
                !password
            ) {

                setCreateUserMessage(
                    "Please fill in all fields."
                );

                return;
            }


            /*
             * IMPORTANT:
             *
             * We do not create another
             * Auth account from this
             * browser client because
             * signUp can interfere with
             * the current admin session.
             *
             * A secure Edge Function is
             * required for this operation.
             */

            setCreateUserMessage(
                "User creation requires a secure Supabase server function."
            );
        }
    );
}


/* ==========================================
   CREATE USER MESSAGE
========================================== */

function setCreateUserMessage(
    message
) {

    if (createUserMessage) {

        createUserMessage.textContent =
            message;
    }
}


/* ==========================================
   EDIT USER MODAL
========================================== */

function openEditModal(user) {

    if (!editUserOverlay) {
        return;
    }


    if (editUserId) {

        editUserId.value =
            user.id;
    }


    if (editUsername) {

        editUsername.value =
            user.username ||
            "";
    }


    if (editRole) {

        editRole.value =
            user.role ||
            "user";
    }


    if (editStatus) {

        editStatus.value =
            user.is_active === false
                ? "false"
                : "true";
    }


    if (editUserMessage) {

        editUserMessage.textContent =
            "";
    }


    editUserOverlay.classList.remove(
        "hidden"
    );
}


/* ==========================================
   CLOSE EDIT MODAL
========================================== */

function closeEditUserModal() {

    if (editUserOverlay) {

        editUserOverlay.classList.add(
            "hidden"
        );
    }
}


if (closeEditModal) {

    closeEditModal.addEventListener(
        "click",
        closeEditUserModal
    );
}


if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        closeEditUserModal
    );
}


if (editUserOverlay) {

    editUserOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                editUserOverlay
            ) {

                closeEditUserModal();
            }
        }
    );
}


/* ==========================================
   EDIT USER
========================================== */

if (editUserForm) {

    editUserForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const userId =
                editUserId?.value;


            const username =
                editUsername?.value
                    .trim();


            const role =
                editRole?.value;


            const isActive =
                editStatus?.value ===
                "true";


            if (
                !userId ||
                !username
            ) {

                if (editUserMessage) {

                    editUserMessage.textContent =
                        "Username is required.";
                }

                return;
            }


            /*
             * Do not allow the admin
             * to deactivate itself.
             */

            if (
                userId ===
                currentAdmin.id &&
                !isActive
            ) {

                if (editUserMessage) {

                    editUserMessage.textContent =
                        "You cannot deactivate your own account.";
                }

                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("profiles")
                    .update({
                        username:
                            username,
                        role:
                            role,
                        is_active:
                            isActive
                    })
                    .eq(
                        "id",
                        userId
                    );


            if (error) {

                console.error(
                    "[LabChat Admin] Update error:",
                    error
                );


                if (editUserMessage) {

                    editUserMessage.textContent =
                        "Could not update user.";
                }

                return;
            }


            closeEditUserModal();


            await loadUsers();

            updateDashboardStats();
        }
    );
}


/* ==========================================
   TOGGLE USER STATUS
========================================== */

async function toggleUserStatus(
    user
) {

    if (
        user.id ===
        currentAdmin.id
    ) {

        return;
    }


    const newStatus =
        user.is_active === false;


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({
                is_active:
                    newStatus
            })
            .eq(
                "id",
                user.id
            );


    if (error) {

        console.error(
            "[LabChat Admin] Status error:",
            error
        );

        alert(
            "Could not change user status."
        );

        return;
    }


    await loadUsers();

    updateDashboardStats();
}


/* ==========================================
   SIDEBAR NAVIGATION
========================================== */

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );

const sections = {

    dashboard:
        document.getElementById(
            "dashboardSection"
        ),

    users:
        document.getElementById(
            "usersSection"
        ),

    "create-user":
        document.getElementById(
            "createUserSection"
        )
};


navItems.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                switchSection(
                    button.dataset.section
                );
            }
        );
    }
);


document
    .querySelectorAll(
        ".quick-action"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    switchSection(
                        button.dataset.section
                    );
                }
            );
        }
    );


function switchSection(
    sectionName
) {

    Object.values(
        sections
    ).forEach(
        section => {

            if (section) {

                section.classList.add(
                    "hidden"
                );
            }
        }
    );


    if (
        sections[sectionName]
    ) {

        sections[sectionName]
            .classList.remove(
                "hidden"
            );
    }


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.section ===
                    sectionName
            );
        }
    );
}


/* ==========================================
   LOGOUT
========================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );
}


async function logout() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "[LabChat Admin] Logout error:",
            error
        );
    }


    redirectToLogin();
}


/* ==========================================
   REDIRECT
========================================== */

function redirectToLogin() {

    window.location.href =
        "index.html";
}


/* ==========================================
   TABLE MESSAGE
========================================== */

function showTableMessage(
    message
) {

    if (!usersTableBody) {
        return;
    }


    usersTableBody.innerHTML =
        `
        <tr>
            <td
                colspan="5"
                class="table-empty"
            >
                ${escapeHtml(message)}
            </td>
        </tr>
        `;
}


/* ==========================================
   HELPERS
========================================== */

function getInitials(
    value
) {

    const text =
        String(
            value || "U"
        )
        .trim();


    if (!text) {
        return "U";
    }


    const parts =
        text.split(
            /\s+/
        );


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        parts[0][0] +
        parts[1][0]
    )
    .toUpperCase();
}


function formatDate(
    timestamp
) {

    if (!timestamp) {
        return "—";
    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleDateString(
        [],
        {
            day:
                "2-digit",
            month:
                "short",
            year:
                "numeric"
        }
    );
}


function escapeHtml(
    value
) {

    return String(
        value
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


/* ==========================================
   ESCAPE KEY
========================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeEditUserModal();
        }
    }
);
