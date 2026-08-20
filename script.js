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
   PDF CONFIG
========================================================= */

const PDF_FILE =
    "XI-AI-UNIT-3-Python-Programming.pdf";

const PDFJS_VERSION =
    "5.4.54";

const PDFJS_URL =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;

const PDFJS_WORKER_URL =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let realtimeChannel = null;
let presenceChannel = null;

let isCodeMode = false;


/* =========================================================
   LABCHAT SESSION STATE
========================================================= */

/*
 * This session ID belongs to THIS browser tab.
 *
 * sessionStorage survives:
 * - page refresh
 * - navigation within the same tab
 *
 * sessionStorage disappears when:
 * - the tab is closed
 *
 * Therefore:
 *
 * SAME TAB + REFRESH
 *     = same session ID
 *
 * NEW TAB
 *     = new session ID
 */

const TAB_SESSION_KEY =
    "labchat_tab_session";

const TAB_SESSION_VALUE =
    "active";


/*
 * Actual LabChat account session ID.
 */
const SESSION_ID_KEY =
    "labchat_session_id";


/*
 * Database heartbeat interval.
 *
 * The SQL function considers a session inactive
 * after 60 seconds.
 *
 * We update every 20 seconds.
 */
const SESSION_HEARTBEAT_INTERVAL =
    20 * 1000;


let userSessionId = null;

let sessionHeartbeatTimer = null;


/*
 * Admin tab session.
 */
const ADMIN_TAB_SESSION_KEY =
    "labchat_admin_tab_session";


/* =========================================================
   PDF STATE
========================================================= */

let pdfjsLib = null;
let pdfDocument = null;

let pdfCurrentPage = 1;
let pdfZoom = 1;

let pdfFitMode = true;

let pdfPageObserver = null;

let pdfRenderToken = 0;

let pdfInitialized = false;


/* =========================================================
   MESSAGE EXPIRY TIMERS
========================================================= */

const messageTimers =
    new Map();


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


/* ---------- LOGIN ---------- */

const loginOverlay =
    document.getElementById(
        "loginOverlay"
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


/* ---------- CHAT ---------- */

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
        "Loading..."
    );

    setupLoginControls();

    setupMessageControls();

    setupPDFControls();

    setupKeyboardShortcuts();

    disableChatControls();


    /*
     * PDF is public.
     *
     * Initialize it before authentication.
     */

    await initializePDFViewer();


    /*
     * Restore authentication.
     */

    await restoreSession();


    /*
     * Listen for authentication changes.
     */

    setupAuthListener();


    console.log(
        "LabChat initialization complete."
    );
}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    supabaseClient.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            /*
             * Real sign-out.
             */

            if (
                event ===
                "SIGNED_OUT"
            ) {

                await resetLabChat(
                    false
                );

                return;
            }


            /*
             * New sign-in.
             */

            if (
                event ===
                "SIGNED_IN" &&
                session
            ) {

                /*
                 * Do not repeatedly load the
                 * same profile.
                 */

                if (
                    currentProfile &&
                    currentUser?.id ===
                    session.user.id
                ) {

                    return;
                }


                await loadUserProfile(
                    session.user
                );

            }

        }
    );
}


/* =========================================================
   LABCHAT SESSION ID
========================================================= */

function getLabChatSessionId() {

    let sessionId =
        sessionStorage.getItem(
            SESSION_ID_KEY
        );


    /*
     * Create a new ID only when this tab
     * doesn't already have one.
     */

    if (
        !sessionId
    ) {

        sessionId =
            crypto.randomUUID();


        sessionStorage.setItem(
            SESSION_ID_KEY,
            sessionId
        );

    }


    userSessionId =
        sessionId;


    return sessionId;
}


/* =========================================================
   CLAIM LABCHAT SESSION
========================================================= */

async function claimLabChatSession() {

    if (
        !currentUser
    ) {

        return false;
    }


    const sessionId =
        getLabChatSessionId();


    console.log(
        "Claiming LabChat session:",
        sessionId
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "claim_labchat_session",
                {
                    p_session_id:
                        sessionId
                }
            );


        if (
            error
        ) {

            console.error(
                "Session claim error:",
                error
            );

            return false;
        }


        /*
         * The database function returns:
         *
         * true
         *     = session successfully claimed
         *
         * false
         *     = another active computer owns it
         */

        if (
            data !== true
        ) {

            console.warn(
                "LabChat account is already active elsewhere."
            );

            return false;
        }


        /*
         * Start heartbeat after successful claim.
         */

        startSessionHeartbeat();


        console.log(
            "LabChat session claimed successfully."
        );


        return true;


    } catch (
        error
    ) {

        console.error(
            "Unexpected session claim error:",
            error
        );

        return false;
    }
}


/* =========================================================
   SESSION HEARTBEAT
========================================================= */

function startSessionHeartbeat() {

    stopSessionHeartbeat();


    if (
        !currentUser
    ) {

        return;
    }


    /*
     * Update immediately.
     */

    updateSessionHeartbeat();


    /*
     * Then update every 20 seconds.
     */

    sessionHeartbeatTimer =
        setInterval(
            updateSessionHeartbeat,
            SESSION_HEARTBEAT_INTERVAL
        );
}


/* =========================================================
   UPDATE SESSION HEARTBEAT
========================================================= */

