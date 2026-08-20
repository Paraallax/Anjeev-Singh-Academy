/* =========================================
   PDF.JS
========================================= */

import * as pdfjsLib
    from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";


pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


/* =========================================
   PDF CONFIG
========================================= */

/*
 * PHASE 1:
 *
 * Put your PDF here:
 *
 * pdf/lab.pdf
 *
 * Later this will come from Supabase
 * pdf_documents.
 */

const PDF_URL =
    "./pdf/lab.pdf";


/* =========================================
   STATE
========================================= */

let pdfDocument = null;

let currentPage = 1;

let scale = 1.0;


/* =========================================
   DOM
========================================= */

const pdfPages =
    document.getElementById(
        "pdfPages"
    );


const pdfViewer =
    document.getElementById(
        "pdfViewer"
    );


const pdfLoading =
    document.getElementById(
        "pdfLoading"
    );


const pageNumber =
    document.getElementById(
        "pageNumber"
    );


const pageCount =
    document.getElementById(
        "pageCount"
    );


const prevPage =
    document.getElementById(
        "prevPage"
    );


const nextPage =
    document.getElementById(
        "nextPage"
    );


const zoomOut =
    document.getElementById(
        "zoomOut"
    );


const zoomIn =
    document.getElementById(
        "zoomIn"
    );


const zoomLevel =
    document.getElementById(
        "zoomLevel"
    );


const fullscreenButton =
    document.getElementById(
        "fullscreenButton"
    );


/* =========================================
   LOGIN DOM
========================================= */

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


const loginError =
    document.getElementById(
        "loginError"
    );


const openLoginButton =
    document.getElementById(
        "openLoginButton"
    );


const closeLoginButton =
    document.getElementById(
        "closeLoginButton"
    );


/* =========================================
   INITIALIZE
========================================= */

loadPDF();


/* =========================================
   LOAD PDF
========================================= */

async function loadPDF() {

    try {

        pdfLoading.classList.remove(
            "hidden"
        );


        console.log(
            "Loading PDF:",
            PDF_URL
        );


        pdfDocument =
            await pdfjsLib.getDocument(
                PDF_URL
            ).promise;


        console.log(
            "PDF loaded:",
            pdfDocument.numPages,
            "pages"
        );


        pageCount.textContent =
            pdfDocument.numPages;


        pageNumber.max =
            pdfDocument.numPages;


        await renderAllPages();


        pdfLoading.classList.add(
            "hidden"
        );


        updateNavigation();


    } catch (error) {

        console.error(
            "PDF loading error:",
            error
        );


        pdfLoading.innerHTML = `
            <p>
                Unable to load PDF.
            </p>

            <small>
                Check that
                <strong>pdf/lab.pdf</strong>
                exists.
            </small>
        `;

    }

}


/* =========================================
   RENDER ALL PAGES
========================================= */

async function renderAllPages() {

    pdfPages.innerHTML = "";


    for (
        let pageIndex = 1;
        pageIndex <= pdfDocument.numPages;
        pageIndex++
    ) {

        await renderPage(
            pageIndex
        );

    }

}


/* =========================================
   RENDER SINGLE PAGE
========================================= */

async function renderPage(
    pageNumberValue
) {

    const page =
        await pdfDocument.getPage(
            pageNumberValue
        );


    const viewport =
        page.getViewport({
            scale: scale
        });


    const pageContainer =
        document.createElement(
            "div"
        );


    pageContainer.className =
        "pdf-page";


    pageContainer.dataset.page =
        pageNumberValue;


    const canvas =
        document.createElement(
            "canvas"
        );


    const context =
        canvas.getContext(
            "2d"
        );


    canvas.width =
        viewport.width;


    canvas.height =
        viewport.height;


    pageContainer.appendChild(
        canvas
    );


    pdfPages.appendChild(
        pageContainer
    );


    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

}


/* =========================================
   PAGE NAVIGATION
========================================= */

prevPage.addEventListener(
    "click",
    () => {

        if (currentPage <= 1) {
            return;
        }


        currentPage--;


        scrollToPage(
            currentPage
        );


        updateNavigation();

    }
);


