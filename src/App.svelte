<script>
  import Login from '$lib/components/Login.svelte';
  import Signup from '$lib/components/Signup.svelte';
  import AboutYou from '$lib/components/AboutYou.svelte';
  import Passions from '$lib/components/Passions.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';

  const API_BASE_URL = 'https://nonalined-unpurged-winifred.ngrok-free.dev';

  let currentPage = 'login';
  let isLoading = false;
  let authError = '';
  let loggedInUsername = '';

  let chatKey = Date.now();

  let loginDetails = { username: '', password: '' };
  let signupDetails = { username: '', email: '', password: '' };
  let userDetails = { nickname: '', age: '', designation: '', location: '' };

  let aiFriend = {
    name: 'Rohan',
    avatar: '/avatar.jpeg',
    passions: []
  };

  let initialHistory = [];
  let initialWelcomeMessage = null;

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
        await loadHistoryAndStartChat();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          authError = errorData.detail;
        } else {
          authError = 'Invalid username or password.';
        }
        isLoading = false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      authError = 'Could not connect to the server. Please try again.';
      isLoading = false;
    }
  }

  async function completeOnboarding() {
    isLoading = true;
    authError = '';

    const onboardingPayload = {
      username: signupDetails.username,
      email: signupDetails.email,
      password: signupDetails.password,
      nickname: userDetails.nickname,
      age: parseInt(userDetails.age, 10),
      designation: userDetails.designation,
      location: userDetails.location,
      likes: aiFriend.passions
    };

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });

      if (response.ok) {
        loggedInUsername = signupDetails.username;
        initialHistory = [];
        initialWelcomeMessage = {
          id: 'init_reply_signup',
          text: `Welcome, ${userDetails.nickname || loggedInUsername}! It's great to meet you. My name is ${aiFriend.name}. What's on your mind?`,
          sender: 'ai',
          reaction: null
        };
        startChat();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          authError = errorData.detail;
        } else if (Array.isArray(errorData.detail) && errorData.detail[0] && errorData.detail[0].msg) {
          authError = `Error: ${errorData.detail[0].msg}`;
        } else {
          authError = 'Failed to create account. Please check details.';
        }
        isLoading = false;
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      authError = 'Could not connect to the server.';
      isLoading = false;
    }
  }

  async function loadHistoryAndStartChat() {
    authError = 'Loading chat history...';
    isLoading = true;
    console.log("Attempting to load history for:", loggedInUsername);

    let response; 

    try {
      const params = new URLSearchParams({ username: loggedInUsername });
      const historyUrl = `${API_BASE_URL}/history?${params.toString()}`;
      console.log("Fetching history from:", historyUrl);

      response = await fetch(historyUrl, { 
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
         }
      });
      console.log("History fetch response status:", response.status);

      
      let historyData;
      try {
        historyData = await response.clone().json();
      } catch (jsonError) {
        const errorText = await response.text();
        console.error("Non-JSON error response received from /history:", errorText.substring(0, 500));
        throw new Error(`Backend sent an invalid (non-JSON) response. Status: ${response.status}`);
      }
      if (!response.ok) {
         const errorDetail = historyData.detail || `Server responded with status ${response.status}`;
         throw new Error(`Failed to fetch history: ${errorDetail}`);
      }

      console.log("Received and parsed history data:", historyData);
      initialHistory = historyData.conversations || [];
      initialWelcomeMessage = null; 
      startChat(); 

    } catch (error) {
      console.error('History load failed:', error);
      authError = `Could not load your chat history: ${error.message}`;
      currentPage = 'login';
      isLoading = false; 
    }
  }
  


  function navigate(event) {
    currentPage = event.detail;
    authError = '';
  }

  function handleSignup() {
    currentPage = 'aboutYou';
  }

  function handleAboutYou() {
    currentPage = 'passions';
  }

  function startChat() {
    currentPage = 'chat';
    isLoading = false;
    authError = '';
    chatKey = Date.now();
  }

  function handleLogout() {
    currentPage = 'login';
    loggedInUsername = '';
    loginDetails = { username: '', password: '' };
    signupDetails = { username: '', email: '', password: '' };
    userDetails = { nickname: '', age: '', designation: '', location: '' };
    aiFriend.passions = [];
    initialHistory = [];
    initialWelcomeMessage = null;
  }

  function handleChatReset() {
    console.warn("Frontend chat reset called. Implement backend history clearing.");
    chatKey = Date.now();
  }

</script>