async function updateSessionHeartbeat() {

    if (
        !currentUser
    ) {

        return;
    }


    const sessionId =
        getLabChatSessionId();


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("active_sessions")
                .update(
                    {
                        last_seen:
                            new Date().toISOString()
                    }
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "session_id",
                    sessionId
                )
                .select(
                    "user_id"
                );


        if (
            error
        ) {

            console.warn(
                "Session heartbeat failed:",
                error
            );

            return;
        }


        /*
         * If zero rows were updated, the session
         * may have been removed or replaced.
         */

        if (
            !data ||
            data.length === 0
        ) {

            console.warn(
                "LabChat session is no longer active."
            );

            setStatus(
                "Session expired"
            );

            stopSessionHeartbeat();

        }

    } catch (
        error
    ) {

        console.warn(
            "Unexpected heartbeat error:",
            error
        );

    }
}


/* =========================================================
   STOP SESSION HEARTBEAT
========================================================= */

function stopSessionHeartbeat() {

    if (
        sessionHeartbeatTimer
    ) {

        clearInterval(
            sessionHeartbeatTimer
        );

        sessionHeartbeatTimer =
            null;
    }
}


/* =========================================================
   RELEASE LABCHAT SESSION
========================================================= */

async function releaseLabChatSession() {

    stopSessionHeartbeat();


    if (
        !currentUser
    ) {

        return;
    }


    const sessionId =
        sessionStorage.getItem(
            SESSION_ID_KEY
        );


    if (
        !sessionId
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("active_sessions")
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "session_id",
                    sessionId
                );


        if (
            error
        ) {

            console.warn(
                "Session release failed:",
                error
            );

        } else {

            console.log(
                "LabChat session released."
            );

        }

    } catch (
        error
    ) {

        console.warn(
            "Unexpected session release error:",
            error
        );

    }
}


/* =========================================================
   PDF INITIALIZATION
========================================================= */

async function initializePDFViewer() {

    if (
        pdfInitialized
    ) {

        return;
    }


    if (
        !pdfViewerScreen ||
        !pdfViewport ||
        !pdfPages
    ) {

        console.error(
            "PDF viewer elements are missing."
        );

        return;
    }


    pdfInitialized =
        true;


    showPDFLoading(
        true
    );


    hidePDFError();


    try {

        pdfjsLib =
            await import(
                PDFJS_URL
            );


        pdfjsLib.GlobalWorkerOptions.workerSrc =
            PDFJS_WORKER_URL;


        if (
            pdfDocumentTitle
        ) {

            pdfDocumentTitle.textContent =
                "XI-AI-UNIT-3-Python-Programming";

        }


        const pdfURL =
            new URL(
                PDF_FILE,
                window.location.href
            ).href;


        console.log(
            "Loading PDF:",
            pdfURL
        );


        const loadingTask =
            pdfjsLib.getDocument(
                {
                    url:
                        pdfURL
                }
            );


        pdfDocument =
            await loadingTask.promise;


        console.log(
            "PDF loaded:",
            pdfDocument.numPages,
            "pages"
        );


        await renderAllPDFPages();


        setupPDFPageObserver();


        pdfCurrentPage =
            1;


        updatePDFPageNumber();


        updatePDFZoomDisplay();


        showPDFLoading(
            false
        );


        console.log(
            "PDF viewer ready."
        );


    } catch (
        error
    ) {

        console.error(
            "PDF initialization error:",
            error
        );


        showPDFLoading(
            false
        );


        showPDFError(
            `Unable to load the PDF. Make sure ${PDF_FILE} is in the same folder as index.html.`
        );

    }
}


/* =========================================================
   PDF CONTROLS
========================================================= */

function setupPDFControls() {

    pdfPreviousButton?.addEventListener(
        "click",
        () => {

            goToPDFPage(
                pdfCurrentPage - 1
            );

        }
    );


    pdfNextButton?.addEventListener(
        "click",
        () => {

            goToPDFPage(
                pdfCurrentPage + 1
            );

        }
    );


    pdfZoomOutButton?.addEventListener(
        "click",
        () => {

            changePDFZoom(
                -0.1
            );

        }
    );


    pdfZoomInButton?.addEventListener(
        "click",
        () => {

            changePDFZoom(
                0.1
            );

        }
    );


    pdfFitButton?.addEventListener(
        "click",
        fitPDFToWidth
    );


    pdfViewport?.addEventListener(
        "scroll",
        updatePDFCurrentPageFromScroll,
        {
            passive:
                true
        }
    );


    window.addEventListener(
        "resize",
        debounce(
            async () => {

                if (
                    pdfFitMode &&
                    pdfDocument
                ) {

                    await renderAllPDFPages();

                    setupPDFPageObserver();

                }

            },
            200
        )
    );
}


/* =========================================================
   RENDER ALL PDF PAGES
========================================================= */

async function renderAllPDFPages() {

    if (
        !pdfDocument ||
        !pdfPages ||
        !pdfViewport
    ) {

        return;
    }


    const renderToken =
        ++pdfRenderToken;


    const pageToRestore =
        pdfCurrentPage;


    if (
        pdfPageObserver
    ) {

        pdfPageObserver.disconnect();

        pdfPageObserver =
            null;
    }


    pdfPages.innerHTML =
        "";


    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        if (
            renderToken !==
            pdfRenderToken
        ) {

            return;
        }


        await renderSinglePDFPage(
            pageNumber,
            renderToken
        );

    }


    pdfCurrentPage =
        Math.min(
            Math.max(
                pageToRestore,
                1
            ),
            pdfDocument.numPages
        );


    updatePDFPageNumber();


    requestAnimationFrame(
        () => {

            const pageElement =
                getPDFPageElement(
                    pdfCurrentPage
                );


            if (
                pageElement &&
                pdfViewport
            ) {

                pdfViewport.scrollTop =
                    Math.max(
                        0,
                        pageElement.offsetTop - 16
                    );

            }

        }
    );
}


