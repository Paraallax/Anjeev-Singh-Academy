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
   PDF CONFIGURATION
========================================================= */

/*
 * The PDF is stored in the same repository/folder
 * as index.html.
 *
 * Therefore we can load it directly using its
 * relative path.
 */

const PDF_FILE =
    "XI-AI-UNIT-3-Python-Programming.pdf";


/*
 * PDF.js module.
 *
 * We dynamically import PDF.js so index.html does
 * not need another script tag.
 */

const PDFJS_VERSION =
    "5.4.54";

const PDFJS_URL =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;

const PDFJS_WORKER_URL =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;


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

let pdfZoom = 1;

let pdfFitMode = true;

let pdfPageObserver = null;

let pdfRenderToken = 0;


/*
 * Prevent repeated PDF initialization.
 */

let pdfInitialized = false;


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
        "Loading..."
    );


    /*
     * Setup controls first.
     */

    setupLoginControls();

    setupMessageControls();

    setupPDFControls();

    setupKeyboardShortcuts();

    disableChatControls();


    /*
     * PDF is public.
     *
     * Load it before authentication.
     */

    await initializePDFViewer();


    /*
     * Restore Supabase session.
     */

    await restoreSession();


    console.log(
        "LabChat initialization complete."
    );
}


/* =========================================================
   PDF VIEWER INITIALIZATION
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
            "PDF viewer elements are missing from index.html."
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

        /*
         * Dynamically load PDF.js.
         */

        pdfjsLib =
            await import(
                PDFJS_URL
            );


        /*
         * Configure the PDF.js worker.
         */

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            PDFJS_WORKER_URL;


        /*
         * Set title.
         */

        if (
            pdfDocumentTitle
        ) {

            pdfDocumentTitle.textContent =
                "XI-AI-UNIT-3-Python-Programming";

        }


        /*
         * Load the actual local PDF.
         */

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


        /*
         * Render every page into one continuous
         * scrolling document.
         */

        await renderAllPDFPages();


        /*
         * Observe the visible page so the
         * toolbar page number follows scrolling.
         */

        setupPDFPageObserver();


        /*
         * Update initial toolbar state.
         */

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


    } catch (error) {

        console.error(
            "PDF initialization error:",
            error
        );


        showPDFLoading(
            false
        );


        showPDFError(
            "Unable to load the PDF. Make sure " +
            PDF_FILE +
            " is in the same folder as index.html."
        );

    }
}


/* =========================================================
   PDF CONTROLS
========================================================= */

