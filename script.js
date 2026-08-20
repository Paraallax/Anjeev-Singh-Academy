/* =========================================================
   LABCHAT
   Main Client Application
========================================================= */


/* =========================================================
   PDF.JS IMPORT
========================================================= */

import {
    getDocument,
    GlobalWorkerOptions
} from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

import {
    PDFViewer
} from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf_viewer.mjs";


/* =========================================================
   PDF.JS WORKER
========================================================= */

GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://izobeyuplyramoojazdg.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_fftKRus4w4NXriH07kWvQg_Up9qWpy6";


/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let realtimeChannel = null;

let presenceChannel = null;

let isCodeMode = false;

let userSessionId =
    crypto.randomUUID();


/* =========================================================
   PDF STATE
========================================================= */

let pdfDocument = null;

let currentPdfPage = 1;

let pdfScale = 1;

let pdfRendering = false;

let pdfPendingPage = null;

let activePdfUrl = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */


/* ---------- PDF ---------- */

const pdfViewerScreen =
    document.getElementById(
        "pdfViewerScreen"
    );

const pdfViewport =
    document.getElementById(
        "pdfViewport"
    );

const pdfPages =
    document.getElementById(
        "pdfPages"
    );

const pdfLoading =
    document.getElementById(
        "pdfLoading"
    );

const pdfError =
    document.getElementById(
        "pdfError"
    );

const pdfErrorMessage =
    document.getElementById(
        "pdfErrorMessage"
    );

const pdfPreviousButton =
    document.getElementById(
        "pdfPreviousButton"
    );

const pdfNextButton =
    document.getElementById(
        "pdfNextButton"
    );

const pdfPageNumber =
    document.getElementById(
        "pdfPageNumber"
    );

const pdfDocumentTitle =
    document.getElementById(
        "pdfDocumentTitle"
    );

const pdfZoomOutButton =
    document.getElementById(
        "pdfZoomOutButton"
    );

const pdfZoomValue =
    document.getElementById(
        "pdfZoomValue"
    );

const pdfZoomInButton =
    document.getElementById(
        "pdfZoomInButton"
    );

const pdfFitButton =
    document.getElementById(
        "pdfFitButton"
    );


/* ---------- Login ---------- */

const loginOverlay =
    document.getElementById(
        "loginOverlay"
    );

const loginModal =
    document.getElementById(
        "loginModal"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const loginIdentifier =
    document.getElementById(
        "loginIdentifier"
    );

const loginPassword =
    document.getElementById(
        "loginPassword"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const closeLoginButton =
    document.getElementById(
        "closeLoginButton"
    );


/* ---------- Chat ---------- */

const chatScreen =
    document.getElementById(
        "chatScreen"
    );

const currentUserElement =
    document.getElementById(
        "currentUser"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const onlineCount =
    document.getElementById(
        "onlineCount"
    );

const messagesContainer =
    document.getElementById(
        "messages"
    );

const messageForm =
    document.getElementById(
        "messageForm"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const codeButton =
    document.getElementById(
        "codeButton"
    );

const codeIndicator =
    document.getElementById(
        "codeIndicator"
    );

const leaveButton =
    document.getElementById(
        "leaveButton"
    );


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeLabChat
);


async function initializeLabChat() {

    console.log(
        "LabChat initializing..."
    );


    setStatus(
        "Connecting..."
    );


    setupLoginControls();

    setupMessageControls();

    setupKeyboardShortcuts();

    setupPdfControls();

    disableChatControls();


    /*
     * PDF is public.
     */

    await loadActivePDF();


    /*
     * Restore authentication.
     */

    await restoreSession();


    console.log(
        "LabChat initialization complete."
    );
}


/* =========================================================
   LOGIN CONTROLS
========================================================= */

function setupLoginControls() {

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (closeLoginButton) {

        closeLoginButton.addEventListener(
            "click",
            closeLogin
        );

    }


    if (loginOverlay) {

        loginOverlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    loginOverlay
                ) {

                    closeLogin();

                }

            }
        );

    }
}


/* =========================================================
   MESSAGE CONTROLS
========================================================= */

