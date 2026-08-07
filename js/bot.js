const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

// Only wire up the chat if this page actually has one
if (form && input && chatWindow) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, "user");
    input.value = "";

    appendMessage("Typing...", "bot", true);

    // The backend is a free Render instance and can cold-start for ~50s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch("https://fixitbotbackend.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal
      });

      if (!res.ok) {
        console.error(`Chat request failed with status ${res.status}`);
        removeTypingBubble();
        appendMessage("⚠️ Something went wrong. Please try again.", "bot");
        return;
      }

      const data = await res.json();
      removeTypingBubble();
      appendMessage(data.reply || "⚠️ Something went wrong. Please try again.", "bot");

    } catch (err) {
      console.error(err);
      removeTypingBubble();
      if (err.name === "AbortError") {
        appendMessage("⏳ The assistant is still waking up. Please try again in a moment.", "bot");
      } else {
        appendMessage("⚠️ Something went wrong. Please try again.", "bot");
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}

function appendMessage(text, sender, isTyping = false) {
  const bubble = document.createElement("div");
  bubble.className = `${sender}-bubble`;
  if (isTyping) bubble.classList.add("typing");
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingBubble() {
  const typing = document.querySelector(".bot-bubble.typing");
  if (typing) typing.remove();
}
