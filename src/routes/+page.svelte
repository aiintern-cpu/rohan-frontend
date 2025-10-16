<script>
  import { tick } from 'svelte';
  
  const API_BASE_URL = 'https://nonalined-unpurged-winifred.ngrok-free.dev'; 

  let currentPage = 'login'; 

  let loginDetails = { username: '', password: '' };
  let signupDetails = { username: '', email: '', password: '' };
  let userDetails = { nickname: '', age: '', designation: '', location: ''};
  
  let isLoading = false;
  let authError = '';
  let isAiTyping = false;
  
  let loggedInUsername = '';

  let aiFriend = {
    name: 'Rohan',
    avatar: '/avatar.jpeg',
    passions: []
  };
  
  let messages = [];
  let newMessage = '';
  let chatContainer;
  let reactionPaletteOpenFor = null; 
  let replyingToMessage = null;
  let isMenuOpen = false;

  const passions = [
    'Games', 'Gardening', 'Travel', 'Dogs', 'Tea', 'Coffee','Art', 'Shopping', 'Photography', 'Sports', 'Videogames', 'Swimming',
    'Instagram', 'Writing', 'Fishing', 'Cats', 'Politics', 'Working Out',
    'Cooking',  'Music', 'Dancing', 'Netflix',
    'Wine', 'Beer'
  ];
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😠'];

  async function handleLogin() {
    isLoading = true;
    authError = '';
    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginDetails)
      });

      if (response.ok) {
        loggedInUsername = loginDetails.username;
        startChat();
      } else {
        const errorData = await response.json();
        authError = errorData.detail || 'Invalid username or password.';
      }
    } catch (error) {
      console.error('Login failed:', error);
      authError = 'Could not connect to the server. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function completeOnboarding() {
    isLoading = true;
    authError = ''; 
    const onboardingPayload = {
        username: signupDetails.username,
        gmail: signupDetails.email, 
        password: signupDetails.password,
        nickname: userDetails.nickname,
        age: parseInt(userDetails.age, 10), 
        designation: userDetails.designation,
        location: userDetails.location,
        interests: aiFriend.passions 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });

      if (response.ok) {
        loggedInUsername = signupDetails.username;
        startChat(); 
      } else {
        const errorData = await response.json();
        authError = errorData.detail || 'Failed to create account.';
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      authError = 'Could not connect to the server.';
    } finally {
      isLoading = false;
    }
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
            sender: replyingToMessage.sender === 'ai' ? aiFriend.name : 'You' 
        } : null
    };
    messages = [...messages, userMessage];
    newMessage = '';
    replyingToMessage = null;
    isAiTyping = true;
    
    await tick();
    if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: loggedInUsername, 
            message: userMessageText 
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        const aiResponse = {
            id: messages.length + 1,
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
        id: messages.length + 1,
        text: `Sorry, an error occurred: ${error.message}`,
        sender: 'ai',
        reaction: null
      };
      messages = [...messages, errorResponse];
    } finally {
      isAiTyping = false; 
      await tick();
      if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  function handleSignup() { currentPage = 'aboutYou'; }
  function handleAboutYou() { currentPage = 'passions'; }

  function startChat() {
    currentPage = 'chat';
    if (messages.length === 0) {
        messages = [{
            id: 1,
            text: `Hello there! It's so nice to meet you. My name is ${aiFriend.name}. What's on your mind?`,
            sender: 'ai',
            reaction: null 
        }];
    }
  }

  function togglePassion(passion) {
    const index = aiFriend.passions.indexOf(passion);
    if (index > -1) {
      aiFriend.passions.splice(index, 1);
    } else {
      aiFriend.passions.push(passion);
    }
    aiFriend.passions = aiFriend.passions;
  }
  
  function clearChat() { messages = []; isMenuOpen = false; }
  function handleLogout() { currentPage = 'login'; loggedInUsername = ''; messages = []; isMenuOpen = false; }
  function startReply(message) { replyingToMessage = message; document.querySelector('.chat-input')?.focus(); }
  function cancelReply() { replyingToMessage = null; }
  function toggleReactionPalette(messageId) { reactionPaletteOpenFor = reactionPaletteOpenFor === messageId ? null : messageId; }
  function addReaction(messageId, emoji) {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].reaction = messages[messageIndex].reaction === emoji ? null : emoji;
      messages = messages;
    }
    reactionPaletteOpenFor = null;
  }