/* =========================================================
   RENDER SINGLE PDF PAGE
========================================================= */

async function renderSinglePDFPage(
    pageNumber,
    renderToken
) {

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    if (
        renderToken !==
        pdfRenderToken
    ) {

        return;
    }


    let scale =
        pdfZoom;


    if (
        pdfFitMode
    ) {

        const baseViewport =
            page.getViewport(
                {
                    scale:
                        1
                }
            );


        const availableWidth =
            Math.max(
                300,
                pdfViewport.clientWidth - 40
            );


        scale =
            availableWidth /
            baseViewport.width;

    }


    scale =
        Math.max(
            0.25,
            Math.min(
                scale,
                4
            )
        );


    const viewport =
        page.getViewport(
            {
                scale
            }
        );


    const pageContainer =
        document.createElement(
            "div"
        );


    pageContainer.className =
        "pdf-page";


    pageContainer.dataset.pageNumber =
        pageNumber;


    pageContainer.style.width =
        `${viewport.width}px`;


    pageContainer.style.minHeight =
        `${viewport.height}px`;


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.className =
        "pdf-page-canvas";


    const context =
        canvas.getContext(
            "2d",
            {
                alpha:
                    false
            }
        );


    const devicePixelRatio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        Math.floor(
            viewport.width *
            devicePixelRatio
        );


    canvas.height =
        Math.floor(
            viewport.height *
            devicePixelRatio
        );


    canvas.style.width =
        `${viewport.width}px`;


    canvas.style.height =
        `${viewport.height}px`;


    const renderViewport =
        page.getViewport(
            {
                scale:
                    scale *
                    devicePixelRatio
            }
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
                renderViewport
        }
    ).promise;


    page.cleanup();
}


/* =========================================================
   PDF PAGE OBSERVER
========================================================= */

function setupPDFPageObserver() {

    if (
        !pdfPages ||
        !pdfViewport
    ) {

        return;
    }


    pdfPageObserver?.disconnect();


    pdfPageObserver =
        new IntersectionObserver(
            (
                entries
            ) => {

                let bestEntry =
                    null;


                for (
                    const entry of entries
                ) {

                    if (
                        !entry.isIntersecting
                    ) {

                        continue;
                    }


                    if (
                        !bestEntry ||
                        entry.intersectionRatio >
                        bestEntry.intersectionRatio
                    ) {

                        bestEntry =
                            entry;

                    }

                }


                if (
                    bestEntry
                ) {

                    const pageNumber =
                        Number(
                            bestEntry.target.dataset.pageNumber
                        );


                    if (
                        pageNumber
                    ) {

                        pdfCurrentPage =
                            pageNumber;

                        updatePDFPageNumber();

                    }

                }

            },
            {
                root:
                    pdfViewport,

                threshold:
                    [
                        0.15,
                        0.35,
                        0.5,
                        0.65,
                        0.8
                    ]
            }
        );


    pdfPages
        .querySelectorAll(
            ".pdf-page"
        )
        .forEach(
            page => {

                pdfPageObserver.observe(
                    page
                );

            }
        );
}


/* =========================================================
   PDF CURRENT PAGE FROM SCROLL
========================================================= */

function updatePDFCurrentPageFromScroll() {

    if (
        !pdfViewport ||
        !pdfPages
    ) {

        return;
    }


    const viewportMiddle =
        pdfViewport.scrollTop +
        pdfViewport.clientHeight / 2;


    let closestPage =
        1;


    let closestDistance =
        Infinity;


    pdfPages
        .querySelectorAll(
            ".pdf-page"
        )
        .forEach(
            pageElement => {

                const pageTop =
                    pageElement.offsetTop;


                const pageBottom =
                    pageTop +
                    pageElement.offsetHeight;


                const pageMiddle =
                    pageTop +
                    pageElement.offsetHeight / 2;


                if (
                    viewportMiddle >= pageTop &&
                    viewportMiddle <= pageBottom
                ) {

                    closestPage =
                        Number(
                            pageElement.dataset.pageNumber
                        );


                    closestDistance =
                        0;


                    return;

                }


                const distance =
                    Math.abs(
                        viewportMiddle -
                        pageMiddle
                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;


                    closestPage =
                        Number(
                            pageElement.dataset.pageNumber
                        );

                }

            }
        );


    if (
        closestPage !==
        pdfCurrentPage
    ) {

        pdfCurrentPage =
            closestPage;

        updatePDFPageNumber();

    }
}


/* =========================================================
   GO TO PDF PAGE
========================================================= */

function goToPDFPage(
    pageNumber
) {

    if (
        !pdfDocument ||
        !pdfViewport
    ) {

        return;
    }


    const targetPage =
        Math.max(
            1,
            Math.min(
                pageNumber,
                pdfDocument.numPages
            )
        );


    const pageElement =
        getPDFPageElement(
            targetPage
        );


    if (
        !pageElement
    ) {

        return;
    }


    pdfCurrentPage =
        targetPage;


    updatePDFPageNumber();


    pageElement.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "start"
        }
    );
}


