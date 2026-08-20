/* =========================================================
   LABCHAT
   Main Client Application
========================================================= */


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
   PUBLIC PDF CONFIG
========================================================= */

/*
 * GitHub repository:
 *
 * Paraallax/labchat
 *
 * Exact commit:
 *
 * c985342d44c142b7a1c581fb632e1e8bb2a3f75a
 *
 * PDF:
 *
 * XI-AI-UNIT-3-Python-Programming.pdf
 */

const PDF_URL =
    "https://raw.githubusercontent.com/Paraallax/labchat/c985342d44c142b7a1c581fb632e1e8bb2a3f75a/XI-AI-UNIT-3-Python-Programming.pdf";


const PDF_TITLE =
    "XI AI Unit 3 - Python Programming";


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

let pdfjsLib = null;

let pdfDocument = null;

let pdfCurrentPage = 1;

let pdfScale = 1;

let pdfRendering = false;

let pdfPendingPage = null;

let pdfFitScale = 1;


/* =========================================================
   DOM ELEMENTS
========================================================= */


/* ---------------------------------------------------------
   LOGIN
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   CHAT
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   PDF VIEWER
--------------------------------------------------------- */

const pdfViewerScreen =
    document.getElementById(
        "pdfViewerScreen"
    );


const pdfPreviousButton =
    document.getElementById(
        "pdfPreviousButton"
    );


const pdfPageNumber =
    document.getElementById(
        "pdfPageNumber"
    );


const pdfNextButton =
    document.getElementById(
        "pdfNextButton"
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


    /*
     * Set up UI controls.
     */

    setupLoginControls();

    setupMessageControls();

    setupKeyboardShortcuts();

    setupPDFControls();

    disableChatControls();


    /*
     * IMPORTANT
     *
     * The PDF is PUBLIC.
     *
     * It must load before authentication.
     */

    await loadPublicPDF();


    /*
     * Restore Supabase authentication.
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

    /*
     * Login form.
     */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /*
     * Close button.
     */

    if (closeLoginButton) {

        closeLoginButton.addEventListener(
            "click",
            closeLogin
        );

    }


    /*
     * Clicking outside modal closes login.
     */

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
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Ctrl + Shift + L
             *
             * Opens login popup.
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
             *
             * Close login popup.
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

        }
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

    setLoginLoading(
        true
    );


    /*
     * Supabase Auth requires
     * an email address.
     */

    if (
        !identifier.includes("@")
    ) {

        showLoginError(
            "Please use your Supabase Auth email."
        );

        setLoginLoading(
            false
        );

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


            setLoginLoading(
                false
            );

            return;
        }


        if (
            !data ||
            !data.user
        ) {

            showLoginError(
                "Login failed. Please try again."
            );


            setLoginLoading(
                false
            );

            return;
        }


        const success =
            await loadUserProfile(
                data.user
            );


        if (!success) {

            await supabaseClient.auth.signOut();

            setLoginLoading(
                false
            );

            return;
        }


        loginPassword.value =
            "";


        setLoginLoading(
            false
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );


        showLoginError(
            "An unexpected error occurred."
        );


        setLoginLoading(
            false
        );

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


        /*
         * No existing session.
         *
         * PDF remains visible.
         */

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


        /*
         * Existing session.
         */

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
         *
         * Keep authentication support,
         * but do not change the PDF system.
         */

        if (
            data.role ===
            "admin"
        ) {

            console.log(
                "Admin login detected."
            );


            window.location.href =
                "admin.html";


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


        /*
         * Update username.
         */

        if (currentUserElement) {

            currentUserElement.textContent =
                data.username;

        }


        /*
         * Close login.
         */

        closeLogin();


        /*
         * The PDF remains available.
         *
         * The chat becomes available
         * after successful login.
         */

        if (chatScreen) {

            chatScreen.classList.remove(
                "hidden"
            );

        }


        enableChatControls();


        setStatus(
            "Loading..."
        );


        /*
         * Load chat.
         */

        await loadMessages();

        subscribeToMessages();

        startPresence();


        /*
         * Focus message box.
         */

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
     * PDF remains visible.
     */

    if (pdfViewerScreen) {

        pdfViewerScreen.classList.remove(
            "hidden"
        );

    }


    /*
     * Chat remains hidden until login.
     */

    if (chatScreen) {

        chatScreen.classList.add(
            "hidden"
        );

    }

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
   CHAT ENABLE / DISABLE
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
   DISABLE CHAT
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
   PDF CONTROLS
========================================================= */

function setupPDFControls() {

    if (pdfPreviousButton) {

        pdfPreviousButton.addEventListener(
            "click",
            () => {

                if (
                    pdfCurrentPage <= 1
                ) {

                    return;

                }


                pdfCurrentPage--;

                queuePDFRender(
                    pdfCurrentPage
                );

            }
        );

    }


    if (pdfNextButton) {

        pdfNextButton.addEventListener(
            "click",
            () => {

                if (
                    !pdfDocument ||
                    pdfCurrentPage >=
                        pdfDocument.numPages
                ) {

                    return;

                }


                pdfCurrentPage++;

                queuePDFRender(
                    pdfCurrentPage
                );

            }
        );

    }


    if (pdfZoomOutButton) {

        pdfZoomOutButton.addEventListener(
            "click",
            () => {

                setPDFZoom(
                    pdfScale - 0.1
                );

            }
        );

    }


    if (pdfZoomInButton) {

        pdfZoomInButton.addEventListener(
            "click",
            () => {

                setPDFZoom(
                    pdfScale + 0.1
                );

            }
        );

    }


    if (pdfFitButton) {

        pdfFitButton.addEventListener(
            "click",
            fitPDFPage
        );

    }


    /*
     * Recalculate fit size when
     * browser window changes.
     */

    window.addEventListener(
        "resize",
        () => {

            if (
                pdfDocument
            ) {

                fitPDFPage();

            }

        }
    );

}


/* =========================================================
   LOAD PDF.JS
========================================================= */

async function loadPDFJS() {

    if (pdfjsLib) {

        return pdfjsLib;

    }


    /*
     * Dynamically import PDF.js.
     *
     * This means index.html does not
     * need a PDF.js <script> tag.
     */

    pdfjsLib =
        await import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs"
        );


    /*
     * PDF.js worker.
     */

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";


    return pdfjsLib;

}


