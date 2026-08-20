/* ==========================================
   LABCHAT ADMIN — SUPABASE
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

let editingUserId = null;


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

const totalUsers =
    document.getElementById("totalUsers");

const activeUsers =
    document.getElementById("activeUsers");

const onlineUsers =
    document.getElementById("onlineUsers");

const totalMessages =
    document.getElementById("totalMessages");

const usersTableBody =
    document.getElementById("usersTableBody");

const userSearch =
    document.getElementById("userSearch");

const refreshUsersButton =
    document.getElementById("refreshUsersButton");


/* ==========================================
   NAVIGATION
   ========================================== */

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );

const sectionButtons =
    document.querySelectorAll(
        "[data-section]"
    );

const dashboardSection =
    document.getElementById(
        "dashboardSection"
    );

const usersSection =
    document.getElementById(
        "usersSection"
    );

const createUserSection =
    document.getElementById(
        "createUserSection"
    );

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");


/* ==========================================
   CREATE USER FORM
   ========================================== */

const createUserForm =
    document.getElementById(
        "createUserForm"
    );

const newUserEmail =
    document.getElementById(
        "newUserEmail"
    );

const newUserUsername =
    document.getElementById(
        "newUserUsername"
    );

const newUserPassword =
    document.getElementById(
        "newUserPassword"
    );

const newUserRole =
    document.getElementById(
        "newUserRole"
    );

const createUserButton =
    document.getElementById(
        "createUserButton"
    );

const createUserMessage =
    document.getElementById(
        "createUserMessage"
    );


/* ==========================================
   EDIT USER MODAL
   ========================================== */

const editUserOverlay =
    document.getElementById(
        "editUserOverlay"
    );

const editUserForm =
    document.getElementById(
        "editUserForm"
    );

const editUserId =
    document.getElementById(
        "editUserId"
    );

const editUsername =
    document.getElementById(
        "editUsername"
    );

const editRole =
    document.getElementById(
        "editRole"
    );

const editStatus =
    document.getElementById(
        "editStatus"
    );

const editUserMessage =
    document.getElementById(
        "editUserMessage"
    );

const closeEditModal =
    document.getElementById(
        "closeEditModal"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );


/* ==========================================
   INITIALIZE
   ========================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    try {

        console.log(
            "LabChat Admin: initializing..."
        );


        /*
         * Get current Supabase session.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            redirectToLogin();

            return;
        }


        /*
         * No session.
         */

        if (!data?.session) {

            console.log(
                "No admin session found."
            );

            redirectToLogin();

            return;
        }


        /*
         * Store logged-in user.
         */

        currentAdmin =
            data.session.user;


        console.log(
            "Authenticated user:",
            currentAdmin.id
        );


        /*
         * Verify admin.
         */

        const verified =
            await verifyAdmin();


        if (!verified) {

            return;
        }


        /*
         * IMPORTANT:
         *
         * Admin verification succeeded.
         *
         * Now remove loading screen
         * and display the actual dashboard.
         */

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


        console.log(
            "LabChat Admin: ready."
        );


    } catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

        redirectToLogin();
    }
}


/* ==========================================
   VERIFY ADMIN
   ========================================== */

async function verifyAdmin() {

    if (!currentAdmin) {

        redirectToLogin();

        return false;
    }


    /*
     * Get profile for logged-in user.
     *
     * We use maybeSingle() because it
     * gives us a clean result when no
     * profile exists.
     */

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, role, is_active, created_at"
            )
            .eq(
                "id",
                currentAdmin.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Profile lookup error:",
            error
        );

        redirectToLogin();

        return false;
    }


    /*
     * Profile doesn't exist.
     */

    if (!data) {

        console.error(
            "No profile found for user."
        );

        await supabaseClient
            .auth
            .signOut();

        redirectToLogin();

        return false;
    }


    currentProfile =
        data;


    /*
     * Check role.
     */

    if (
        currentProfile.role !==
        "admin"
    ) {

        console.error(
            "Admin access denied."
        );

        await supabaseClient
            .auth
            .signOut();

        redirectToLogin();

        return false;
    }


    /*
     * Check active status.
     */

    if (
        currentProfile.is_active ===
        false
    ) {

        console.error(
            "Admin account is inactive."
        );

        await supabaseClient
            .auth
            .signOut();

        redirectToLogin();

        return false;
    }


    /*
     * Update sidebar identity.
     */

    updateAdminIdentity();


    /*
     * Load users.
     */

    await loadUsers();


    /*
     * Update dashboard.
     */

    updateDashboardStats();


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
        currentProfile.username ||
        currentAdmin.email ||
        "Admin";
}