function setupMessageControls() {

    if (messageForm) {

        messageForm.addEventListener(
            "submit",
            handleMessageSubmit
        );

    }


    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            handleMessageKeydown
        );


        messageInput.addEventListener(
            "input",
            autoResizeTextarea
        );

    }


    if (codeButton) {

        codeButton.addEventListener(
            "click",
            toggleCodeMode
        );

    }


    if (leaveButton) {

        leaveButton.addEventListener(
            "click",
            leaveChat
        );

    }
}


/* =========================================================
   PDF CONTROLS
========================================================= */

function setupPdfControls() {

    if (pdfPreviousButton) {

        pdfPreviousButton.addEventListener(
            "click",
            () => {

                if (currentPdfPage > 1) {

                    showPdfPage(
                        currentPdfPage - 1
                    );

                }

            }
        );

    }


    if (pdfNextButton) {

        pdfNextButton.addEventListener(
            "click",
            () => {

                if (
                    pdfDocument &&
                    currentPdfPage <
                        pdfDocument.numPages
                ) {

                    showPdfPage(
                        currentPdfPage + 1
                    );

                }

            }
        );

    }


    if (pdfZoomOutButton) {

        pdfZoomOutButton.addEventListener(
            "click",
            () => {

                pdfScale =
                    Math.max(
                        0.5,
                        pdfScale - 0.1
                    );

                updatePdfZoomDisplay();

                renderPdfPage(
                    currentPdfPage
                );

            }
        );

    }


    if (pdfZoomInButton) {

        pdfZoomInButton.addEventListener(
            "click",
            () => {

                pdfScale =
                    Math.min(
                        3,
                        pdfScale + 0.1
                    );

                updatePdfZoomDisplay();

                renderPdfPage(
                    currentPdfPage
                );

            }
        );

    }


    if (pdfFitButton) {

        pdfFitButton.addEventListener(
            "click",
            fitPdfToViewport
        );

    }

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Ctrl + Shift + L
             */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() === "l"
            ) {

                event.preventDefault();

                openLogin();

                return;

            }


            /*
             * Escape
             */

            if (
                event.key === "Escape" &&
                loginOverlay &&
                !loginOverlay.classList.contains(
                    "hidden"
                )
            ) {

                closeLogin();

            }


            /*
             * PDF previous page
             */

            if (
                event.key === "ArrowLeft" &&
                !isTypingIntoInput()
            ) {

                if (currentPdfPage > 1) {

                    showPdfPage(
                        currentPdfPage - 1
                    );

                }

            }


            /*
             * PDF next page
             */

            if (
                event.key === "ArrowRight" &&
                !isTypingIntoInput()
            ) {

                if (
                    pdfDocument &&
                    currentPdfPage <
                        pdfDocument.numPages
                ) {

                    showPdfPage(
                        currentPdfPage + 1
                    );

                }

            }

        }
    );

}


/* =========================================================
   INPUT DETECTION
========================================================= */

function isTypingIntoInput() {

    const active =
        document.activeElement;

    if (!active) {

        return false;

    }


    return (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT"
    );

}


/* =========================================================
   OPEN LOGIN
========================================================= */

function openLogin() {

    if (!loginOverlay) {

        return;

    }


    loginOverlay.classList.remove(
        "hidden"
    );


    clearLoginError();


    setTimeout(
        () => {

            if (loginIdentifier) {

                loginIdentifier.focus();

            }

        },
        50
    );

}


/* =========================================================
   CLOSE LOGIN
========================================================= */