/* =========================================================
   GET PDF PAGE ELEMENT
========================================================= */

function getPDFPageElement(
    pageNumber
) {

    return pdfPages?.querySelector(
        `.pdf-page[data-page-number="${pageNumber}"]`
    ) || null;
}


/* =========================================================
   PDF PAGE NUMBER
========================================================= */

function updatePDFPageNumber() {

    if (
        !pdfPageNumber
    ) {

        return;
    }


    const total =
        pdfDocument?.numPages || 1;


    pdfPageNumber.textContent =
        `${pdfCurrentPage} / ${total}`;


    if (
        pdfPreviousButton
    ) {

        pdfPreviousButton.disabled =
            pdfCurrentPage <= 1;

    }


    if (
        pdfNextButton
    ) {

        pdfNextButton.disabled =
            pdfCurrentPage >= total;

    }
}


/* =========================================================
   PDF ZOOM
========================================================= */

async function changePDFZoom(
    amount
) {

    if (
        !pdfDocument
    ) {

        return;
    }


    const newZoom =
        Math.max(
            0.5,
            Math.min(
                2.5,
                pdfZoom + amount
            )
        );


    pdfFitMode =
        false;


    pdfZoom =
        Math.round(
            newZoom * 10
        ) / 10;


    updatePDFZoomDisplay();


    await renderAllPDFPages();


    setupPDFPageObserver();
}


/* =========================================================
   FIT PDF TO WIDTH
========================================================= */

async function fitPDFToWidth() {

    if (
        !pdfDocument
    ) {

        return;
    }


    pdfFitMode =
        true;


    updatePDFZoomDisplay();


    await renderAllPDFPages();


    setupPDFPageObserver();
}


/* =========================================================
   PDF ZOOM DISPLAY
========================================================= */

function updatePDFZoomDisplay() {

    if (
        !pdfZoomValue
    ) {

        return;
    }


    pdfZoomValue.textContent =
        pdfFitMode
            ? "Fit"
            : `${Math.round(
                pdfZoom * 100
            )}%`;
}


/* =========================================================
   PDF LOADING / ERROR
========================================================= */

function showPDFLoading(
    show
) {

    pdfLoading?.classList.toggle(
        "hidden",
        !show
    );
}


function showPDFError(
    message
) {

    if (
        pdfErrorMessage
    ) {

        pdfErrorMessage.textContent =
            message;

    }


    pdfError?.classList.remove(
        "hidden"
    );
}


function hidePDFError() {

    pdfError?.classList.add(
        "hidden"
    );
}


/* =========================================================
   LOGIN CONTROLS
========================================================= */

function setupLoginControls() {

    loginForm?.addEventListener(
        "submit",
        handleLogin
    );


    closeLoginButton?.addEventListener(
        "click",
        closeLogin
    );


    loginOverlay?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                loginOverlay
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

    if (
        !loginOverlay
    ) {

        return;
    }


    loginOverlay.classList.remove(
        "hidden"
    );


    clearLoginError();


    setTimeout(
        () => {

            loginIdentifier?.focus();

        },
        50
    );
}


/* =========================================================
   CLOSE LOGIN
========================================================= */