/* ==========================================
   NAVIGATION
   ========================================== */

sectionButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                if (!section) {
                    return;
                }

                showSection(
                    section
                );
            }
        );
    }
);


function showSection(section) {

    /*
     * Hide everything first.
     */

    dashboardSection?.classList.add(
        "hidden"
    );

    usersSection?.classList.add(
        "hidden"
    );

    createUserSection?.classList.add(
        "hidden"
    );


    /*
     * Remove active state.
     */

    navItems.forEach(
        item => {

            item.classList.remove(
                "active"
            );
        }
    );


    /*
     * Dashboard.
     */

    if (
        section ===
        "dashboard"
    ) {

        dashboardSection?.classList.remove(
            "hidden"
        );

        setPageHeader(
            "Dashboard",
            "Manage your LabChat system."
        );
    }


    /*
     * Users.
     */

    else if (
        section ===
        "users"
    ) {

        usersSection?.classList.remove(
            "hidden"
        );

        setPageHeader(
            "Users",
            "Manage LabChat accounts."
        );

        loadUsers();
    }


    /*
     * Create user.
     */

    else if (
        section ===
        "create-user"
    ) {

        createUserSection?.classList.remove(
            "hidden"
        );

        setPageHeader(
            "Create User",
            "Create a new LabChat account."
        );
    }


    /*
     * Mark sidebar navigation item active.
     */

    navItems.forEach(
        item => {

            if (
                item.dataset.section ===
                section
            ) {

                item.classList.add(
                    "active"
                );
            }
        }
    );
}


function setPageHeader(
    title,
    subtitle
) {

    if (pageTitle) {

        pageTitle.textContent =
            title;
    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            subtitle;
    }
}


/* ==========================================
   LOAD USERS
   ========================================== */

async function loadUsers() {

    if (!usersTableBody) {
        return;
    }


    showLoading();


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
            "Load users error:",
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
}


/* ==========================================
   RENDER USERS
   ========================================== */

function renderUsers(list) {

    if (!usersTableBody) {
        return;
    }


    usersTableBody.innerHTML = "";


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


            /* ==============================
               USER
            ============================== */

            const userCell =
                document.createElement(
                    "td"
                );


            const userWrapper =
                document.createElement(
                    "div"
                );

            userWrapper.className =
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


            /*
             * IMPORTANT:
             *
             * profiles does NOT contain email.
             * Therefore we don't invent one.
             */

            const email =
                document.createElement(
                    "div"
                );

            email.className =
                "user-email";


            if (
                user.id ===
                currentAdmin?.id
            ) {

                email.textContent =
                    currentAdmin.email ||
                    "";
            }


            identity.appendChild(
                name
            );

            identity.appendChild(
                email
            );


            userWrapper.appendChild(
                avatar
            );

            userWrapper.appendChild(
                identity
            );


            userCell.appendChild(
                userWrapper
            );


            /* ==============================
               ROLE
            ============================== */

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


            /* ==============================
               STATUS
            ============================== */

            const statusCell =
                document.createElement(
                    "td"
                );


            const statusBadge =
                document.createElement(
                    "span"
                );


            const isActive =
                user.is_active !== false;


            statusBadge.className =
                `status-badge ${
                    isActive
                        ? "status-active"
                        : "status-inactive"
                }`;


            statusBadge.textContent =
                isActive
                    ? "Active"
                    : "Inactive";


            statusCell.appendChild(
                statusBadge
            );


            /* ==============================
               CREATED
            ============================== */

            const createdCell =
                document.createElement(
                    "td"
                );


            createdCell.textContent =
                formatDate(
                    user.created_at
                );


            /* ==============================
               ACTIONS
            ============================== */

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


            /*
             * EDIT
             */

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
                () => {

                    openEditModal(
                        user
                    );
                }
            );


            /*
             * ACTIVATE / DEACTIVATE
             */

            const statusButton =
                document.createElement(
                    "button"
                );


            statusButton.type =
                "button";


            statusButton.className =
                `action-button ${
                    isActive
                        ? "danger"
                        : "success"
                }`;


            statusButton.textContent =
                isActive
                    ? "Deactivate"
                    : "Activate";


            statusButton.addEventListener(
                "click",
                () => {

                    toggleUserStatus(
                        user
                    );
                }
            );


            /*
             * Prevent admin from
             * deactivating themselves.
             */

            if (
                user.id ===
                currentAdmin?.id
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


            /* ==============================
               ADD ROW
            ============================== */

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
                            ||
                            String(
                                user.role ||
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
        }
    );
}