function closeLogin() {

    if (!loginOverlay) {

        return;

    }


    loginOverlay.classList.add(
        "hidden"
    );

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    if (
        !loginIdentifier ||
        !loginPassword
    ) {

        console.error(
            "Login elements are missing."
        );

        return;

    }


    const identifier =
        loginIdentifier.value.trim();

    const password =
        loginPassword.value;


    if (
        !identifier ||
        !password
    ) {

        showLoginError(
            "Please enter your email and password."
        );

        return;

    }


    clearLoginError();

    setLoginLoading(true);


    if (
        !identifier.includes("@")
    ) {

        showLoginError(
            "Please use your Supabase Auth email."
        );

        setLoginLoading(false);

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword(
                    {
                        email:
                            identifier,

                        password:
                            password
                    }
                );


        if (error) {

            console.error(
                "Login error:",
                error
            );

            showLoginError(
                getLoginErrorMessage(
                    error
                )
            );

            setLoginLoading(false);

            return;

        }


        if (
            !data ||
            !data.user
        ) {

            showLoginError(
                "Login failed. Please try again."
            );

            setLoginLoading(false);

            return;

        }


        const success =
            await loadUserProfile(
                data.user
            );


        if (!success) {

            await supabaseClient.auth
                .signOut();

            setLoginLoading(false);

            return;

        }


        loginPassword.value = "";


        setLoginLoading(false);


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showLoginError(
            "An unexpected error occurred."
        );

        setLoginLoading(false);

    }

}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            setStatus(
                "Authentication error"
            );

            return;

        }


        if (
            !data ||
            !data.session
        ) {

            setStatus(
                "Signed out"
            );

            showGuestState();

            return;

        }


        await loadUserProfile(
            data.session.user
        );


    } catch (error) {

        console.error(
            "Session restore error:",
            error
        );

        setStatus(
            "Authentication error"
        );

    }

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        console.log(
            "Auth event:",
            event
        );


        if (
            event ===
            "SIGNED_OUT"
        ) {

            await resetLabChat();

            return;

        }


        if (
            event ===
                "SIGNED_IN" &&
            session
        ) {

            if (
                !currentProfile
            ) {

                await loadUserProfile(
                    session.user
                );

            }

        }

    }
);


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadUserProfile(user) {

    if (!user) {

        return false;

    }


    try {

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
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile load error:",
                error
            );

            showLoginError(
                "Could not load your profile."
            );

            return false;

        }


        if (!data) {

            showLoginError(
                "Your account does not have a LabChat profile."
            );

            return false;

        }


        if (
            data.is_active !== true
        ) {

            showLoginError(
                "Your LabChat account is inactive."
            );

            return false;

        }


        /*
         * ADMIN
         */

        if (
            data.role ===
            "admin"
        ) {

            console.log(
                "Admin login detected."
            );


            window.location.href =
                "../admin/admin.html";


            return true;

        }


        /*
         * NORMAL USER
         */

        if (
            data.role !==
            "user"
        ) {

            showLoginError(
                "Your account has an invalid role."
            );

            return false;

        }


        currentUser =
            user;

        currentProfile =
            data;


        if (currentUserElement) {

            currentUserElement.textContent =
                data.username;

        }


        closeLogin();


        enableChatControls();


        setStatus(
            "Loading..."
        );


        await loadMessages();


        subscribeToMessages();


        startPresence();


        if (messageInput) {

            messageInput.focus();

        }


        console.log(
            "LabChat user logged in:",
            data.username
        );


        return true;


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        showLoginError(
            "Could not load your LabChat profile."
        );

        return false;

    }

}


/* =========================================================
   GUEST STATE
========================================================= */

function showGuestState() {

    currentUser =
        null;

    currentProfile =
        null;


    if (currentUserElement) {

        currentUserElement.textContent =
            "Guest";

    }


    disableChatControls();


    /*
     * PDF stays visible.
     */

    loadActivePDF();

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(message) {

    if (!loginError) {

        return;

    }


    loginError.textContent =
        message;

}


/* =========================================================
   CLEAR LOGIN ERROR
========================================================= */

function clearLoginError() {

    if (!loginError) {

        return;

    }


    loginError.textContent =
        "";

}


/* =========================================================
   LOGIN BUTTON STATE
========================================================= */

function setLoginLoading(loading) {

    if (!loginButton) {

        return;

    }


    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "Logging in..."
            : "Login";

}


/* =========================================================
   LOGIN ERROR MESSAGE
========================================================= */

function getLoginErrorMessage(error) {

    if (!error) {

        return "Login failed.";

    }


    const message =
        error.message || "";

    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }


    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "Your email has not been confirmed.";

    }


    return (
        message ||
        "Unable to login."
    );

}


/* =========================================================
   CHAT ENABLE
========================================================= */