</script>

<main>
  {#if currentPage === 'login'}
    <div class="auth-container">
      <h2 class="auth-title">Welcome Back</h2>
      <p class="auth-subtitle">Sign in to continue </p>
      <form on:submit|preventDefault={handleLogin} class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" class="form-input"  bind:value={loginDetails.username} required disabled={isLoading}>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-input"  bind:value={loginDetails.password} required disabled={isLoading}>
        </div>
        {#if authError}<p class="error-message">{authError}</p>{/if}
        <button type="submit" class="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      <p class="auth-footer-text">
        Don't have an account? 
        <button on:click={() => { currentPage = 'signup'; authError = ''; }} class="btn-link">Create now</button>
      </p>
    </div>
  {/if}

  {#if currentPage === 'signup'}
    <div class="auth-container">
      <h2 class="auth-title">Create Your Account</h2>
      <form on:submit|preventDefault={handleSignup} class="signup-form">
          <input type="text" bind:value={signupDetails.username} class="form-input" placeholder="Username" required>
          <input type="email" bind:value={signupDetails.email} class="form-input" placeholder="Email" required>
          <input type="password" bind:value={signupDetails.password} class="form-input" placeholder="Password" required>
        <button type="submit" class="btn btn-primary btn-full">Create Account</button>
      </form>
      <p class="auth-footer-text">
        Already have an account? 
        <button on:click={() => { currentPage = 'login'; authError = ''; }} class="btn-link">Login here</button>
      </p>
    </div>
  {/if}

  {#if currentPage === 'aboutYou'}
    <div class="auth-container">
      <h2 class="auth-title">Tell Me About Yourself</h2>
      <p class="auth-subtitle">This will help personalize your experience.</p>
      <form on:submit|preventDefault={handleAboutYou} class="signup-form">
        <input type="text" bind:value={userDetails.nickname} class="form-input" placeholder="Nickname" required>
        <input type="number" bind:value={userDetails.age} class="form-input" placeholder="Age" required>
        <input type="text" bind:value={userDetails.designation} class="form-input" placeholder="Designation (e.g., Student)" required>
        <input type="text" bind:value={userDetails.location} class="form-input" placeholder="Location (e.g., New York)" required>
       <button type="submit" class="btn btn-primary btn-full">Continue</button>
      </form>
    </div>
  {/if}

  {#if currentPage === 'passions'}
    <div class="onboarding-container">
      <div class="onboarding-step">
        <h2 class="auth-title">Choose Passions</h2>
        <p class="auth-subtitle">Select a few things you're interested in.</p>
        {#if authError}<p class="error-message">{authError}</p>{/if}
        <div class="passions-grid">
          {#each passions as passion}
            <button on:click={() => togglePassion(passion)} class="passion-btn" class:selected={aiFriend.passions.includes(passion)}>
              {passion}
            </button>
          {/each}
        </div>
      </div>
      <button on:click={completeOnboarding} class="btn btn-primary btn-onboarding-next" disabled={isLoading}>
        { isLoading ? 'Finishing...' : 'Start Chatting' }
      </button>
    </div>
  {/if}
  
  {#if currentPage === 'chat'}
    <div class="chat-window">
      <header class="chat-header">
        <div class="friend-info">
          <img src={aiFriend.avatar} alt="{aiFriend.name}'s avatar" class="header-avatar">
          <div>
            <h3>{aiFriend.name}</h3>
          </div>
        </div>
        <div class="header-menu-container">
            <button on:click={() => isMenuOpen = !isMenuOpen} title="Menu" class="menu-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
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
                    <strong>Replying to {replyingToMessage.sender === 'ai' ? aiFriend.name : 'You'}</strong>
                    <p>{replyingToMessage.text}</p>
                </div>
                <button class="cancel-reply-btn" on:click={cancelReply}>&times;</button>
            </div>
        {/if}
        <form on:submit|preventDefault={sendMessage} class="message-form">
          <input type="text" bind:value={newMessage} placeholder="Type your message..." class="chat-input" disabled={isAiTyping}>
          <button type="submit" class="send-btn" disabled={isAiTyping}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </footer>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif;
  }

  main {
    background-color: #111827;
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-image: linear-gradient(to bottom right, #111827, #4c1d95, #111827);
  }

  .auth-container {
    width: 100%;
    max-width: 28rem; 
    background-color: rgba(31, 41, 55, 0.5); 
    backdrop-filter: blur(4px); 
    padding: 2rem; 
    border-radius: 1rem; 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(168, 85, 247, 0.1); 
  }

  .auth-title {
    font-size: 30px; 
    font-weight: 700; 
    text-align: center;
    margin-bottom: 0.5rem; 
  }

  .auth-subtitle {
    text-align: center;
    color: #9ca3af; 
    margin-bottom: 2rem; 
    font-size: 18px;
  }

  .auth-footer-text {
    text-align: center;
    color: #9ca3af; 
    margin-top: 1.5rem; 
  }

  .signup-form {
    display: flex;
    flex-direction: column;
    gap: 1rem; 
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }
  .form-group:last-child {
    margin-bottom: 1.5rem;
  }
  .form-group label {
    display: block;
    color: #d1d5db; 
    font-size: 18px; 
    font-weight: 500; 
    margin-bottom: 0.5rem;
  }
  
  .form-input {
    width: 100%;
    box-sizing: border-box; 
    padding: 0.75rem 1rem; 
    background-color: rgba(55, 65, 81, 0.5); 
    border: 1px solid #4b5563; 
    border-radius: 0.5rem; 
    transition: all 150ms ease-in-out;
    color: white;
  }

  .form-input::placeholder {
    color: #6b7280;
  }
  .form-input:focus {
    outline: none;
    border-color: #a855f7; 
    box-shadow: 0 0 0 2px #a855f7; 
  }

  .btn {
    border: none;
    cursor: pointer;
    font-family:  sans-serif;
  }
  
  .btn-primary {
    background-color: #9333ea; 
    color: white;
    font-weight: 700;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: large;
    transition: transform 150ms ease-in-out, background-color 150ms ease-in-out;
  }
  .btn-primary.btn-full {
      width: 50%;
      margin-left: 25%;
  }
  .btn-primary:hover {
    background-color: #7e22ce; 
    transform: scale(1.02);
  }

  .btn-link {
    background: none;
    color: #c084fc; 
    font-weight: 600;
  }
  .btn-link:hover {
    color: #d8b4fe; 
  }
  
  .onboarding-container {
    width: 100%;
    max-width: 48rem; 
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(31, 41, 55, 0.5);
    padding: 2rem;
    border-radius: 1rem;
  }
  
  .onboarding-step h2 {
    font-size: 2.25rem; 
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .passions-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  .passion-btn {
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 150ms ease-in-out;
    background-color: #374151; 
    color: #d1d5db; 
    border: none;
    cursor: pointer;
  }
  .passion-btn:not(.selected):hover {
    background-color: #4b5563; 
  }
  .passion-btn.selected {
    background-color: #9333ea; 
    color: white;
  }

  .btn-onboarding-next {
    margin-top: 2.5rem;
    padding-left: 3rem;
    padding-right: 3rem;
    font-size: 1.125rem; 
    width: auto;
  }
  
  .chat-window {
    width: 100%;
    height: 90vh;
    max-width: 48rem; 
    display: flex;
    flex-direction: column;
    background-color: rgba(31, 41, 55, 0.7);
    backdrop-filter: blur(4px);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(168, 85, 247, 0.2);
    overflow: hidden;
  }
  
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #374151;
  }
  .friend-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .friend-info h3 {
    font-weight: 700;
    font-size: 1.125rem;
    margin: 0;
  }
  .header-avatar {
    width: 3rem;
    height: 3rem;
    object-fit: cover;
    border-radius: 9999px;
  }
  .menu-btn {
    padding: 0.5rem;
    border-radius: 9999px;
    transition: background-color 150ms ease-in-out;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
  }
  .menu-btn:hover {
    background-color: #374151;
  }
  .header-menu-container {
      position: relative;
  }
  .header-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: #1f2937;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      z-index: 20;
      width: 150px;
      overflow: hidden;
      margin-top: 0.5rem;
  }
  .menu-item {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      color: #d1d5db;
      text-align: left;
      cursor: pointer;
      font-size: 0.875rem;
  }
  .menu-item:hover {
      background-color: #374151;
  }


  .messages-area {
    flex-grow: 1;
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem; 
  }

  .message-container {
    display: flex;
    position: relative; 
  }
  .message-container.user {
    justify-content: flex-end;
  }
  
  .message-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .user .message-wrapper {
    flex-direction: row-reverse;
  }

  .message-bubble {
    max-width: 80%; 
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    word-wrap: break-word;
    position: relative;
  }
  .message-bubble.ai {
    background-color: #374151;
    border-bottom-left-radius: 0.5rem;
  }
  .message-bubble.user {
    background-color: #9333ea;
    border-bottom-right-radius: 0.5rem;
  }
  .message-bubble p {
    margin: 0;
  }

  .chat-footer {
    padding: 1rem;
    border-top: 1px solid #374151;
    transition: padding-top 0.2s ease-in-out;
  }
  .message-form {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .chat-input {
    flex-grow: 1;
    padding: 0.75rem 1rem;
    background-color: #374151;
    border-radius: 9999px;
    border: none;
    color: white;
    transition: all 150ms ease-in-out;
  }
  .chat-input::placeholder {
    color: #9ca3af;
  }
  .chat-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px #a855f7;
  }
  .send-btn {
    background-color: #9333ea;
    color: white;
    padding: 0.75rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease-in-out, background-color 150ms ease-in-out;
  }
  .send-btn:hover {
    background-color: #7e22ce;
    transform: scale(1.1);
  }

  .reaction-controls {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .add-reaction-btn {
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    border-radius: 9999px;
    opacity: 0; 
    transition: opacity 150ms ease-in-out, background-color 150ms ease-in-out;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .message-wrapper:hover .add-reaction-btn {
    opacity: 1;
  }
  .add-reaction-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .reaction-palette {
    position: absolute;
    bottom: 100%;
    margin-bottom: 0.5rem;
    background-color: #1f2937;
    padding: 0.5rem;
    border-radius: 9999px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    display: flex;
    gap: 0.25rem;
    z-index: 10;
  }
  .user .reaction-palette {
    right: 0;
  }
  .ai .reaction-palette {
    left: 0;
  }

  .reaction-palette button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0.25rem;
    transition: transform 100ms ease-in-out;
  }
  .reaction-palette button:hover {
    transform: scale(1.2);
  }

  .displayed-reaction {
    position: absolute;
    bottom: -0.75rem;
    right: 0.5rem;
    background-color: #4b5563; 
    border: 2px solid #1f2937;
    border-radius: 9999px;
    font-size: 0.75rem;
    padding: 0.1rem 0.3rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .reply-preview {
      background-color: rgba(75, 85, 99, 0.2);
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      border-radius: 0.75rem;
      border-left: 3px solid #a855f7;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  .reply-preview p {
      margin: 0;
      font-size: 0.875rem;
      color: #d1d5db;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
  }
  .reply-preview strong {
      font-weight: 600;
      color: #a855f7;
  }
  .cancel-reply-btn {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0.25rem;
  }
  .quoted-reply {
      background-color: rgba(0,0,0,0.2);
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      border-left: 2px solid #a855f7;
  }
  .quoted-reply strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #d8b4fe;
  }
   .quoted-reply p {
      font-size: 0.875rem;
      color: #d1d5db;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
  }
</style>