/* ==========================================
   DASHBOARD STATS
   ========================================== */

function updateDashboardStats() {

    if (!Array.isArray(users)) {
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


    /*
     * active_users table contains
     * currently online usernames.
     */

    loadOnlineUserCount();


    /*
     * We don't have a messages table
     * query here yet because your
     * supplied SQL did not include the
     * messages table definition.
     */

    if (totalMessages) {

        totalMessages.textContent =
            "—";
    }
}


/* ==========================================
   ONLINE USER COUNT
   ========================================== */

async function loadOnlineUserCount() {

    if (!onlineUsers) {
        return;
    }


    const {
        count,
        error
    } =
        await supabaseClient
            .from("active_users")
            .select(
                "username",
                {
                    count: "exact",
                    head: true
                }
            );


    if (error) {

        console.error(
            "Online user count error:",
            error
        );

        onlineUsers.textContent =
            "—";

        return;
    }


    onlineUsers.textContent =
        count ?? 0;
}


/* ==========================================
   CREATE USER
========================================== */

if (createUserForm) {

    createUserForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                newUserEmail?.value
                    .trim()
                    .toLowerCase();

            const username =
                newUserUsername?.value
                    .trim();

            const password =
                newUserPassword?.value || "";

            const role =
                newUserRole?.value || "user";


            setCreateUserMessage(
                "",
                ""
            );


            if (!email) {

                setCreateUserMessage(
                    "Email is required.",
                    "error"
                );

                return;
            }


            if (!username) {

                setCreateUserMessage(
                    "Username is required.",
                    "error"
                );

                return;
            }


            if (!password) {

                setCreateUserMessage(
                    "Password is required.",
                    "error"
                );

                return;
            }


            if (password.length < 6) {

                setCreateUserMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }


            if (createUserButton) {

                createUserButton.disabled =
                    true;

                createUserButton.textContent =
                    "Creating User...";
            }


            try {

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (
                    sessionError ||
                    !sessionData?.session
                ) {

                    throw new Error(
                        "Your admin session has expired. Please sign in again."
                    );
                }


                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .functions
                        .invoke(
                            "create-user",
                            {
                                body: {
                                    email:
                                        email,

                                    username:
                                        username,

                                    password:
                                        password,

                                    role:
                                        role
                                }
                            }
                        );


                if (error) {

                    console.error(
                        "Create user function error:",
                        error
                    );

                    throw new Error(
                        error.message ||
                        "Could not contact the create-user function."
                    );
                }


                if (!data?.success) {

                    throw new Error(
                        data?.error ||
                        "Could not create user."
                    );
                }


                setCreateUserMessage(
                    data.message ||
                    "User created successfully.",
                    "success"
                );


                createUserForm.reset();


                await loadUsers();


            } catch (error) {

                console.error(
                    "Create user error:",
                    error
                );


                setCreateUserMessage(
                    error instanceof Error
                        ? error.message
                        : "Could not create user.",
                    "error"
                );


            } finally {

                if (createUserButton) {

                    createUserButton.disabled =
                        false;

                    createUserButton.textContent =
                        "Create User";
                }
            }
        }
    );
}


function setCreateUserMessage(
    message,
    type
) {

    if (!createUserMessage) {
        return;
    }


    createUserMessage.textContent =
        message;


    createUserMessage.className =
        `form-message ${
            type || ""
        }`;
}


/* ==========================================
   EDIT USER MODAL
   ========================================== */

function openEditModal(user) {

    if (!editUserOverlay) {
        return;
    }


    editingUserId =
        user.id;


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

        editUserMessage.className =
            "form-message";
    }


    editUserOverlay.classList.remove(
        "hidden"
    );


    if (editUsername) {

        setTimeout(
            () => {

                editUsername.focus();

            },
            50
        );
    }
}


/* ==========================================
   CLOSE EDIT MODAL
   ========================================== */