function enableChatControls() {

    if (messageInput) {

        messageInput.disabled =
            false;

        messageInput.placeholder =
            "Type a message...";

    }


    if (sendButton) {

        sendButton.disabled =
            false;

    }


    if (codeButton) {

        codeButton.disabled =
            false;

    }

}


/* =========================================================
   CHAT DISABLE
========================================================= */

function disableChatControls() {

    if (messageInput) {

        messageInput.disabled =
            true;

        messageInput.placeholder =
            "Login to send a message...";

    }


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    if (codeButton) {

        codeButton.disabled =
            true;

    }

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

    if (!messagesContainer) {

        return;

    }


    setStatus(
        "Loading..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .select("*")
                .gt(
                    "expires_at",
                    new Date().toISOString()
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Load messages error:",
                error
            );

            setStatus(
                "Database error"
            );

            return;

        }


        messagesContainer.innerHTML =
            "";


        if (
            !data ||
            data.length === 0
        ) {

            showEmptyState();

        } else {

            data.forEach(
                addMessage
            );

        }


        setStatus(
            "Online"
        );


        scrollToBottom();


    } catch (error) {

        console.error(
            "Unexpected message load error:",
            error
        );

        setStatus(
            "Database error"
        );

    }

}


/* =========================================================
   REALTIME MESSAGES
========================================================= */

function subscribeToMessages() {

    if (realtimeChannel) {

        supabaseClient.removeChannel(
            realtimeChannel
        );

        realtimeChannel =
            null;

    }


    realtimeChannel =
        supabaseClient
            .channel(
                "labchat-messages"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "messages"
                },
                (payload) => {

                    console.log(
                        "New message:",
                        payload.new
                    );


                    addMessage(
                        payload.new
                    );


                    scrollToBottom();

                }
            )
            .subscribe(
                (status) => {

                    console.log(
                        "Realtime:",
                        status
                    );


                    if (
                        status ===
                        "SUBSCRIBED"
                    ) {

                        setStatus(
                            "Online"
                        );

                    }

                    else if (
                        status ===
                        "CHANNEL_ERROR"
                    ) {

                        setStatus(
                            "Realtime unavailable"
                        );

                    }

                    else if (
                        status ===
                        "TIMED_OUT"
                    ) {

                        setStatus(
                            "Realtime timeout"
                        );

                    }

                }
            );

}


/* =========================================================
   PUBLIC PDF
========================================================= */

async function loadActivePDF() {

    console.log(
        "Loading public PDF..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pdf_documents")
                .select(
                    "file_name, github_url"
                )
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if (error) {

            console.error(
                "Public PDF load error:",
                error
            );

            showPdfError(
                "Unable to load the document."
            );

            return;

        }


        if (!data) {

            showPdfError(
                "No active document is available."
            );

            return;

        }


        if (!data.github_url) {

            showPdfError(
                "The active document has no PDF URL."
            );

            return;

        }


        if (pdfDocument) {

            try {

                pdfDocument.destroy();

            } catch (error) {

                console.error(
                    "Previous PDF cleanup error:",
                    error
                );

            }

            pdfDocument =
                null;

        }


        activePdfUrl =
            data.github_url;


        if (pdfDocumentTitle) {

            pdfDocumentTitle.textContent =
                data.file_name ||
                "Lab Document";

        }


        hidePdfError();


        await openPdfDocument(
            activePdfUrl
        );


    } catch (error) {

        console.error(
            "Unexpected PDF error:",
            error
        );

        showPdfError(
            "Unable to load the document."
        );

    }

}


/* =========================================================
   OPEN PDF DOCUMENT
========================================================= */

async function openPdfDocument(url) {

    if (!url) {

        return;

    }


    if (pdfLoading) {

        pdfLoading.classList.remove(
            "hidden"
        );

    }


    try {

        const loadingTask =
            getDocument({
                url: url
            });


        pdfDocument =
            await loadingTask.promise;


        currentPdfPage =
            1;


        pdfScale =
            1;


        updatePdfPageControls();

        updatePdfZoomDisplay();


        if (pdfLoading) {

            pdfLoading.classList.add(
                "hidden"
            );

        }


        await fitPdfToViewport();


        console.log(
            "PDF loaded:",
            pdfDocument.numPages,
            "pages"
        );


    } catch (error) {

        console.error(
            "PDF.js loading error:",
            error
        );


        if (pdfLoading) {

            pdfLoading.classList.add(
                "hidden"
            );

        }


        showPdfError(
            "The document could not be opened."
        );

    }

}


