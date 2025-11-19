<!-- 
<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import { availableReactions } from '$lib/constants/reactions.js';

  export let friendName;
  export let friendAvatar;
  export let username;
  export let apiBaseUrl;

  export let initialHistory = [];
  export let initialWelcomeMessage = null;

  const dispatch = createEventDispatcher();

  let messages = [];
  let isAiTyping = false;
  let newMessage = '';
  let reactionPaletteOpenFor = null;
  let replyingToMessage = null;
  let isMenuOpen = false;
  let chatContainerEl;

  let isLoadingMore = false;
  let currentOffset = 0;
  let limit = 10;
  let allHistoryLoaded = false;

  onMount(() => {
    messages = formatHistory(initialHistory); 
    if (initialWelcomeMessage && initialWelcomeMessage.text) {
      messages.push(initialWelcomeMessage);
    }
    currentOffset = initialHistory.length; // Set initial offset
    if (initialHistory.length < limit) { // Check if all loaded initially
      allHistoryLoaded = true;
    }
    setTimeout(scrollBottom, 50);
  });

  async function scrollBottom() {
    await tick();
    if (chatContainerEl) chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
  }

  // --- THIS FUNCTION IS CORRECTED ---
  // Helper function to format the backend history
  function formatHistory(backendHistory = []) {
    let formattedMessages = [];
    backendHistory.forEach((convo, index) => { 
      if (convo.user) {
        formattedMessages.push({
          id: `hist_${index}_user`,
          text: convo.user,
          sender: 'user',
          reaction: null
        });
      }
      if (convo.rohan) {
        formattedMessages.push({
          id: `hist_${index}_ai`,
          text: convo.rohan,
          sender: 'ai',
          reaction: null
        });
      }
      else if (convo.sender && convo.message) {
         formattedMessages.push({
          id: convo.id || `hist_${Date.now()}_${index}_${convo.sender}`, 
          text: convo.message,
          sender: convo.sender.toLowerCase() === username.toLowerCase() ? 'user' : 'ai',
          reaction: null
        });
      }
    });
    return formattedMessages;
  }
  // --- END CORRECTION ---


  async function loadMoreHistory() {
    if (isLoadingMore || allHistoryLoaded) return;

    isLoadingMore = true;
    console.log(`Loading more history, offset: ${currentOffset}, limit: ${limit}`);

    const oldScrollHeight = chatContainerEl.scrollHeight;
    const oldScrollTop = chatContainerEl.scrollTop;

    try {
      const params = new URLSearchParams({
        username: username,
        offset: currentOffset.toString(),
        limit: limit.toString()
      });
      const historyUrl = `${apiBaseUrl}/history?${params.toString()}`;

      const response = await fetch(historyUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
         }});

      if (!response.ok) {
        let errorDetail = `Status: ${response.status}`;
        try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; }
        catch (e) { /* ignore */ }
        throw new Error(`Failed to fetch older history: ${errorDetail}`);
      }

      const historyData = await response.json();
      const olderConversations = historyData.conversations || [];
      console.log(`Received ${olderConversations.length} older messages.`);

      if (olderConversations.length > 0) {
        const formattedOlderMessages = formatHistory(olderConversations);
        // Prepend older messages
        messages = [...formattedOlderMessages, ...messages];
        currentOffset += olderConversations.length;

        if (olderConversations.length < limit) {
          console.log("All history loaded.");
          allHistoryLoaded = true;
        }

        await tick();
        const newScrollHeight = chatContainerEl.scrollHeight;
        chatContainerEl.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);

      } else {
        console.log("No more older messages found. All history loaded.");
        allHistoryLoaded = true;
      }

    } catch (error) {
      console.error('Failed to load more history:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  function handleScroll() {
    if (chatContainerEl && chatContainerEl.scrollTop < 50) {
      loadMoreHistory();
    }
  }


  async function sendMessage() {
    if (newMessage.trim() === '' || isAiTyping) return;
    const userMessageText = newMessage;
    const tempUserMessage = {
      id: `temp_${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      reaction: null,
      replyingTo: replyingToMessage ? {
        text: replyingToMessage.text,
        sender: replyingToMessage.sender === 'ai' ? friendName : 'You'
      } : null
    };
    messages = [...messages, tempUserMessage];
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
        const aiResponse = {
          id: `ai_${Date.now()}`,
          text: aiData.reply,
          sender: 'ai',
          reaction: null
        };
        messages = [...messages, aiResponse];

      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get a response.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: `err_${Date.now()}`,
        text: `Sorry, an error occurred: ${error.message}`,
        sender: 'ai',
        reaction: null
      };
      messages = [...messages, errorResponse];
    } finally {
      isAiTyping = false;
      scrollBottom();
    }
  }

  function handleDeleteChat() {
    isMenuOpen = false;
    dispatch('deleteChat');
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
          <button class="menu-item" on:click={handleDeleteChat}>Delete Chat</button>
        </div>
      {/if}
    </div>
  </header>

  <div class="messages-area" bind:this={chatContainerEl} on:scroll={handleScroll}>

    {#if isLoadingMore}
      <div class="loading-spinner">
        <span>Loading older messages...</span>
      </div>
    {/if}

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
          placeholder="Ask anything"
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
 -->

<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import { availableReactions } from '$lib/constants/reactions.js';

  export let friendName;
  export let friendAvatar;
  export let username;
  export let apiBaseUrl;

  export let initialHistory = []; 
  export let initialWelcomeMessage = null;

  const dispatch = createEventDispatcher();

  let messages = [];
  let isAiTyping = false;
  let newMessage = '';
  let reactionPaletteOpenFor = null;
  let replyingToMessage = null;
  let isMenuOpen = false;
  let chatContainerEl;

  let isLoadingMore = false; 
  let currentOffset = 0;
  let limit = 20; 
  let allHistoryLoaded = false;
  let scrollThreshold = 800; // Pixels from top to trigger loading earlier
  
  onMount(() => {
    messages = formatHistory(initialHistory);
    if (initialWelcomeMessage && initialWelcomeMessage.text) {
      messages.push(initialWelcomeMessage); 
    }
    currentOffset = initialHistory.length; 
    if (initialHistory.length < limit) { 
      allHistoryLoaded = true;
      console.log("All history likely loaded initially.");
    } else {
        console.log(`Initial load: ${initialHistory.length} messages.`);
    }
    setTimeout(scrollBottom, 50);
  });

  async function scrollBottom() {
    await tick(); 
    if (chatContainerEl) chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
  }

  function formatHistory(backendHistory = []) {
    let formattedMessages = [];
    backendHistory.forEach((convo, index) => {
      if (convo.sender && convo.message) {
         formattedMessages.push({
          id: convo.id || `hist_${Date.now()}_${index}_${convo.sender}`, 
          text: convo.message,
          sender: convo.sender.toLowerCase() === username.toLowerCase() ? 'user' : 'ai',
          reaction: null
        });
      }
      else if (convo.user) {
        formattedMessages.push({ id: `hist_${index}_user`, text: convo.user, sender: 'user', reaction: null });
      }
      if (convo.rohan) {
        formattedMessages.push({ id: `hist_${index}_ai`, text: convo.rohan, sender: 'ai', reaction: null });
      }
    });
    return formattedMessages;
  }


  async function loadMoreHistory() {
    if (isLoadingMore || allHistoryLoaded) return;

    isLoadingMore = true; 
    console.log(`Attempting to load more history, offset: ${currentOffset}, limit: ${limit}`);
    const oldScrollHeight = chatContainerEl.scrollHeight;
    const oldScrollTop = chatContainerEl.scrollTop;

    try {
      const params = new URLSearchParams({
        username: username,
        offset: currentOffset.toString(),
        limit: limit.toString()
      });
      const historyUrl = `${apiBaseUrl}/history?${params.toString()}`;

      const response = await fetch(historyUrl, { method: 'GET',  headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
         } });

      if (!response.ok) {
        let errorDetail = `Status: ${response.status}`;
        try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; }
        catch (e) {  }
        console.error(`Failed to fetch older history: ${errorDetail}`); 
        allHistoryLoaded = true; 
        return; 
      }

      const historyData = await response.json();
      const olderConversations = historyData.conversations || []; 
      console.log(`Received ${olderConversations.length} older messages.`);

      if (olderConversations.length > 0) {
        const formattedOlderMessages = formatHistory(olderConversations);
        messages = [...formattedOlderMessages, ...messages];
        currentOffset += olderConversations.length;

        if (olderConversations.length < limit) {
          console.log("All history loaded.");
          allHistoryLoaded = true;
        }
        await tick();
        const newScrollHeight = chatContainerEl.scrollHeight;
        const heightDifference = newScrollHeight - oldScrollHeight;
        chatContainerEl.scrollTop = oldScrollTop + heightDifference;

      } else {
        console.log("No more older messages found. All history loaded.");
        allHistoryLoaded = true;
      }

    } catch (error) {
      console.error('Unexpected error loading more history:', error);
      allHistoryLoaded = true; 
    } finally {
      isLoadingMore = false; 
    }
  }

  function handleScroll() {
    if (chatContainerEl && chatContainerEl.scrollTop < scrollThreshold) {
      loadMoreHistory();
    }
  }


  async function sendMessage() {
  if (newMessage.trim() === '' || isAiTyping) return;

  const userMessageText = newMessage;
  const tempUserMessage = {
    id: `temp_${Date.now()}`,
    text: userMessageText,
    sender: 'user',
    reaction: null,
    replyingTo: replyingToMessage ? {
      text: replyingToMessage.text,
      sender: replyingToMessage.sender === 'ai' ? friendName : 'You'
    } : null
  };

  messages = [...messages, tempUserMessage];
  newMessage = '';
  replyingToMessage = null;
  isAiTyping = true;
  scrollBottom();

  try {
    const token = localStorage.getItem('jwtToken'); // ⬅️ Get token

    const response = await fetch(`${apiBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`   // ⬅️ Add JWT here
      },
      body: JSON.stringify({
        username: username,
        message: userMessageText
      })
    });

    if (response.ok) {
      const aiData = await response.json();
      const aiResponse = {
        id: `ai_${Date.now()}`,
        text: aiData.reply,
        sender: 'ai',
        reaction: null
      };
      messages = [...messages, aiResponse];
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get a response.');
    }
  } catch (error) {
    console.error('Chat error:', error);
    const errorResponse = {
      id: `err_${Date.now()}`,
      text: `Sorry, an error occurred: ${error.message}`,
      sender: 'ai',
      reaction: null
    };
    messages = [...messages, errorResponse];
  } finally {
    isAiTyping = false;
    scrollBottom();
  }
}


  function handleDeleteChat() {
    isMenuOpen = false;
    dispatch('deleteChat');
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
          <button class="menu-item" on:click={handleDeleteChat}>Delete Chat</button>
        </div>
      {/if}
    </div>
  </header>

  <!-- Messages area with scroll handler -->
  <div class="messages-area" bind:this={chatContainerEl} on:scroll={handleScroll}>

    <!-- Loading indicator is REMOVED from the template -->

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
          placeholder="Ask anything"
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