/* =========================================================
   LOAD PUBLIC PDF
========================================================= */

async function loadPublicPDF() {

    console.log(
        "Loading public PDF:",
        PDF_URL
    );


    if (!pdfViewerScreen) {

        console.error(
            "pdfViewerScreen not found."
        );


        return;

    }


    if (!pdfPages) {

        console.error(
            "pdfPages not found."
        );


        return;

    }


    /*
     * Set title immediately.
     */

    if (pdfDocumentTitle) {

        pdfDocumentTitle.textContent =
            PDF_TITLE;

    }


    /*
     * Show loading state.
     */

    showPDFLoading();


    hidePDFError();


    try {

        /*
         * Load PDF.js.
         */

        const pdfjs =
            await loadPDFJS();


        console.log(
            "PDF.js loaded."
        );


        /*
         * Load document.
         */

        const loadingTask =
            pdfjs.getDocument(
                {
                    url:
                        PDF_URL
                }
            );


        pdfDocument =
            await loadingTask.promise;


        console.log(
            "PDF loaded successfully.",
            "Pages:",
            pdfDocument.numPages
        );


        /*
         * Start at page 1.
         */

        pdfCurrentPage =
            1;


        /*
         * Reset scale.
         */

        pdfScale =
            1;


        /*
         * Update page counter.
         */

        updatePDFPageNumber();


        /*
         * Render first page.
         */

        await renderPDFPage(
            pdfCurrentPage
        );


        /*
         * Fit page after initial
         * rendering.
         */

        await fitPDFPage();


        /*
         * PDF is ready.
         */

        hidePDFLoading();


        updatePDFControls();


        console.log(
            "Public PDF viewer ready."
        );


    } catch (error) {

        console.error(
            "PDF loading error:",
            error
        );


        hidePDFLoading();


        showPDFError(
            getPDFErrorMessage(
                error
            )
        );

    }

}