/* =========================================================
   SHOW PDF PAGE
========================================================= */

async function showPdfPage(pageNumber) {

    if (!pdfDocument) {

        return;

    }


    if (
        pageNumber < 1 ||
        pageNumber >
            pdfDocument.numPages
    ) {

        return;

    }


    currentPdfPage =
        pageNumber;


    updatePdfPageControls();


    await renderPdfPage(
        currentPdfPage
    );

}


/* =========================================================
   RENDER PDF PAGE
========================================================= */

async function renderPdfPage(pageNumber) {

    if (!pdfDocument) {

        return;

    }


    if (pdfRendering) {

        pdfPendingPage =
            pageNumber;

        return;

    }


    pdfRendering =
        true;


    try {

        const page =
            await pdfDocument.getPage(
                pageNumber
            );


        const viewport =
            page.getViewport({
                scale:
                    pdfScale
            });


        if (pdfPages) {

            pdfPages.innerHTML =
                "";


            const pageContainer =
                document.createElement(
                    "div"
                );


            pageContainer.className =
                "pdf-page";


            pageContainer.style.width =
                `${viewport.width}px`;


            pageContainer.style.height =
                `${viewport.height}px`;


            const canvas =
                document.createElement(
                    "canvas"
                );


            const context =
                canvas.getContext(
                    "2d"
                );


            const deviceScale =
                window.devicePixelRatio ||
                1;


            canvas.width =
                viewport.width *
                deviceScale;


            canvas.height =
                viewport.height *
                deviceScale;


            canvas.style.width =
                `${viewport.width}px`;


            canvas.style.height =
                `${viewport.height}px`;


            context.scale(
                deviceScale,
                deviceScale
            );


            pageContainer.appendChild(
                canvas
            );


            pdfPages.appendChild(
                pageContainer
            );


            await page.render(
                {
                    canvasContext:
                        context,

                    viewport:
                        viewport
                }
            ).promise;


            if (pdfViewport) {

                pdfViewport.scrollTop =
                    0;

                pdfViewport.scrollLeft =
                    0;

            }

        }


    } catch (error) {

        console.error(
            "PDF render error:",
            error
        );

        showPdfError(
            "Unable to render this page."
        );

    } finally {

        pdfRendering =
            false;


        if (
            pdfPendingPage !== null
        ) {

            const pending =
                pdfPendingPage;

            pdfPendingPage =
                null;

            renderPdfPage(
                pending
            );

        }

    }

}


/* =========================================================
   FIT PDF
========================================================= */

async function fitPdfToViewport() {

    if (
        !pdfDocument ||
        !pdfViewport
    ) {

        return;

    }


    try {

        const page =
            await pdfDocument.getPage(
                currentPdfPage
            );


        const unscaled =
            page.getViewport({
                scale:
                    1
            });


        const availableWidth =
            pdfViewport.clientWidth -
            40;


        const availableHeight =
            pdfViewport.clientHeight -
            40;


        const widthScale =
            availableWidth /
            unscaled.width;


        const heightScale =
            availableHeight /
            unscaled.height;


        pdfScale =
            Math.min(
                widthScale,
                heightScale
            );


        pdfScale =
            Math.max(
                0.5,
                Math.min(
                    pdfScale,
                    3
                )
            );


        updatePdfZoomDisplay();


        await renderPdfPage(
            currentPdfPage
        );


    } catch (error) {

        console.error(
            "PDF fit error:",
            error
        );

    }

}


/* =========================================================
   PDF PAGE CONTROLS
========================================================= */

function updatePdfPageControls() {

    if (pdfPageNumber) {

        const total =
            pdfDocument
                ? pdfDocument.numPages
                : 1;


        pdfPageNumber.textContent =
            `${currentPdfPage} / ${total}`;

    }


    if (pdfPreviousButton) {

        pdfPreviousButton.disabled =
            !pdfDocument ||
            currentPdfPage <= 1;

    }


    if (pdfNextButton) {

        pdfNextButton.disabled =
            !pdfDocument ||
            currentPdfPage >=
                pdfDocument.numPages;

    }

}