function closeEditUserModal() {

    if (!editUserOverlay) {
        return;
    }


    editUserOverlay.classList.add(
        "hidden"
    );


    editingUserId =
        null;


    if (editUserForm) {

        editUserForm.reset();
    }


    if (editUserMessage) {

        editUserMessage.textContent =
            "";

        editUserMessage.className =
            "form-message";
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


/* ==========================================
   EDIT USER FORM
   ========================================== */

if (editUserForm) {

    editUserForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const userId =
                editingUserId ||
                editUserId?.value;


            if (!userId) {

                setEditUserMessage(
                    "No user selected.",
                    "error"
                );

                return;
            }


            const username =
                editUsername?.value
                    .trim();


            const role =
                editRole?.value ||
                "user";


            const isActive =
                editStatus?.value ===
                "true";


            if (!username) {

                setEditUserMessage(
                    "Username is required.",
                    "error"
                );

                return;
            }


            /*
             * Don't allow the admin
             * to accidentally change
             * their own status.
             */

            if (
                userId ===
                currentAdmin?.id
                &&
                !isActive
            ) {

                setEditUserMessage(
                    "You cannot deactivate your own admin account.",
                    "error"
                );

                return;
            }


            await updateUserProfile(
                userId,
                username,
                role,
                isActive
            );
        }
    );
}


/* ==========================================
   UPDATE USER PROFILE
   ========================================== */

async function updateUserProfile(
    userId,
    username,
    role,
    isActive
) {

    if (!userId) {
        return;
    }


    /*
     * Do not allow an admin to
     * remove their own admin role.
     */

    if (
        userId ===
        currentAdmin?.id
        &&
        role !== "admin"
    ) {

        setEditUserMessage(
            "You cannot remove your own admin role.",
            "error"
        );

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
            "Update profile error:",
            error
        );


        setEditUserMessage(
            "Could not update user. Check your admin database policies.",
            "error"
        );


        return;
    }


    /*
     * If we edited ourselves,
     * update the local identity too.
     */

    if (
        userId ===
        currentAdmin?.id
    ) {

        currentProfile.username =
            username;

        currentProfile.role =
            role;

        currentProfile.is_active =
            isActive;


        updateAdminIdentity();
    }


    setEditUserMessage(
        "User updated successfully.",
        "success"
    );


    setTimeout(
        async () => {

            closeEditUserModal();

            await loadUsers();

        },
        500
    );
}


/* ==========================================
   ACTIVATE / DEACTIVATE USER
   ========================================== */

async function toggleUserStatus(
    user
) {

    if (!user) {
        return;
    }


    if (
        user.id ===
        currentAdmin?.id
    ) {

        alert(
            "You cannot deactivate yourself."
        );

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
            "Status update error:",
            error
        );


        alert(
            "Could not change user status."
        );


        return;
    }


    await loadUsers();
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

        await supabaseClient
            .auth
            .signOut();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        redirectToLogin();
    }
}


/* ==========================================
   REDIRECT
   ========================================== */

function redirectToLogin() {

    /*
     * All files are in the same folder.
     */

    window.location.href =
        "index.html";
}


/* ==========================================
   LOADING TABLE
   ========================================== */

function showLoading() {

    if (!usersTableBody) {
        return;
    }


    usersTableBody.innerHTML = "";


    const row =
        document.createElement(
            "tr"
        );


    const cell =
        document.createElement(
            "td"
        );


    cell.colSpan =
        5;


    cell.className =
        "table-empty";


    cell.textContent =
        "Loading users...";


    row.appendChild(
        cell
    );


    usersTableBody.appendChild(
        row
    );
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


    usersTableBody.innerHTML = "";


    const row =
        document.createElement(
            "tr"
        );


    const cell =
        document.createElement(
            "td"
        );


    cell.colSpan =
        5;


    cell.className =
        "table-empty";


    cell.textContent =
        message;


    row.appendChild(
        cell
    );


    usersTableBody.appendChild(
        row
    );
}


/* ==========================================
   EDIT MESSAGE
   ========================================== */

function setEditUserMessage(
    message,
    type
) {

    if (!editUserMessage) {
        return;
    }


    editUserMessage.textContent =
        message;


    editUserMessage.className =
        `form-message ${
            type || ""
        }`;
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
    ).toUpperCase();
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


/* ==========================================
   ESC KEY
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


/* ==========================================
   CLICK OUTSIDE EDIT MODAL
   ========================================== */

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