/* =========================================================
   RENDER PDF PAGE
========================================================= */

async function renderPDFPage(pageNumber) {

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


        /*
         * Get viewport.
         */

        const viewport =
            page.getViewport(
                {
                    scale:
                        pdfScale
                }
            );


        /*
         * Clear current page.
         */

        pdfPages.innerHTML =
            "";


        /*
         * Page wrapper.
         */

        const pageContainer =
            document.createElement(
                "div"
            );


        pageContainer.className =
            "pdf-page";


        /*
         * Canvas.
         */

        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.className =
            "pdf-canvas";


        const context =
            canvas.getContext(
                "2d"
            );


        /*
         * High-DPI rendering.
         */

        const outputScale =
            window.devicePixelRatio ||
            1;


        canvas.width =
            Math.floor(
                viewport.width *
                outputScale
            );


        canvas.height =
            Math.floor(
                viewport.height *
                outputScale
            );


        canvas.style.width =
            `${viewport.width}px`;


        canvas.style.height =
            `${viewport.height}px`;


        pageContainer.appendChild(
            canvas
        );


        pdfPages.appendChild(
            pageContainer
        );


        /*
         * Render.
         */

        const renderContext = {

            canvasContext:
                context,

            viewport:
                viewport,

            transform:
                outputScale !== 1
                    ? [
                        outputScale,
                        0,
                        0,
                        outputScale,
                        0,
                        0
                    ]
                    : null

        };


        await page.render(
            renderContext
        ).promise;


        updatePDFPageNumber();

        updatePDFControls();


    } catch (error) {

        console.error(
            "PDF page render error:",
            error
        );


        showPDFError(
            "Unable to render this page."
        );

    } finally {

        pdfRendering =
            false;


        /*
         * If another page was requested
         * while rendering, render it now.
         */

        if (
            pdfPendingPage !== null
        ) {

            const pendingPage =
                pdfPendingPage;


            pdfPendingPage =
                null;


            renderPDFPage(
                pendingPage
            );

        }

    }

}


/* =========================================================
   QUEUE PDF RENDER
========================================================= */

function queuePDFRender(pageNumber) {

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


    pdfCurrentPage =
        pageNumber;


    renderPDFPage(
        pageNumber
    );

}


/* =========================================================
   SET PDF ZOOM
========================================================= */

function setPDFZoom(newScale) {

    /*
     * Minimum zoom:
     * 50%
     */

    newScale =
        Math.max(
            0.5,
            newScale
        );


    /*
     * Maximum zoom:
     * 300%
     */

    newScale =
        Math.min(
            3,
            newScale
        );


    /*
     * Round to nearest 10%.
     */

    newScale =
        Math.round(
            newScale * 10
        ) / 10;


    pdfScale =
        newScale;


    updatePDFZoomValue();


    queuePDFRender(
        pdfCurrentPage
    );

}


/* =========================================================
   FIT PDF PAGE
========================================================= */

async function fitPDFPage() {

    if (
        !pdfDocument ||
        !pdfViewport
    ) {

        return;

    }


    try {

        const page =
            await pdfDocument.getPage(
                pdfCurrentPage
            );


        /*
         * Get page at scale 1.
         */

        const baseViewport =
            page.getViewport(
                {
                    scale:
                        1
                }
            );


        /*
         * Available viewport space.
         */

        const horizontalPadding =
            40;


        const verticalPadding =
            40;


        const availableWidth =
            Math.max(
                100,
                pdfViewport.clientWidth -
                    horizontalPadding
            );


        const availableHeight =
            Math.max(
                100,
                pdfViewport.clientHeight -
                    verticalPadding
            );


        /*
         * Calculate scale.
         */

        const widthScale =
            availableWidth /
            baseViewport.width;


        const heightScale =
            availableHeight /
            baseViewport.height;


        pdfFitScale =
            Math.min(
                widthScale,
                heightScale
            );


        /*
         * Keep fit scale reasonable.
         */

        pdfFitScale =
            Math.max(
                0.5,
                Math.min(
                    3,
                    pdfFitScale
                )
            );


        pdfScale =
            pdfFitScale;


        updatePDFZoomValue();


        await renderPDFPage(
            pdfCurrentPage
        );


    } catch (error) {

        console.error(
            "PDF fit error:",
            error
        );

    }

}


