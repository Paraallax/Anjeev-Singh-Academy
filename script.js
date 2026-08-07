const SUPABASE_URL = "https://izobeyuplyramoojazdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_fftKRus4w4NXriH07kWvQg_Up9qWpy6";

/* Create Supabase client ONCE */
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================
   STATE
========================================== */

let currentUsername = "";
let realtimeChannel = null;


/* ==========================================
   DOM ELEMENTS
========================================== */

const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");

const joinForm = document.getElementById("joinForm");
const usernameInput = document.getElementById("username");

const currentUser = document.getElementById("currentUser");
const connectionStatus = document.getElementById("connectionStatus");

const messagesContainer = document.getElementById("messages");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const leaveButton = document.getElementById("leaveButton");


/* ==========================================
   JOIN CHAT
========================================== */

joinForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = usernameInput.value.trim();

    if (!name) {
        return;
    }

    currentUsername = name.substring(0, 30);

    currentUser.textContent = currentUsername;

    joinScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    await loadMessages();

    subscribeToMessages();

    messageInput.focus();
});


/* ==========================================
   LOAD MESSAGES
========================================== */

async function loadMessages() {

    setStatus("Loading...");

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", {
            ascending: true
        });

    if (error) {

        console.error("Load messages error:", error);

        setStatus("Database error");

        return;
    }

    messagesContainer.innerHTML = "";

    if (!data || data.length === 0) {

        showEmptyState();

    } else {

        data.forEach(addMessage);
    }

    setStatus("Online");

    scrollToBottom();
}


/* ==========================================
   REALTIME
========================================== */

function subscribeToMessages() {

    if (realtimeChannel) {

        supabaseClient.removeChannel(
            realtimeChannel
        );
    }

    realtimeChannel = supabaseClient
        .channel("labchat-messages")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages"
            },
            (payload) => {

                removeEmptyState();

                addMessage(payload.new);

                scrollToBottom();
            }
        )

        .subscribe((status) => {

            console.log(
                "Realtime status:",
                status
            );

            if (status === "SUBSCRIBED") {

                setStatus("Online");

            } else if (
                status === "CHANNEL_ERROR"
            ) {

                setStatus("Realtime unavailable");
            }
        });
}


/* ==========================================
   SEND MESSAGE
========================================== */

messageForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text || !currentUsername) {
        return;
    }

    sendButton.disabled = true;

    const { error } = await supabaseClient
        .from("messages")
        .insert({
            username: currentUsername,
            message: text
        });

    if (error) {

        console.error(
            "Send message error:",
            error
        );

        alert(
            "Message could not be sent."
        );

    } else {

        messageInput.value = "";

        messageInput.focus();
    }

    sendButton.disabled = false;
});


/* ==========================================
   DISPLAY MESSAGE
========================================== */

function addMessage(message) {

    if (!message) {
        return;
    }

    const expires =
        new Date(message.expires_at);

    if (
        Number.isNaN(expires.getTime()) ||
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
        document.createElement("article");

    messageElement.className = "message";

    messageElement.dataset.messageId =
        message.id;

    if (
        message.username === currentUsername
    ) {
        messageElement.classList.add("mine");
    }

    const header =
        document.createElement("div");

    header.className =
        "message-header";

    const username =
        document.createElement("span");

    username.className =
        "message-user";

    username.textContent =
        message.username;

    const time =
        document.createElement("span");

    time.className =
        "message-time";

    time.textContent =
        formatTime(message.created_at);

    header.appendChild(username);
    header.appendChild(time);

    const text =
        document.createElement("div");

    text.className =
        "message-text";

    text.textContent =
        message.message;

    linkify(text);

    messageElement.appendChild(header);
    messageElement.appendChild(text);

    messagesContainer.appendChild(
        messageElement
    );

    const remaining =
        expires.getTime() - Date.now();

    if (remaining > 0) {

        setTimeout(() => {

            messageElement.remove();

            if (
                messagesContainer.children.length === 0
            ) {

                showEmptyState();
            }

        }, remaining);
    }
}


/* ==========================================
   LINKIFY
========================================== */

function linkify(element) {

    const text = element.textContent;

    const urlRegex =
        /(https?:\/\/[^\s]+)/g;

    const parts =
        text.split(urlRegex);

    element.textContent = "";

    parts.forEach((part) => {

        if (
            /^https?:\/\//i.test(part)
        ) {

            const link =
                document.createElement("a");

            link.href = part;

            link.textContent = part;

            link.target = "_blank";

            link.rel =
                "noopener noreferrer";

            element.appendChild(link);

        } else {

            element.appendChild(
                document.createTextNode(part)
            );
        }
    });
}


/* ==========================================
   TIME
========================================== */

function formatTime(timestamp) {

    return new Date(timestamp)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
}


/* ==========================================
   EMPTY STATE
========================================== */

function showEmptyState() {

    if (
        document.querySelector(".empty-state")
    ) {
        return;
    }

    const empty =
        document.createElement("div");

    empty.className =
        "empty-state";

    const title =
        document.createElement("strong");

    title.textContent =
        "No messages yet";

    const subtitle =
        document.createTextNode(
            "Start the conversation."
        );

    empty.appendChild(title);

    empty.appendChild(subtitle);

    messagesContainer.appendChild(empty);
}


function removeEmptyState() {

    const empty =
        document.querySelector(
            ".empty-state"
        );

    if (empty) {
        empty.remove();
    }
}


/* ==========================================
   STATUS
========================================== */

function setStatus(status) {

    connectionStatus.textContent =
        status;
}


/* ==========================================
   SCROLL
========================================== */

function scrollToBottom() {

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


/* ==========================================
   LEAVE
========================================== */

leaveButton.addEventListener("click", async () => {

    currentUsername = "";

    if (realtimeChannel) {

        await supabaseClient.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }

    messagesContainer.innerHTML = "";

    chatScreen.classList.add("hidden");

    joinScreen.classList.remove("hidden");

    usernameInput.value = "";

    messageInput.value = "";
});