function closeLogin() {

    loginOverlay?.classList.add(
        "hidden"
    );
}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();


    if (
        !loginIdentifier ||
        !loginPassword
    ) {

        return;
    }


    const email =
        loginIdentifier.value.trim();


    const password =
        loginPassword.value;


    if (
        !email ||
        !password
    ) {

        showLoginError(
            "Please enter your email and password."
        );

        return;
    }


    if (
        !email.includes("@")
    ) {

        showLoginError(
            "Please use your Supabase Auth email."
        );

        return;
    }


    clearLoginError();


    setLoginLoading(
        true
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword(
                {
                    email,
                    password
                }
            );


        if (
            error
        ) {

            console.error(
                "Login error:",
                error
            );


            showLoginError(
                getLoginErrorMessage(
                    error
                )
            );


            return;
        }


        if (
            !data?.user
        ) {

            showLoginError(
                "Login failed. Please try again."
            );


            return;
        }


        /*
         * loadUserProfile() now handles:
         *
         * - profile validation
         * - role validation
         * - session claiming
         * - heartbeat
         */

        const success =
            await loadUserProfile(
                data.user
            );


        if (
            !success
        ) {

            /*
             * If the account could not be claimed,
             * don't leave the Supabase authentication
             * session active.
             */

            await supabaseClient.auth.signOut();


            sessionStorage.removeItem(
                TAB_SESSION_KEY
            );

            sessionStorage.removeItem(
                SESSION_ID_KEY
            );

            stopSessionHeartbeat();

            userSessionId =
                null;


            return;
        }


        loginPassword.value =
            "";


    } catch (
        error
    ) {

        console.error(
            "Unexpected login error:",
            error
        );


        showLoginError(
            "An unexpected error occurred."
        );


    } finally {

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

        /*
         * Check whether this TAB already has an
         * active LabChat tab session.
         */

        const tabSession =
            sessionStorage.getItem(
                TAB_SESSION_KEY
            );


        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (
            error
        ) {

            console.error(
                "Session error:",
                error
            );


            showGuestState();


            setStatus(
                "Authentication error"
            );


            return;
        }


        /*
         * No Supabase session.
         */

        if (
            !data?.session
        ) {

            sessionStorage.removeItem(
                TAB_SESSION_KEY
            );

            sessionStorage.removeItem(
                SESSION_ID_KEY
            );


            showGuestState();

            return;
        }


        const session =
            data.session;


        /*
         * If this is a new browser tab, don't
         * automatically trust the persisted Supabase
         * session as a LabChat session.
         *
         * Instead, create a new LabChat session ID.
         *
         * The database RPC will determine whether
         * the account is already active elsewhere.
         */

        if (
            tabSession !==
            TAB_SESSION_VALUE
        ) {

            console.log(
                "New LabChat tab detected."
            );


            sessionStorage.removeItem(
                SESSION_ID_KEY
            );


            getLabChatSessionId();

        }


        /*
         * Check profile and claim the LabChat session.
         */

        const success =
            await loadUserProfile(
                session.user
            );


        if (
            !success
        ) {

            /*
             * If the session could not be restored,
             * clear the persisted authentication so
             * this page returns to Guest state.
             */

            try {

                await supabaseClient.auth.signOut();

            } catch (
                signOutError
            ) {

                console.warn(
                    "Restore sign-out failed:",
                    signOutError
                );

            }


            sessionStorage.removeItem(
                TAB_SESSION_KEY
            );

            sessionStorage.removeItem(
                SESSION_ID_KEY
            );

            stopSessionHeartbeat();

            userSessionId =
                null;


            showGuestState();

        }


    } catch (
        error
    ) {

        console.error(
            "Session restore error:",
            error
        );


        stopSessionHeartbeat();


        showGuestState();


        setStatus(
            "Authentication error"
        );

    }
}


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadUserProfile(
    user
) {

    if (
        !user
    ) {

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


        if (
            error
        ) {

            console.error(
                "Profile load error:",
                error
            );


            showLoginError(
                "Could not load your profile."
            );


            return false;
        }


        if (
            !data
        ) {

            showLoginError(
                "Your account does not have a LabChat profile."
            );


            return false;
        }


        if (
            data.is_active !==
            true
        ) {

            showLoginError(
                "Your LabChat account is inactive."
            );


            return false;
        }


        /*
         * ADMIN
         *
         * Admin sessions remain separate from
         * normal LabChat user sessions.
         */

        if (
            data.role ===
            "admin"
        ) {

            sessionStorage.setItem(
                TAB_SESSION_KEY,
                TAB_SESSION_VALUE
            );


            sessionStorage.setItem(
                ADMIN_TAB_SESSION_KEY,
                "true"
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


        /*
         * Set the current user BEFORE calling
         * claim_labchat_session(), because the
         * database function uses auth.uid().
         */

        currentUser =
            user;


        currentProfile =
            data;


        /*
         * =================================================
         * CLAIM SINGLE LABCHAT SESSION
         * =================================================
         *
         * This is the important new security step.
         *
         * If another active computer owns this account,
         * the database function returns false.
         */

        const sessionClaimed =
            await claimLabChatSession();


        if (
            !sessionClaimed
        ) {

            console.warn(
                "Could not claim LabChat session."
            );


            currentUser =
                null;


            currentProfile =
                null;


            stopSessionHeartbeat();


            showGuestState();


            showLoginError(
                "This account is already active on another computer. Please wait until that session becomes inactive."
            );


            return false;
        }


        /*
         * LabChat tab is now authorized.
         */

        sessionStorage.setItem(
            TAB_SESSION_KEY,
            TAB_SESSION_VALUE
        );


        if (
            currentUserElement
        ) {

            currentUserElement.textContent =
                data.username;

        }


        closeLogin();


        /*
         * Start in CHAT mode after login.
         */

        showChatScreen();


        enableChatControls();


        setStatus(
            "Loading..."
        );


        await loadMessages();


        subscribeToMessages();


        startPresence();


        messageInput?.focus();


        console.log(
            "Logged in:",
            data.username
        );


        return true;


    } catch (
        error
    ) {

        console.error(
            "Profile error:",
            error
        );


        currentUser =
            null;


        currentProfile =
            null;


        stopSessionHeartbeat();


        showLoginError(
            "Could not load your LabChat profile."
        );


        return false;
    }
}


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

/*
 * Show Chat.
 *
 * IMPORTANT:
 * This does NOT authenticate or log in.
 * It only changes the visible screen.
 */

function showChatScreen() {

    pdfViewerScreen?.classList.add(
        "hidden"
    );


    chatScreen?.classList.remove(
        "hidden"
    );
}


/*
 * Show PDF.
 *
 * IMPORTANT:
 * This does NOT sign out.
 */

function showPDFScreen() {

    chatScreen?.classList.add(
        "hidden"
    );


    pdfViewerScreen?.classList.remove(
        "hidden"
    );
}


/* =========================================================
   GUEST STATE
========================================================= */

function showGuestState() {

    stopSessionHeartbeat();


    currentUser =
        null;


    currentProfile =
        null;


    if (
        currentUserElement
    ) {

        currentUserElement.textContent =
            "Guest";

    }


    disableChatControls();


    showPDFScreen();


    setStatus(
        "Ready"
    );
}


/* =========================================================
   LOGIN UI
========================================================= */

function showLoginError(
    message
) {

    if (
        loginError
    ) {

        loginError.textContent =
            message;

    }
}


function clearLoginError() {

    if (
        loginError
    ) {

        loginError.textContent =
            "";

    }
}


function setLoginLoading(
    loading
) {

    if (
        !loginButton
    ) {

        return;
    }


    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "Logging in..."
            : "Login";
}


function getLoginErrorMessage(
    error
) {

    const message =
        error?.message ||
        "";


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
   CHAT CONTROLS
========================================================= */

function enableChatControls() {

    if (
        messageInput
    ) {

        messageInput.disabled =
            false;


        messageInput.placeholder =
            isCodeMode
                ? "Write your code here..."
                : "Type a message...";

    }


    if (
        sendButton
    ) {

        sendButton.disabled =
            false;

    }


    if (
        codeButton
    ) {

        codeButton.disabled =
            false;

    }
}


function disableChatControls() {

    if (
        messageInput
    ) {

        messageInput.disabled =
            true;


        messageInput.placeholder =
            "Login to send a message...";

    }


    if (
        sendButton
    ) {

        sendButton.disabled =
            true;

    }


    if (
        codeButton
    ) {

        codeButton.disabled =
            true;

    }
}


/* =========================================================
   MESSAGE CONTROLS
========================================================= */

function setupMessageControls() {

    messageForm?.addEventListener(
        "submit",
        handleMessageSubmit
    );


    messageInput?.addEventListener(
        "keydown",
        handleMessageKeydown
    );


    messageInput?.addEventListener(
        "input",
        autoResizeTextarea
    );


    codeButton?.addEventListener(
        "click",
        toggleCodeMode
    );


    leaveButton?.addEventListener(
        "click",
        leaveChat
    );
}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

    if (
        !messagesContainer
    ) {

        return;
    }


    setStatus(
        "Loading..."
    );


    try {

        const now =
            new Date().toISOString();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .select("*")
                .gt(
                    "expires_at",
                    now
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            console.error(
                "Load messages error:",
                error
            );


            setStatus(
                "Database error"
            );


            return;
        }


        clearMessageTimers();


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


    } catch (
        error
    ) {

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

    if (
        realtimeChannel
    ) {

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
                payload => {

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
                status => {

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

    if (
        !currentProfile
    ) {

        return;
    }


    if (
        presenceChannel
    ) {

        supabaseClient.removeChannel(
            presenceChannel
        );


        presenceChannel =
            null;

    }


    /*
     * Use the LabChat session ID as the presence key.
     *
     * This means the same active tab maintains
     * the same presence identity during refreshes.
     */

    const presenceKey =
        getLabChatSessionId();


    presenceChannel =
        supabaseClient.channel(
            "labchat-online-users",
            {
                config:
                {
                    presence:
                    {
                        key:
                            presenceKey
                    }
                }
            }
        );


    presenceChannel
        .on(
            "presence",
            {
                event:
                    "sync"
            },
            updateOnlineCount
        )
        .on(
            "presence",
            {
                event:
                    "join"
            },
            updateOnlineCount
        )
        .on(
            "presence",
            {
                event:
                    "leave"
            },
            updateOnlineCount
        )
        .subscribe(
            async status => {

                if (
                    status !==
                    "SUBSCRIBED"
                ) {

                    return;
                }


                try {

                    await presenceChannel.track(
                        {
                            username:
                                currentProfile.username,

                            user_id:
                                currentProfile.id,

                            session_id:
                                presenceKey
                        }
                    );


                    updateOnlineCount();


                } catch (
                    error
                ) {

                    console.error(
                        "Presence tracking error:",
                        error
                    );

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


    Object.values(
        state
    ).forEach(
        entries => {

            entries.forEach(
                entry => {

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

async function handleMessageSubmit(
    event
) {

    event.preventDefault();


    if (
        !currentUser ||
        !currentProfile
    ) {

        openLogin();

        return;
    }


    if (
        !messageInput
    ) {

        return;
    }


    const text =
        messageInput.value;


    if (
        !text.trim()
    ) {

        return;
    }


    if (
        sendButton
    ) {

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


        if (
            error
        ) {

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


    } catch (
        error
    ) {

        console.error(
            "Unexpected send error:",
            error
        );


        alert(
            "Message could not be sent."
        );


    } finally {

        if (
            sendButton
        ) {

            sendButton.disabled =
                false;

        }

    }
}


/* =========================================================
   MESSAGE KEYBOARD
========================================================= */

function handleMessageKeydown(
    event
) {

    /*
     * NORMAL MODE
     *
     * Enter = send
     * Shift + Enter = newline
     */

    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isCodeMode
    ) {

        event.preventDefault();


        messageForm?.requestSubmit();


        return;
    }


    /*
     * CODE MODE
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


        messageForm?.requestSubmit();

    }
}


/* =========================================================
   CODE MODE
========================================================= */

function toggleCodeMode() {

    if (
        !currentUser
    ) {

        openLogin();

        return;
    }


    isCodeMode =
        !isCodeMode;


    codeButton?.classList.toggle(
        "active",
        isCodeMode
    );


    codeIndicator?.classList.toggle(
        "hidden",
        !isCodeMode
    );


    if (
        messageInput
    ) {

        messageInput.placeholder =
            isCodeMode
                ? "Write your code here..."
                : "Type a message...";


        messageInput.focus();

    }
}


/* =========================================================
   DISPLAY MESSAGE
========================================================= */

function addMessage(
    message
) {

    if (
        !message ||
        !messagesContainer
    ) {

        return;
    }


    /*
     * Ignore expired messages.
     */

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


    if (
        message.is_code
    ) {

        renderCodeMessage(
            messageElement,
            message
        );

    } else {

        renderNormalMessage(
            messageElement,
            message
        );

    }


    messagesContainer.appendChild(
        messageElement
    );


    scheduleMessageRemoval(
        messageElement,
        message.id,
        expires
    );
}


/* =========================================================
   NORMAL MESSAGE RENDER
========================================================= */

function renderNormalMessage(
    messageElement,
    message
) {

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


    actions.appendChild(
        createCopyButton(
            message.message,
            "Copy"
        )
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


/* =========================================================
   CODE MESSAGE RENDER
========================================================= */

function renderCodeMessage(
    messageElement,
    message
) {

    messageElement.classList.add(
        "code-message"
    );


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "code-header";


    const author =
        document.createElement(
            "span"
        );


    author.textContent =
        `${message.username} • ${formatTime(
            message.created_at
        )}`;


    header.appendChild(
        author
    );


    header.appendChild(
        createCopyButton(
            message.message,
            "Copy Code"
        )
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
        header
    );


    messageElement.appendChild(
        codeContent
    );
}


/* =========================================================
   MESSAGE EXPIRY
========================================================= */

function scheduleMessageRemoval(
    messageElement,
    messageId,
    expires
) {

    const remaining =
        expires.getTime() -
        Date.now();


    if (
        remaining <= 0
    ) {

        messageElement.remove();

        return;
    }


    const existingTimer =
        messageTimers.get(
            messageId
        );


    if (
        existingTimer
    ) {

        clearTimeout(
            existingTimer
        );

    }


    const timer =
        setTimeout(
            () => {

                if (
                    messageElement.isConnected
                ) {

                    messageElement.remove();

                }


                messageTimers.delete(
                    messageId
                );


                if (
                    messagesContainer &&
                    messagesContainer.children.length === 0
                ) {

                    showEmptyState();

                }

            },
            remaining
        );


    messageTimers.set(
        messageId,
        timer
    );
}


function clearMessageTimers() {

    messageTimers.forEach(
        timer => {

            clearTimeout(
                timer
            );

        }
    );


    messageTimers.clear();
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

                await navigator.clipboard.writeText(
                    text
                );


                button.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        if (
                            button.isConnected
                        ) {

                            button.textContent =
                                label;

                        }

                    },
                    1200
                );


            } catch (
                error
            ) {

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

function linkify(
    element
) {

    if (
        !element
    ) {

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
        part => {

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


            } else {

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

function formatTime(
    timestamp
) {

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

    if (
        !messagesContainer
    ) {

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


function removeEmptyState() {

    messagesContainer
        ?.querySelector(
            ".empty-state"
        )
        ?.remove();
}


/* =========================================================
   STATUS
========================================================= */

function setStatus(
    status
) {

    if (
        connectionStatus
    ) {

        connectionStatus.textContent =
            status;

    }
}


/* =========================================================
   TEXTAREA AUTO RESIZE
========================================================= */

function autoResizeTextarea() {

    if (
        !messageInput
    ) {

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
   SCROLL CHAT
========================================================= */

function scrollToBottom() {

    if (
        messagesContainer
    ) {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;

    }
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Do not react to shortcuts while the user
             * is typing inside a text input, textarea,
             * password field, or contenteditable element.
             *
             * EXCEPTION:
             *
             * Escape is still allowed because it is the
             * main navigation shortcut.
             */

            const target =
                event.target;


            const isTypingField =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target?.isContentEditable;


            /*
             * =================================================
             * CTRL + SHIFT + L
             * =================================================
             *
             * Return to CHAT.
             */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() === "l"
            ) {

                event.preventDefault();


                /*
                 * Only allow returning to chat when
                 * the current tab is authenticated.
                 */

                if (
                    currentUser &&
                    currentProfile
                ) {

                    closeLogin();

                    showChatScreen();

                    enableChatControls();

                    messageInput?.focus();

                } else {

                    openLogin();

                }


                return;
            }


            /*
             * =================================================
             * ESC
             * =================================================
             *
             * ESC NEVER SIGNS OUT.
             *
             * If login popup is open, close the popup.
             *
             * Otherwise, if the user is logged in,
             * immediately switch to PDF.
             */

            if (
                event.key === "Escape"
            ) {

                /*
                 * If login popup is currently open,
                 * ESC simply closes it.
                 */

                if (
                    loginOverlayIsOpen()
                ) {

                    event.preventDefault();

                    closeLogin();

                    return;
                }


                /*
                 * ESC from Chat → PDF.
                 */

                if (
                    currentUser &&
                    currentProfile &&
                    chatScreen &&
                    !chatScreen.classList.contains(
                        "hidden"
                    )
                ) {

                    event.preventDefault();

                    showPDFScreen();

                    return;
                }


                /*
                 * If already on PDF, ESC does nothing.
                 */

                return;
            }


            /*
             * Do not handle PDF arrow navigation
             * while typing in an input.
             */

            if (
                isTypingField
            ) {

                return;
            }


            /*
             * =================================================
             * PDF NAVIGATION
             * =================================================
             */

            if (
                pdfViewerScreen &&
                !pdfViewerScreen.classList.contains(
                    "hidden"
                ) &&
                !loginOverlayIsOpen()
            ) {

                if (
                    event.key === "ArrowLeft"
                ) {

                    event.preventDefault();


                    goToPDFPage(
                        pdfCurrentPage - 1
                    );

                }


                if (
                    event.key === "ArrowRight"
                ) {

                    event.preventDefault();


                    goToPDFPage(
                        pdfCurrentPage + 1
                    );

                }

            }

        }
    );
}


/* =========================================================
   LOGIN OVERLAY STATE
========================================================= */

function loginOverlayIsOpen() {

    return Boolean(
        loginOverlay &&
        !loginOverlay.classList.contains(
            "hidden"
        )
    );
}


/* =========================================================
   SIGN OUT
========================================================= */

/*
 * This is the ONLY normal action that signs
 * the user out.
 *
 * ESC does NOT call this function.
 */

async function leaveChat() {

    console.log(
        "Signing out..."
    );


    /*
     * Stop realtime first.
     */

    await cleanupRealtime();


    /*
     * Release the database session.
     *
     * IMPORTANT:
     * currentUser must still exist here because
     * releaseLabChatSession() needs its user ID.
     */

    await releaseLabChatSession();


    /*
     * Remove local authorization.
     */

    sessionStorage.removeItem(
        TAB_SESSION_KEY
    );


    sessionStorage.removeItem(
        ADMIN_TAB_SESSION_KEY
    );


    sessionStorage.removeItem(
        SESSION_ID_KEY
    );


    userSessionId =
        null;


    try {

        await supabaseClient.auth.signOut();


    } catch (
        error
    ) {

        console.error(
            "Sign out error:",
            error
        );

    }
}


/* =========================================================
   REALTIME CLEANUP
========================================================= */

async function cleanupRealtime() {

    /*
     * Presence.
     */

    if (
        presenceChannel
    ) {

        try {

            await presenceChannel.untrack();


        } catch (
            error
        ) {

            console.warn(
                "Presence untrack failed:",
                error
            );

        }


        try {

            await supabaseClient.removeChannel(
                presenceChannel
            );


        } catch (
            error
        ) {

            console.warn(
                "Presence channel cleanup failed:",
                error
            );

        }


        presenceChannel =
            null;

    }


    /*
     * Messages.
     */

    if (
        realtimeChannel
    ) {

        try {

            await supabaseClient.removeChannel(
                realtimeChannel
            );


        } catch (
            error
        ) {

            console.warn(
                "Realtime cleanup failed:",
                error
            );

        }


        realtimeChannel =
            null;

    }
}


/* =========================================================
   RESET AFTER SIGN OUT
========================================================= */

async function resetLabChat(
    showLogin = true
) {

    console.log(
        "Resetting LabChat..."
    );


    /*
     * IMPORTANT:
     *
     * Release the database session BEFORE
     * clearing currentUser.
     */

    await releaseLabChatSession();


    await cleanupRealtime();


    clearMessageTimers();


    sessionStorage.removeItem(
        TAB_SESSION_KEY
    );


    sessionStorage.removeItem(
        ADMIN_TAB_SESSION_KEY
    );


    sessionStorage.removeItem(
        SESSION_ID_KEY
    );


    userSessionId =
        null;


    currentUser =
        null;


    currentProfile =
        null;


    isCodeMode =
        false;


    if (
        currentUserElement
    ) {

        currentUserElement.textContent =
            "Guest";

    }


    if (
        messagesContainer
    ) {

        messagesContainer.innerHTML =
            "";

    }


    codeButton?.classList.remove(
        "active"
    );


    codeIndicator?.classList.add(
        "hidden"
    );


    if (
        messageInput
    ) {

        messageInput.value =
            "";


        messageInput.placeholder =
            "Login to send a message...";


        messageInput.style.height =
            "auto";

    }


    if (
        onlineCount
    ) {

        onlineCount.textContent =
            "0 online";

    }


    disableChatControls();


    showPDFScreen();


    updatePDFPageNumber();


    setStatus(
        "Ready"
    );


    /*
     * Show login popup only when requested.
     *
     * This prevents unnecessary login popups during
     * initial page loading.
     */

    if (
        showLogin
    ) {

        openLogin();

    }
}


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    delay
) {

    let timeoutId =
        null;


    return (
        ...args
    ) => {

        clearTimeout(
            timeoutId
        );


        timeoutId =
            setTimeout(
                () => {

                    callback(
                        ...args
                    );

                },
                delay
            );

    };
}


/* =========================================================
   PAGE CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * Clear local message timers.
         */

        clearMessageTimers();


        /*
         * Stop the heartbeat locally.
         */

        stopSessionHeartbeat();


        /*
         * We intentionally DO NOT attempt to delete
         * active_sessions here.
         *
         * beforeunload is not reliable for asynchronous
         * Supabase requests.
         *
         * Instead:
         *
         * 1. Normal logout explicitly deletes the row.
         *
         * 2. A browser crash/tab close stops the heartbeat.
         *
         * 3. After 60 seconds, claim_labchat_session()
         *    considers the old session inactive.
         *
         * 4. Another computer can then claim the account.
         *
         * Supabase Realtime presence will also disappear
         * when the connection closes.
         */

        if (
            presenceChannel
        ) {

            try {

                presenceChannel.untrack();

            } catch (
                error
            ) {

                console.warn(
                    "Presence cleanup error:",
                    error
                );

            }

        }

    }
);
