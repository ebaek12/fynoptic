// Fix-it Bot chat widget. Ported from js/bot.js — same endpoint, same
// request/response shape, same DOM wiring. The backend is a free Render
// instance that cold-starts (can take 20-50s to respond), hence the 60s
// abort timeout below; there is no loading/pending UI beyond the
// "Typing..." bubble, matching the original.

interface ChatResponse {
  reply?: string;
}

const CHAT_ENDPOINT = 'https://fixitbotbackend.onrender.com/api/chat';

export function initBotChat(): void {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const chatWindowEl = document.getElementById('chat-window');

  // Only wire up the chat if this page actually has one
  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !chatWindowEl) {
    return;
  }

  const chatWindow: HTMLElement = chatWindowEl;

  function appendMessage(text: string, sender: 'user' | 'bot', isTyping = false): void {
    const bubble = document.createElement('div');
    bubble.className = `${sender}-bubble`;
    if (isTyping) bubble.classList.add('typing');
    bubble.textContent = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function removeTypingBubble(): void {
    const typing = chatWindow.querySelector('.bot-bubble.typing');
    if (typing) typing.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, 'user');
    input.value = '';

    appendMessage('Typing...', 'bot', true);

    // The backend is a free Render instance and can cold-start for ~50s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error(`Chat request failed with status ${res.status}`);
        removeTypingBubble();
        appendMessage('⚠️ Something went wrong. Please try again.', 'bot');
        return;
      }

      const data = (await res.json()) as ChatResponse;
      removeTypingBubble();
      appendMessage(data.reply || '⚠️ Something went wrong. Please try again.', 'bot');
    } catch (err) {
      console.error(err);
      removeTypingBubble();
      if (err instanceof DOMException && err.name === 'AbortError') {
        appendMessage('⏳ The assistant is still waking up. Please try again in a moment.', 'bot');
      } else {
        appendMessage('⚠️ Something went wrong. Please try again.', 'bot');
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}
