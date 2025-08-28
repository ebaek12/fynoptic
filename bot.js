const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage(userMessage, "user");
  input.value = "";

  appendMessage("Typing...", "bot", true);

  try {
    const res = await fetch("https://fixitbotbackend.onrender.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();
    removeTypingBubble();
    appendMessage(data.reply, "bot");

  } catch (err) {
    console.error(err);
    removeTypingBubble();
    appendMessage("⚠️ Something went wrong. Please try again.", "bot");
  }
});

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