<main>
  {#if currentPage === 'chat'}
    <ChatWindow
      key={chatKey}
      username={loggedInUsername}
      friendName={aiFriend.name}
      friendAvatar={aiFriend.avatar}
      apiBaseUrl={API_BASE_URL}
      initialHistory={initialHistory}
      initialWelcomeMessage={initialWelcomeMessage}
      on:logout={handleLogout}
      on:deleteChat={handleChatReset}
    />
  {:else}
    {#if currentPage === 'login'}
      <Login
        bind:details={loginDetails}
        {isLoading}
        {authError}
        on:login={handleLogin}
        on:navigate={navigate}
      />
    {:else if currentPage === 'signup'}
      <Signup
        bind:details={signupDetails}
        on:signup={handleSignup}
        on:navigate={navigate}
      />
    {:else if currentPage === 'aboutYou'}
      <AboutYou
        bind:details={userDetails}
        on:continue={handleAboutYou}
      />
    {:else if currentPage === 'passions'}
      <Passions
        bind:selectedPassions={aiFriend.passions}
        {isLoading}
        {authError}
        on:complete={completeOnboarding}
      />
    {/if}
  {/if}
</main>




<!-- 
 <script>
  import Login from '$lib/components/Login.svelte';
  import Signup from '$lib/components/Signup.svelte';
  import AboutYou from '$lib/components/AboutYou.svelte';
  import Passions from '$lib/components/Passions.svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';

  const API_BASE_URL = 'https://nonalined-unpurged-winifred.ngrok-free.dev';

  let currentPage = 'login';
  let isLoading = false;
  let authError = '';
  let loggedInUsername = '';

  let chatKey = Date.now();
  const chatHistoryKey = (user) => `chatHistory_${user}`;

  let loginDetails = { username: '', password: '' };
  let signupDetails = { username: '', email: '', password: '' };
  let userDetails = { nickname: '', age: '', designation: '', location: '' };

  let aiFriend = {
    name: 'Rohan',
    avatar: '/avatar.jpeg',
    passions: []
  };
  
  // We will store the history here to pass as a prop
  let initialHistory = [];
  let initialWelcomeMessage = {};

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
        // Don't call startChat() directly
        await loadHistoryAndStartChat();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          authError = errorData.detail;
        } else {
          authError = 'Invalid username or password.';
        }
        isLoading = false; // Stop loading on error
      }
    } catch (error) {
      console.error('Login failed:', error);
      authError = 'Could not connect to the server. Please try again.';
      isLoading = false; // Stop loading on error
    }
  }

  async function completeOnboarding() {
    isLoading = true;
    authError = '';
    
    const onboardingPayload = {
      username: signupDetails.username,
      email: signupDetails.email, 
      password: signupDetails.password,
      nickname: userDetails.nickname,
      age: parseInt(userDetails.age, 10),
      designation: userDetails.designation,
      location: userDetails.location,
      likes: aiFriend.passions 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });

      if (response.ok) {
        loggedInUsername = signupDetails.username;
        // Don't call startChat() directly
        await loadHistoryAndStartChat();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          authError = errorData.detail;
        } else if (Array.isArray(errorData.detail) && errorData.detail[0] && errorData.detail[0].msg) {
          authError = `Error: ${errorData.detail[0].msg}`;
        } else {
          authError = 'Failed to create account. Please check details.';
        }
        isLoading = false; 
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      authError = 'Could not connect to the server.';
      isLoading = false; // Stop loading on error
    }
  }

  // This function loads history *before* changing the page
  async function loadHistoryAndStartChat() {
    // Show a loading message on the *current* page
    authError = 'Loading chat history...';
    isLoading = true;

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUsername,
          message: "" // Send empty message to get history
        })
      });

      if (!response.ok) throw new Error('Failed to fetch history');
      
      const aiData = await response.json();

      
      initialHistory = aiData.recent_conversations || [];
      const welcomeText = aiData.reply || aiData.message;
      if (welcomeText && welcomeText !== "Loaded previous chat history") {
        initialWelcomeMessage = {
          id: 'init_reply',
          text: welcomeText,
          sender: 'ai',
          reaction: null
        };
      } else {
        initialWelcomeMessage = null; 
      }

      startChat();

    } catch (error) {
      console.error('History load failed:', error);
      authError = 'Could not load your chat history. Please try again.';
    } finally {
      isLoading = false; // Stop loading
      authError = ''; // Clear "Loading..." message
    }
  }

  function navigate(event) {
    currentPage = event.detail;
    authError = '';
  }

  function handleSignup() {
    currentPage = 'aboutYou';
  }

  function handleAboutYou() {
    currentPage = 'passions';
  }

  function startChat() {
    currentPage = 'chat';
    chatKey = Date.now(); // Update key to force remount
  }

  function handleLogout() {
    currentPage = 'login';
    loggedInUsername = '';
    loginDetails = { username: '', password: '' };
    signupDetails = { username: '', email: '', password: '' };
    userDetails = { nickname: '', age: '', designation: '', location: '' };
    aiFriend.passions = [];
    initialHistory = []; // Clear history on logout
    initialWelcomeMessage = {};
  }

  function handleChatReset() {
    // You need a backend endpoint to clear history
    // For now, this just re-mounts the window
    chatKey = Date.now();
  }

</script>

<main>
  {#if currentPage === 'chat'}
    <ChatWindow
      key={chatKey}
      username={loggedInUsername}
      friendName={aiFriend.name}
      friendAvatar={aiFriend.avatar}
      apiBaseUrl={API_BASE_URL}
      initialHistory={initialHistory} {initialWelcomeMessage} on:logout={handleLogout}
      on:deleteChat={handleChatReset}
    />
  {:else}
    {#if currentPage === 'login'}
      <Login
        bind:details={loginDetails}
        {isLoading}
        {authError}
        on:login={handleLogin}
        on:navigate={navigate}
      />
    {:else if currentPage === 'signup'}
      <Signup
        bind:details={signupDetails}
        on:signup={handleSignup}
        on:navigate={navigate}
      />
    {:else if currentPage === 'aboutYou'}
      <AboutYou
        bind:details={userDetails}
        on:continue={handleAboutYou}
      />
    {:else if currentPage === 'passions'}
      <Passions
        bind:selectedPassions={aiFriend.passions}
        {isLoading}
        {authError}
        on:complete={completeOnboarding}
      />
    {/if}
  {/if}
</main>
 -->