/* =========================================================
   UPDATE PDF PAGE NUMBER
========================================================= */

function updatePDFPageNumber() {

    if (!pdfPageNumber) {

        return;

    }


    const totalPages =
        pdfDocument
            ? pdfDocument.numPages
            : 1;


    pdfPageNumber.textContent =
        `${pdfCurrentPage} / ${totalPages}`;

}


/* =========================================================
   UPDATE PDF ZOOM VALUE
========================================================= */

function updatePDFZoomValue() {

    if (!pdfZoomValue) {

        return;

    }


    const percentage =
        Math.round(
            pdfScale * 100
        );


    pdfZoomValue.textContent =
        `${percentage}%`;

}


/* =========================================================
   UPDATE PDF BUTTONS
========================================================= */

function updatePDFControls() {

    if (pdfPreviousButton) {

        pdfPreviousButton.disabled =
            !pdfDocument ||
            pdfCurrentPage <= 1;

    }


    if (pdfNextButton) {

        pdfNextButton.disabled =
            !pdfDocument ||
            pdfCurrentPage >=
                pdfDocument.numPages;

    }


    updatePDFPageNumber();

    updatePDFZoomValue();

}


/* =========================================================
   PDF LOADING STATE
========================================================= */

function showPDFLoading() {

    if (pdfLoading) {

        pdfLoading.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   HIDE PDF LOADING
========================================================= */

function hidePDFLoading() {

    if (pdfLoading) {

        pdfLoading.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PDF ERROR
========================================================= */

function showPDFError(message) {

    if (!pdfError) {

        return;

    }


    if (pdfErrorMessage) {

        pdfErrorMessage.textContent =
            message;

    }


    pdfError.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE PDF ERROR
========================================================= */

function hidePDFError() {

    if (pdfError) {

        pdfError.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PDF ERROR MESSAGE
========================================================= */

function getPDFErrorMessage(error) {

    if (!error) {

        return "Please try again.";

    }


    console.error(
        "PDF error details:",
        error
    );


    if (
        error.name ===
        "InvalidPDFException"
    ) {

        return "The document is not a valid PDF.";

    }


    if (
        error.name ===
        "MissingPDFException"
    ) {

        return "The PDF file could not be found.";

    }


    if (
        error.name ===
        "UnexpectedResponseException"
    ) {

        return "The PDF server returned an unexpected response.";

    }


    return (
        "The document could not be loaded. Please try again."
    );

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
                        ascending:
                            true
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
   UPDATE ONLINE COUNT
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


    /*
     * Prevent duplicates.
     */

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
     * Automatic 5-minute expiration.
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
                        .children
                        .length === 0
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

        /*
         * Stop presence.
         */

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


        /*
         * Remove realtime.
         */

        if (realtimeChannel) {

            await supabaseClient
                .removeChannel(
                    realtimeChannel
                );


            realtimeChannel =
                null;

        }


        /*
         * Supabase sign out.
         */

        await supabaseClient.auth.signOut();


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


    /*
     * Guest UI.
     */

    if (currentUserElement) {

        currentUserElement.textContent =
            "Guest";

    }


    /*
     * Hide chat.
     */

    if (chatScreen) {

        chatScreen.classList.add(
            "hidden"
        );

    }


    /*
     * Keep PDF visible.
     */

    if (pdfViewerScreen) {

        pdfViewerScreen.classList.remove(
            "hidden"
        );

    }


    /*
     * Clear chat.
     */

    if (messagesContainer) {

        messagesContainer.innerHTML =
            "";

    }


    /*
     * Reset code mode.
     */

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


    /*
     * Reset message input.
     */

    if (messageInput) {

        messageInput.value =
            "";

        messageInput.placeholder =
            "Login to send a message...";

    }


    /*
     * Reset online count.
     */

    if (onlineCount) {

        onlineCount.textContent =
            "0 online";

    }


    disableChatControls();


    setStatus(
        "Signed out"
    );


    /*
     * Open login popup.
     */

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
