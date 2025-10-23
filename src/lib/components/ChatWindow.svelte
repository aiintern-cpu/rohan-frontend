<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import { availableReactions } from '$lib/constants/reactions.js'; 

  export let friendName;
  export let friendAvatar;
  export let username;
  export let apiBaseUrl;
  export let initialWelcomeMessage;

  const dispatch = createEventDispatcher();

  let isAiTyping = false;
  let messages = [];
  let newMessage = '';
  let chatContainer;
  let reactionPaletteOpenFor = null;
  let replyingToMessage = null;
  
  let isMenuOpen = false;

  $: if (initialWelcomeMessage && messages[0] !== initialWelcomeMessage) {
    messages = [initialWelcomeMessage];
  }

  onMount(() => {
    if (!messages.length && initialWelcomeMessage) {
      messages = [initialWelcomeMessage];
    }
  });

  async function scrollBottom() {
    await tick();
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendMessage() {
    if (newMessage.trim() === '' || isAiTyping) return;

    const userMessageText = newMessage;
    const userMessage = {
      id: messages.length + 1,
      text: userMessageText,
      sender: 'user',
      reaction: null,
      replyingTo: replyingToMessage ? {
        text: replyingToMessage.text,
        sender: replyingToMessage.sender === 'ai' ? friendName : 'You'
      } : null
    };
    messages = [...messages, userMessage];
    newMessage = '';
    replyingToMessage = null;
    isAiTyping = true; 

    scrollBottom(); 

    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          message: userMessageText
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        const aiReplyText = aiData.reply;

        const wordCount = aiReplyText.split(' ').length;
        const typingSpeedMsPerWord = 100;
        const minDelay = 500;
        const calculatedDelay = Math.max(minDelay, wordCount * typingSpeedMsPerWord);
        
        const aiResponse = {
          id: messages.length + 1,
          text: aiReplyText,
          sender: 'ai',
          reaction: null
        };
        
        setTimeout(() => {
          messages = [...messages, aiResponse];
          isAiTyping = false;
          scrollBottom();
        }, calculatedDelay);

      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get a response.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: messages.length + 1,
        text: `Sorry, an error occurred: ${error.message}`,
        sender: 'ai',
        reaction: null
      };
      messages = [...messages, errorResponse];
      isAiTyping = false;
      scrollBottom();
    }
  }

  
  function clearChat() {
    messages = [initialWelcomeMessage];
    isMenuOpen = false;
  }

  function handleLogout() {
    isMenuOpen = false;
    dispatch('logout');
  }
  

  function startReply(message) {
    replyingToMessage = message;
    const input = document.querySelector('.chat-input');
    if (input) input.focus();
  }

  function cancelReply() {
    replyingToMessage = null;
  }

  function toggleReactionPalette(messageId) {
    reactionPaletteOpenFor = reactionPaletteOpenFor === messageId ? null : messageId;
  }

  function addReaction(messageId, emoji) {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].reaction = messages[messageIndex].reaction === emoji ? null : emoji;
      messages = messages;
    }
    reactionPaletteOpenFor = null;
  }
</script>

<div class="chat-window">
  <header class="chat-header">
    <div class="friend-info">
      <img src={friendAvatar} alt="{friendName}'s avatar" class="header-avatar">
      <div>
        <h3>{friendName}</h3>
      </div>
    </div>
    
    <div class="header-menu-container">
      <button on:click={() => isMenuOpen = !isMenuOpen} title="Menu" class="menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>
      {#if isMenuOpen}
        <div class="header-menu">
          <button class="menu-item" on:click={handleLogout}>Logout</button>
          <button class="menu-item" on:click={clearChat}>Delete Chat</button>
        </div>
      {/if}
    </div>
    </header>

  <div bind:this={chatContainer} class="messages-area">
    {#each messages as message (message.id)}
      <div class="message-container" class:user={message.sender === 'user'}>
        <div class="message-wrapper">
          <div class="message-bubble" class:user={message.sender === 'user'} class:ai={message.sender === 'ai'}>
            {#if message.replyingTo}
              <div class="quoted-reply">
                <strong>{message.replyingTo.sender}</strong>
                <p>{message.replyingTo.text}</p>
              </div>
            {/if}
            <p>{message.text}</p>
            {#if message.reaction}
              <div class="displayed-reaction">{message.reaction}</div>
            {/if}
          </div>
          <div class="reaction-controls">
            <button class="add-reaction-btn" title="Reply" on:click={() => startReply(message)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.921 11.9 1.353 8.62a.719.719 0 0 1 0-1.238L5.921 4.1A.719.719 0 0 1 7 4.719V6c1.5 0 6 0 7 8-2.5-4.5-7-4-7-4v1.281c0 .56-.606.898-1.079.62z"/></svg>
            </button>
            <button class="add-reaction-btn" title="React" on:click={() => toggleReactionPalette(message.id)}>
              🙂
            </button>
            {#if reactionPaletteOpenFor === message.id}
              <div class="reaction-palette">
                {#each availableReactions as emoji}
                  <button on:click={() => addReaction(message.id, emoji)}>
                    {emoji}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
    {#if isAiTyping}
      <div class="message-container">
        <div class="message-wrapper">
          <div class="message-bubble ai typing-indicator">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <footer class="chat-footer">
    {#if replyingToMessage}
      <div class="reply-preview">
        <div>
          <strong>Replying to {replyingToMessage.sender === 'ai' ? friendName : 'You'}</strong>
          <p>{replyingToMessage.text}</p>
        </div>
        <button class="cancel-reply-btn" on:click={cancelReply}>&times;</button>
      </div>
    {/if}
    
    <form on:submit|preventDefault={sendMessage} class="message-form">
      <div class="chat-input-wrapper">
        
        <input 
          type="text" 
          bind:value={newMessage} 
          placeholder="Type your message" 
          class="chat-input" 
          disabled={isAiTyping}
          on:keydown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { sendMessage(); e.preventDefault(); }}}
        >
        
        <button type="submit" class="input-icon-btn send-btn" disabled={isAiTyping || newMessage.trim() === ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
        </button>
      </div>
    </form>
    </footer>
</div>