nextPage.addEventListener(
    "click",
    () => {

        if (
            !pdfDocument ||
            currentPage >=
            pdfDocument.numPages
        ) {

            return;
        }


        currentPage++;


        scrollToPage(
            currentPage
        );


        updateNavigation();

    }
);


pageNumber.addEventListener(
    "change",
    () => {

        let value =
            parseInt(
                pageNumber.value,
                10
            );


        if (
            Number.isNaN(value)
        ) {

            value = 1;

        }


        value =
            Math.max(
                1,
                Math.min(
                    value,
                    pdfDocument.numPages
                )
            );


        currentPage =
            value;


        pageNumber.value =
            value;


        scrollToPage(
            value
        );


        updateNavigation();

    }
);


/* =========================================
   SCROLL TO PAGE
========================================= */

function scrollToPage(
    pageNumberValue
) {

    const page =
        document.querySelector(
            `.pdf-page[data-page="${pageNumberValue}"]`
        );


    if (!page) {
        return;
    }


    page.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================
   ZOOM
========================================= */

zoomIn.addEventListener(
    "click",
    async () => {

        scale =
            Math.min(
                scale + 0.2,
                3.0
            );


        await renderAllPages();


        updateZoom();

    }
);


zoomOut.addEventListener(
    "click",
    async () => {

        scale =
            Math.max(
                scale - 0.2,
                0.5
            );


        await renderAllPages();


        updateZoom();

    }
);


function updateZoom() {

    zoomLevel.textContent =
        `${Math.round(scale * 100)}%`;

}


/* =========================================
   NAVIGATION STATE
========================================= */

function updateNavigation() {

    pageNumber.value =
        currentPage;


    prevPage.disabled =
        currentPage <= 1;


    nextPage.disabled =
        !pdfDocument ||
        currentPage >=
        pdfDocument.numPages;

}


/* =========================================
   TRACK CURRENT PAGE
========================================= */

pdfViewer.addEventListener(
    "scroll",
    () => {

        const pages =
            document.querySelectorAll(
                ".pdf-page"
            );


        const viewerRect =
            pdfViewer.getBoundingClientRect();


        let closestPage =
            currentPage;


        let closestDistance =
            Infinity;


        pages.forEach(
            (page) => {

                const rect =
                    page.getBoundingClientRect();


                const distance =
                    Math.abs(
                        rect.top -
                        viewerRect.top
                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;


                    closestPage =
                        parseInt(
                            page.dataset.page,
                            10
                        );

                }

            }
        );


        if (
            closestPage !==
            currentPage
        ) {

            currentPage =
                closestPage;

            pageNumber.value =
                currentPage;

            updateNavigation();

        }

    }
);


/* =========================================
   FULLSCREEN
========================================= */

fullscreenButton.addEventListener(
    "click",
    async () => {

        try {

            if (
                !document.fullscreenElement
            ) {

                await document.documentElement
                    .requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error(
                "Fullscreen error:",
                error
            );

        }

    }
);


/* =========================================
   LOGIN
========================================= */

openLoginButton.addEventListener(
    "click",
    openLogin
);


closeLoginButton.addEventListener(
    "click",
    closeLogin
);


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


function openLogin() {

    loginOverlay.classList.remove(
        "hidden"
    );


    loginError.textContent =
        "";


    setTimeout(
        () => {

            loginIdentifier.focus();

        },
        50
    );

}


function closeLogin() {

    loginOverlay.classList.add(
        "hidden"
    );

}


/* =========================================
   CTRL + SHIFT + L
========================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "l"
        ) {

            event.preventDefault();

            openLogin();

        }


        if (
            event.key === "Escape" &&
            !loginOverlay.classList.contains(
                "hidden"
            )
        ) {

            closeLogin();

        }

    }
);


/* =========================================
   PHASE 1 LOGIN PLACEHOLDER
========================================= */

loginForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        /*
         * Supabase Auth will be connected
         * in Phase 2.
         */

        loginError.textContent =
            "Supabase login will be connected in Phase 2.";

    }
);