/* =========================================================
   PDF ZOOM DISPLAY
========================================================= */

function updatePdfZoomDisplay() {

    if (!pdfZoomValue) {

        return;

    }


    pdfZoomValue.textContent =
        `${Math.round(
            pdfScale * 100
        )}%`;

}


/* =========================================================
   PDF ERROR
========================================================= */

function showPdfError(message) {

    if (pdfLoading) {

        pdfLoading.classList.add(
            "hidden"
        );

    }


    if (pdfErrorMessage) {

        pdfErrorMessage.textContent =
            message;

    }


    if (pdfError) {

        pdfError.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   HIDE PDF ERROR
========================================================= */

function hidePdfError() {

    if (pdfError) {

        pdfError.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PRESENCE
========================================================= */

function startPresence() {

    if (!currentProfile) {

        return;

    }


    if (presenceChannel) {

        supabaseClient.removeChannel(
            presenceChannel
        );

        presenceChannel =
            null;

    }


    presenceChannel =
        supabaseClient.channel(
            "labchat-online-users",
            {
                config: {

                    presence: {

                        key:
                            userSessionId

                    }

                }

            }
        );


    presenceChannel.on(
        "presence",
        {
            event:
                "sync"
        },
        updateOnlineCount
    );


    presenceChannel.on(
        "presence",
        {
            event:
                "join"
        },
        updateOnlineCount
    );


    presenceChannel.on(
        "presence",
        {
            event:
                "leave"
        },
        updateOnlineCount
    );


    presenceChannel.subscribe(
        async (status) => {

            if (
                status ===
                "SUBSCRIBED"
            ) {

                try {

                    await presenceChannel.track(
                        {
                            username:
                                currentProfile.username,

                            user_id:
                                currentProfile.id
                        }
                    );


                    updateOnlineCount();


                } catch (error) {

                    console.error(
                        "Presence tracking error:",
                        error
                    );

                }

            }

        }
    );

}


/* =========================================================
   ONLINE COUNT
========================================================= */

function updateOnlineCount() {

    if (
        !presenceChannel ||
        !onlineCount
    ) {

        return;

    }


    const state =
        presenceChannel.presenceState();


    const uniqueUsers =
        new Set();


    Object.values(state)
        .forEach(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.username
                        ) {

                            uniqueUsers.add(
                                entry.username
                            );

                        }

                    }
                );

            }
        );


    const count =
        uniqueUsers.size;


    onlineCount.textContent =
        `${count} ${
            count === 1
                ? "user"
                : "users"
        } online`;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function handleMessageSubmit(event) {

    event.preventDefault();


    if (!currentUser) {

        openLogin();

        return;

    }


    if (!messageInput) {

        return;

    }


    const text =
        messageInput.value;


    if (!text.trim()) {

        return;

    }


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("messages")
                .insert(
                    {
                        username:
                            currentProfile.username,

                        message:
                            text,

                        is_code:
                            isCodeMode
                    }
                );


        if (error) {

            console.error(
                "Send message error:",
                error
            );

            alert(
                "Message could not be sent."
            );

            return;

        }


        messageInput.value =
            "";


        autoResizeTextarea();


        messageInput.focus();


    } catch (error) {

        console.error(
            "Unexpected send error:",
            error
        );

        alert(
            "Message could not be sent."
        );


    } finally {

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }

}


/* =========================================================
   MESSAGE KEYBOARD
========================================================= */

function handleMessageKeydown(event) {

    /*
     * Normal mode:
     *
     * Enter = send
     * Shift + Enter = newline
     */

    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !isCodeMode
    ) {

        event.preventDefault();


        if (messageForm) {

            messageForm.requestSubmit();

        }


        return;

    }


    /*
     * Code mode:
     *
     * Enter = newline
     * Ctrl + Enter = send
     */

    if (
        event.key === "Enter" &&
        event.ctrlKey &&
        isCodeMode
    ) {

        event.preventDefault();


        if (messageForm) {

            messageForm.requestSubmit();

        }

    }

}