function setupPDFControls() {

    if (
        pdfPreviousButton
    ) {

        pdfPreviousButton.addEventListener(
            "click",
            () => {

                goToPDFPage(
                    pdfCurrentPage - 1
                );

            }
        );

    }


    if (
        pdfNextButton
    ) {

        pdfNextButton.addEventListener(
            "click",
            () => {

                goToPDFPage(
                    pdfCurrentPage + 1
                );

            }
        );

    }


    if (
        pdfZoomOutButton
    ) {

        pdfZoomOutButton.addEventListener(
            "click",
            () => {

                changePDFZoom(
                    -0.1
                );

            }
        );

    }


    if (
        pdfZoomInButton
    ) {

        pdfZoomInButton.addEventListener(
            "click",
            () => {

                changePDFZoom(
                    0.1
                );

            }
        );

    }


    if (
        pdfFitButton
    ) {

        pdfFitButton.addEventListener(
            "click",
            () => {

                fitPDFToWidth();

            }
        );

    }


    /*
     * If the user manually scrolls,
     * keep the viewer focused.
     */

    if (
        pdfViewport
    ) {

        pdfViewport.addEventListener(
            "scroll",
            updatePDFCurrentPageFromScroll,
            {
                passive:
                    true
            }
        );

    }


    /*
     * Resize the PDF when the browser
     * window changes size.
     */

    window.addEventListener(
        "resize",
        debounce(
            async () => {

                if (
                    pdfFitMode &&
                    pdfDocument
                ) {

                    await renderAllPDFPages();

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
        !pdfPages
    ) {

        return;

    }


    /*
     * Every render gets a token.
     *
     * If the user changes zoom while rendering,
     * the old render becomes invalid.
     */

    const renderToken =
        ++pdfRenderToken;


    /*
     * Remember current page.
     */

    const pageToRestore =
        pdfCurrentPage;


    /*
     * Remove old observer.
     */

    if (
        pdfPageObserver
    ) {

        pdfPageObserver.disconnect();

        pdfPageObserver =
            null;

    }


    /*
     * Clear current pages.
     */

    pdfPages.innerHTML =
        "";


    /*
     * Render pages sequentially.
     *
     * This prevents the browser from trying
     * to render all 27 canvas operations at
     * exactly the same time.
     */

    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        /*
         * Stop if a newer render started.
         */

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


    /*
     * Restore current page after rendering.
     */

    pdfCurrentPage =
        Math.min(
            Math.max(
                pageToRestore,
                1
            ),
            pdfDocument.numPages
        );


    updatePDFPageNumber();


    /*
     * Restore scroll position.
     */

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
                        pageElement.offsetTop -
                        16
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


    /*
     * Determine scale.
     */

    let scale =
        pdfZoom;


    /*
     * Fit mode means the page should fit
     * the available viewer width.
     */

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
                pdfViewport.clientWidth -
                40
            );


        scale =
            availableWidth /
            baseViewport.width;

    }


    /*
     * Prevent extremely tiny or huge pages.
     */

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
                scale:
                    scale
            }
        );


    /*
     * Page wrapper.
     */

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


    /*
     * Canvas.
     */

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


    /*
     * Use device pixel ratio for sharper
     * rendering on high-DPI displays.
     */

    const devicePixelRatio =
        Math.min(
            window.devicePixelRatio ||
            1,
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


    /*
     * Render at high resolution while
     * keeping the CSS size unchanged.
     */

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


    /*
     * Render page.
     */

    await page.render(
        {
            canvasContext:
                context,

            viewport:
                renderViewport
        }
    ).promise;


    /*
     * Release page resources.
     */

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


    if (
        pdfPageObserver
    ) {

        pdfPageObserver.disconnect();

    }


    /*
     * Observe pages against the PDF viewport.
     *
     * The page with the greatest visible
     * intersection becomes the current page.
     */

    pdfPageObserver =
        new IntersectionObserver(
            (entries) => {

                let bestEntry =
                    null;


                for (
                    const entry
                    of entries
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
                            bestEntry
                                .target
                                .dataset
                                .pageNumber
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


    const pageElements =
        pdfPages.querySelectorAll(
            ".pdf-page"
        );


    pageElements.forEach(
        (page) => {

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


    const pageElements =
        pdfPages.querySelectorAll(
            ".pdf-page"
        );


    let closestPage =
        1;

    let closestDistance =
        Infinity;


    pageElements.forEach(
        (pageElement) => {

            const pageTop =
                pageElement.offsetTop;

            const pageBottom =
                pageTop +
                pageElement.offsetHeight;


            const pageMiddle =
                pageTop +
                pageElement.offsetHeight /
                2;


            /*
             * If viewport middle is inside
             * this page, this is the best match.
             */

            if (
                viewportMiddle >= pageTop &&
                viewportMiddle <= pageBottom
            ) {

                closestPage =
                    Number(
                        pageElement
                            .dataset
                            .pageNumber
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
                        pageElement
                            .dataset
                            .pageNumber
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

    if (
        !pdfPages
    ) {

        return null;

    }


    return pdfPages.querySelector(
        `.pdf-page[data-page-number="${pageNumber}"]`
    );
}


/* =========================================================
   PDF PAGE NUMBER DISPLAY
========================================================= */

function updatePDFPageNumber() {

    if (
        !pdfPageNumber
    ) {

        return;

    }


    const total =
        pdfDocument
            ? pdfDocument.numPages
            : 1;


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
                pdfZoom +
                amount
            )
        );


    /*
     * If already at the requested zoom,
     * do nothing.
     */

    if (
        Math.abs(
            newZoom -
            pdfZoom
        ) < 0.001 &&
        !pdfFitMode
    ) {

        return;

    }


    /*
     * Zoom mode disables fit mode.
     */

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


    if (
        pdfFitMode
    ) {

        pdfZoomValue.textContent =
            "Fit";

        return;

    }


    pdfZoomValue.textContent =
        `${Math.round(
            pdfZoom * 100
        )}%`;
}


/* =========================================================
   PDF LOADING
========================================================= */

function showPDFLoading(
    show
) {

    if (
        !pdfLoading
    ) {

        return;

    }


    pdfLoading.classList.toggle(
        "hidden",
        !show
    );
}


/* =========================================================
   PDF ERROR
========================================================= */

function showPDFError(
    message
) {

    if (
        pdfErrorMessage
    ) {

        pdfErrorMessage.textContent =
            message;
    }


    if (
        pdfError
    ) {

        pdfError.classList.remove(
            "hidden"
        );

    }
}


/* =========================================================
   HIDE PDF ERROR
========================================================= */

function hidePDFError() {

    if (
        pdfError
    ) {

        pdfError.classList.add(
            "hidden"
        );

    }
}


/* =========================================================
   LOGIN CONTROLS
========================================================= */

function setupLoginControls() {

    if (
        loginForm
    ) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (
        closeLoginButton
    ) {

        closeLoginButton.addEventListener(
            "click",
            closeLogin
        );

    }


    if (
        loginOverlay
    ) {

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

    if (
        messageForm
    ) {

        messageForm.addEventListener(
            "submit",
            handleMessageSubmit
        );

    }


    if (
        messageInput
    ) {

        messageInput.addEventListener(
            "keydown",
            handleMessageKeydown
        );


        messageInput.addEventListener(
            "input",
            autoResizeTextarea
        );

    }


    if (
        codeButton
    ) {

        codeButton.addEventListener(
            "click",
            toggleCodeMode
        );

    }


    if (
        leaveButton
    ) {

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
             * Opens the login popup.
             */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() ===
                "l"
            ) {

                event.preventDefault();

                openLogin();

                return;
            }


            /*
             * Escape closes login.
             */

            if (
                event.key ===
                "Escape" &&
                loginOverlay &&
                !loginOverlay.classList.contains(
                    "hidden"
                )
            ) {

                closeLogin();

            }


            /*
             * PDF keyboard navigation.
             */

            if (
                pdfViewerScreen &&
                !pdfViewerScreen.classList.contains(
                    "hidden"
                ) &&
                !loginOverlayIsOpen()
            ) {

                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    goToPDFPage(
                        pdfCurrentPage - 1
                    );

                }


                if (
                    event.key ===
                    "ArrowRight"
                ) {

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

    return (
        loginOverlay &&
        !loginOverlay.classList.contains(
            "hidden"
        )
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

            if (
                loginIdentifier
            ) {

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

    if (
        !loginOverlay
    ) {

        return;

    }


    loginOverlay.classList.add(
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
     * Supabase Auth requires email login
     * in the current architecture.
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


        if (
            !success
        ) {

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


        if (
            error
        ) {

            console.error(
                "Session error:",
                error
            );


            setStatus(
                "Authentication error"
            );


            showGuestState();


            return;
        }


        if (
            !data ||
            !data.session
        ) {

            setStatus(
                "Ready"
            );


            showGuestState();


            return;
        }


        await loadUserProfile(
            data.session.user
        );


    } catch (
        error
    ) {

        console.error(
            "Session restore error:",
            error
        );


        setStatus(
            "Authentication error"
        );


        showGuestState();

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
         */

        if (
            data.role ===
            "admin"
        ) {

            console.log(
                "Admin login detected."
            );


            /*
             * Your project contains admin.html
             * in the same main folder.
             */

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


        if (
            currentUserElement
        ) {

            currentUserElement.textContent =
                data.username;

        }


        closeLogin();


        /*
         * Switch from the public PDF screen
         * to the authenticated chat screen.
         */

        showChatScreen();


        enableChatControls();


        setStatus(
            "Loading..."
        );


        /*
         * Load chat data.
         */

        await loadMessages();

        subscribeToMessages();

        startPresence();


        if (
            messageInput
        ) {

            messageInput.focus();

        }


        console.log(
            "LabChat user logged in:",
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


        showLoginError(
            "Could not load your LabChat profile."
        );


        return false;

    }
}


/* =========================================================
   SHOW CHAT SCREEN
========================================================= */

function showChatScreen() {

    if (
        pdfViewerScreen
    ) {

        pdfViewerScreen.classList.add(
            "hidden"
        );

    }


    if (
        chatScreen
    ) {

        chatScreen.classList.remove(
            "hidden"
        );

    }
}


/* =========================================================
   SHOW PDF SCREEN
========================================================= */

function showPDFScreen() {

    if (
        chatScreen
    ) {

        chatScreen.classList.add(
            "hidden"
        );

    }


    if (
        pdfViewerScreen
    ) {

        pdfViewerScreen.classList.remove(
            "hidden"
        );

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


    if (
        currentUserElement
    ) {

        currentUserElement.textContent =
            "Guest";

    }


    disableChatControls();


    /*
     * Public PDF remains the main screen.
     */

    showPDFScreen();


    setStatus(
        "Ready"
    );
}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
    message
) {

    if (
        !loginError
    ) {

        return;

    }


    loginError.textContent =
        message;
}


/* =========================================================
   CLEAR LOGIN ERROR
========================================================= */

function clearLoginError() {

    if (
        !loginError
    ) {

        return;

    }


    loginError.textContent =
        "";
}


/* =========================================================
   LOGIN BUTTON STATE
========================================================= */

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


/* =========================================================
   LOGIN ERROR MESSAGE
========================================================= */

function getLoginErrorMessage(
    error
) {

    if (
        !error
    ) {

        return "Login failed.";

    }


    const message =
        error.message ||
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
   CHAT ENABLE
========================================================= */

function enableChatControls() {

    if (
        messageInput
    ) {

        messageInput.disabled =
            false;


        messageInput.placeholder =
            "Type a message...";
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


/* =========================================================
   CHAT DISABLE
========================================================= */

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


        messagesContainer.innerHTML =
            "";


        if (
            !data ||
            data.length ===
            0
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


    presenceChannel =
        supabaseClient.channel(
            "labchat-online-users",
            {
                config:
                {
                    presence:
                    {
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


                } catch (
                    error
                ) {

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


    Object.values(
        state
    ).forEach(
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

async function handleMessageSubmit(
    event
) {

    event.preventDefault();


    if (
        !currentUser
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
     * Normal mode:
     *
     * Enter = send
     * Shift + Enter = newline
     */

    if (
        event.key ===
        "Enter" &&
        !event.shiftKey &&
        !isCodeMode
    ) {

        event.preventDefault();


        if (
            messageForm
        ) {

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
        event.key ===
        "Enter" &&
        event.ctrlKey &&
        isCodeMode
    ) {

        event.preventDefault();


        if (
            messageForm
        ) {

            messageForm.requestSubmit();

        }

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


    if (
        isCodeMode
    ) {

        if (
            codeButton
        ) {

            codeButton.classList.add(
                "active"
            );

        }


        if (
            codeIndicator
        ) {

            codeIndicator.classList.remove(
                "hidden"
            );

        }


        if (
            messageInput
        ) {

            messageInput.placeholder =
                "Write your code here...";
        }

    } else {

        if (
            codeButton
        ) {

            codeButton.classList.remove(
                "active"
            );

        }


        if (
            codeIndicator
        ) {

            codeIndicator.classList.add(
                "hidden"
            );

        }


        if (
            messageInput
        ) {

            messageInput.placeholder =
                "Type a message...";
        }

    }


    if (
        messageInput
    ) {

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


    const expires =
        new Date(
            message.expires_at
        );


    if (
        Number.isNaN(
            expires.getTime()
        ) ||
        expires <=
        new Date()
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

    if (
        message.is_code
    ) {

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
     * Automatic 5-minute removal.
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
                        .length ===
                    0
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


/* =========================================================
   REMOVE EMPTY STATE
========================================================= */

function removeEmptyState() {

    if (
        !messagesContainer
    ) {

        return;
    }


    const empty =
        messagesContainer.querySelector(
            ".empty-state"
        );


    if (
        empty
    ) {

        empty.remove();

    }
}


/* =========================================================
   STATUS
========================================================= */

function setStatus(
    status
) {

    if (
        !connectionStatus
    ) {

        return;
    }


    connectionStatus.textContent =
        status;
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
        !messagesContainer
    ) {

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

        if (
            presenceChannel
        ) {

            try {

                await presenceChannel
                    .untrack();

            } catch (
                error
            ) {

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
         * Stop realtime.
         */

        if (
            realtimeChannel
        ) {

            await supabaseClient
                .removeChannel(
                    realtimeChannel
                );


            realtimeChannel =
                null;
        }


        /*
         * Sign out.
         */

        await supabaseClient.auth
            .signOut();


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


    if (
        codeButton
    ) {

        codeButton.classList.remove(
            "active"
        );

    }


    if (
        codeIndicator
    ) {

        codeIndicator.classList.add(
            "hidden"
        );

    }


    if (
        messageInput
    ) {

        messageInput.value =
            "";


        messageInput.placeholder =
            "Login to send a message...";

    }


    if (
        onlineCount
    ) {

        onlineCount.textContent =
            "0 online";

    }


    disableChatControls();


    setStatus(
        "Ready"
    );


    /*
     * Return to the public PDF.
     */

    showPDFScreen();


    /*
     * Make sure the PDF is still positioned
     * at the current document page.
     */

    updatePDFPageNumber();


    /*
     * Open login after signing out.
     */

    openLogin();
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

        if (
            presenceChannel
        ) {

            try {

                presenceChannel.untrack();

            } catch (
                error
            ) {

                console.error(
                    "Presence cleanup error:",
                    error
                );

            }

        }

    }
);