/* =========================================================
   CODE MODE
========================================================= */

function toggleCodeMode() {

    if (!currentUser) {

        openLogin();

        return;

    }


    isCodeMode =
        !isCodeMode;


    if (isCodeMode) {

        if (codeButton) {

            codeButton.classList.add(
                "active"
            );

        }


        if (codeIndicator) {

            codeIndicator.classList.remove(
                "hidden"
            );

        }


        if (messageInput) {

            messageInput.placeholder =
                "Write your code here...";

        }

    }


    else {

        if (codeButton) {

            codeButton.classList.remove(
                "active"
            );

        }


        if (codeIndicator) {

            codeIndicator.classList.add(
                "hidden"
            );

        }


        if (messageInput) {

            messageInput.placeholder =
                "Type a message...";

        }

    }


    if (messageInput) {

        messageInput.focus();

    }

}


/* =========================================================
   DISPLAY MESSAGE
========================================================= */

function addMessage(message) {

    if (
        !message ||
        !messagesContainer
    ) {

        return;

    }


    const expires =
        new Date(
            message.expires_at
        );


    if (
        Number.isNaN(
            expires.getTime()
        ) ||
        expires <= new Date()
    ) {

        return;

    }


    if (
        document.querySelector(
            `[data-message-id="${message.id}"]`
        )
    ) {

        return;

    }


    removeEmptyState();


    const messageElement =
        document.createElement(
            "article"
        );


    messageElement.className =
        "message";


    messageElement.dataset.messageId =
        message.id;


    if (
        currentProfile &&
        message.username ===
            currentProfile.username
    ) {

        messageElement.classList.add(
            "mine"
        );

    }


    /*
     * CODE MESSAGE
     */

    if (message.is_code) {

        messageElement.classList.add(
            "code-message"
        );


        const codeHeader =
            document.createElement(
                "div"
            );


        codeHeader.className =
            "code-header";


        const codeAuthor =
            document.createElement(
                "span"
            );


        codeAuthor.textContent =
            `${message.username} • ${formatTime(
                message.created_at
            )}`;


        const copyButton =
            createCopyButton(
                message.message,
                "Copy Code"
            );


        codeHeader.appendChild(
            codeAuthor
        );


        codeHeader.appendChild(
            copyButton
        );


        const codeContent =
            document.createElement(
                "pre"
            );


        codeContent.className =
            "code-content";


        codeContent.textContent =
            message.message;


        messageElement.appendChild(
            codeHeader
        );


        messageElement.appendChild(
            codeContent
        );

    }


    /*
     * NORMAL MESSAGE
     */

    else {

        const header =
            document.createElement(
                "div"
            );


        header.className =
            "message-header";


        const username =
            document.createElement(
                "span"
            );


        username.className =
            "message-user";


        username.textContent =
            message.username;


        const time =
            document.createElement(
                "span"
            );


        time.className =
            "message-time";


        time.textContent =
            formatTime(
                message.created_at
            );


        header.appendChild(
            username
        );


        header.appendChild(
            time
        );


        const text =
            document.createElement(
                "div"
            );


        text.className =
            "message-text";


        text.textContent =
            message.message;


        linkify(
            text
        );


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        const copyButton =
            createCopyButton(
                message.message,
                "Copy"
            );


        actions.appendChild(
            copyButton
        );


        messageElement.appendChild(
            header
        );


        messageElement.appendChild(
            text
        );


        messageElement.appendChild(
            actions
        );

    }


    messagesContainer.appendChild(
        messageElement
    );


    /*
     * Automatic five-minute removal.
     */

    const remaining =
        expires.getTime() -
        Date.now();


    if (
        remaining > 0
    ) {

        setTimeout(
            () => {

                if (
                    messageElement.isConnected
                ) {

                    messageElement.remove();

                }


                if (
                    messagesContainer
                        .children.length === 0
                ) {

                    showEmptyState();

                }

            },
            remaining
        );

    }

}


/* =========================================================
   COPY BUTTON
========================================================= */

function createCopyButton(
    text,
    label
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "copy-button";


    button.textContent =
        label;


    button.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard
                    .writeText(
                        text
                    );


                button.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        button.textContent =
                            label;

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );


                button.textContent =
                    "Copy failed";

            }

        }
    );


    return button;

}


/* =========================================================
   LINKIFY
========================================================= */

function linkify(element) {

    if (!element) {

        return;

    }


    const text =
        element.textContent;


    const urlRegex =
        /(https?:\/\/[^\s]+)/g;


    const parts =
        text.split(
            urlRegex
        );


    element.textContent =
        "";


    parts.forEach(
        (part) => {

            if (
                /^https?:\/\//i.test(
                    part
                )
            ) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    part;


                link.textContent =
                    part;


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                element.appendChild(
                    link
                );

            }

            else {

                element.appendChild(
                    document.createTextNode(
                        part
                    )
                );

            }

        }
    );

}


/* =========================================================
   TIME
========================================================= */

function formatTime(timestamp) {

    return new Date(
        timestamp
    ).toLocaleTimeString(
        [],
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    if (!messagesContainer) {

        return;

    }


    if (
        messagesContainer.querySelector(
            ".empty-state"
        )
    ) {

        return;

    }


    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "empty-state";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        "No messages yet";


    const subtitle =
        document.createTextNode(
            "Start the conversation."
        );


    empty.appendChild(
        title
    );


    empty.appendChild(
        subtitle
    );


    messagesContainer.appendChild(
        empty
    );

}


/* =========================================================
   REMOVE EMPTY STATE
========================================================= */

function removeEmptyState() {

    if (!messagesContainer) {

        return;

    }


    const empty =
        messagesContainer.querySelector(
            ".empty-state"
        );


    if (empty) {

        empty.remove();

    }

}


/* =========================================================
   STATUS
========================================================= */

function setStatus(status) {

    if (!connectionStatus) {

        return;

    }


    connectionStatus.textContent =
        status;

}


/* =========================================================
   TEXTAREA AUTO RESIZE
========================================================= */

function autoResizeTextarea() {

    if (!messageInput) {

        return;

    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            220
        ) + "px";

}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom() {

    if (!messagesContainer) {

        return;

    }


    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}


/* =========================================================
   SIGN OUT
========================================================= */

async function leaveChat() {

    console.log(
        "Signing out..."
    );


    try {

        if (presenceChannel) {

            try {

                await presenceChannel.untrack();

            } catch (error) {

                console.error(
                    "Presence untrack error:",
                    error
                );

            }


            await supabaseClient
                .removeChannel(
                    presenceChannel
                );


            presenceChannel =
                null;

        }


        if (realtimeChannel) {

            await supabaseClient
                .removeChannel(
                    realtimeChannel
                );


            realtimeChannel =
                null;

        }


        await supabaseClient.auth
            .signOut();


    } catch (error) {

        console.error(
            "Sign out error:",
            error
        );

    }

}


/* =========================================================
   RESET AFTER SIGN OUT
========================================================= */

async function resetLabChat() {

    console.log(
        "Resetting LabChat..."
    );


    currentUser =
        null;

    currentProfile =
        null;

    isCodeMode =
        false;


    if (currentUserElement) {

        currentUserElement.textContent =
            "Guest";

    }


    if (messagesContainer) {

        messagesContainer.innerHTML =
            "";

    }


    if (codeButton) {

        codeButton.classList.remove(
            "active"
        );

    }


    if (codeIndicator) {

        codeIndicator.classList.add(
            "hidden"
        );

    }


    if (messageInput) {

        messageInput.value =
            "";

        messageInput.placeholder =
            "Login to send a message...";

    }


    if (onlineCount) {

        onlineCount.textContent =
            "0 online";

    }


    disableChatControls();


    setStatus(
        "Signed out"
    );


    /*
     * PDF remains public.
     */

    if (
        !pdfDocument &&
        activePdfUrl
    ) {

        await openPdfDocument(
            activePdfUrl
        );

    }


    openLogin();

}


/* =========================================================
   PAGE CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (presenceChannel) {

            try {

                presenceChannel.untrack();

            } catch (error) {

                console.error(
                    "Presence cleanup error:",
                    error
                );

            }

        }

    }
);
