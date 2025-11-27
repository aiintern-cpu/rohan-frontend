<!-- <script>
  import { onMount } from 'svelte';
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

  // ✅ Check token when the app loads
  onMount(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      currentPage = 'login';
    }
  });

  async function handleLogin() {
  isLoading = true;
  authError = '';

  const formData = new URLSearchParams();
  formData.append('username', loginDetails.username);
  formData.append('password', loginDetails.password);

  try {
    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // ✅ FIX
      body: formData                                           // ✅ FIX
    });

    const data = await response.json();

    if (response.ok) {
      const token = data?.access_token;   // ✅ Your backend returns access_token, NOT token

      if (token) {
        localStorage.setItem('jwtToken', token); // save token
      }

      loggedInUsername = loginDetails.username;
      await loadHistoryAndStartChat();
    } else {
      authError = data?.detail || 'Invalid username or password.';
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
        const data = await response.json();
        const token = data?.token;

        if (token) {
          localStorage.setItem('jwtToken', token);
        }

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

    try {
      const token = localStorage.getItem('jwtToken'); // ✅ Add token
      const params = new URLSearchParams({ username: loggedInUsername });
      const historyUrl = `${API_BASE_URL}/history?${params.toString()}`;

      const response = await fetch(historyUrl, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // ✅ Send JWT
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const historyData = await response.json();

      if (!response.ok) {
        throw new Error(historyData.detail || 'Failed to load history.');
      }

      initialHistory = historyData.conversations || [];
      initialWelcomeMessage = null;
      startChat();
    } catch (error) {
      console.error('History load failed:', error);
      authError = `Could not load chat history: ${error.message}`;
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

  // ✅ Logout must remove token
  function handleLogout() {
    localStorage.removeItem('jwtToken');
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
</main> -->





<script>
  import { onMount } from 'svelte';
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

  // Check token on mount
  onMount(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      currentPage = 'login';
    }
  });

  // LOGIN (FORM-DATA)
  async function handleLogin() {
    isLoading = true;
    authError = '';

    const formData = new URLSearchParams();
    formData.append('username', loginDetails.username);
    formData.append('password', loginDetails.password);

    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const token = data?.access_token; // backend returns access_token

        if (token) {
          localStorage.setItem('jwtToken', token);
        }

        loggedInUsername = loginDetails.username;
        await loadHistoryAndStartChat();
      } else {
        authError = data?.detail || 'Invalid username or password.';
        isLoading = false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      authError = 'Could not connect to the server. Please try again.';
      isLoading = false;
    }
  }

  // SIGNUP (NO TOKEN FROM BACKEND)
  async function completeOnboarding() {
    isLoading = true;
    authError = '';

    const onboardingPayload = {
      username: signupDetails.username,
      email: signupDetails.email,
      password: signupDetails.password,
      nickname: userDetails.nickname,
      age: parseInt(userDetails.age, 10),

      // FIXED 🔥 Backend expects job, not designation
      job: userDetails.designation,

      location: userDetails.location,
      likes: aiFriend.passions
    };

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Signup success:", data);

        // Backend does NOT return token → redirect to login
        authError = "Signup successful! Please login to continue.";
        isLoading = false;
        currentPage = 'login';
      } else {
        authError = data?.detail || 'Failed to create account.';
        isLoading = false;
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      authError = 'Could not connect to the server.';
      isLoading = false;
    }
  }

  // LOAD HISTORY (JWT PROTECTED)
  async function loadHistoryAndStartChat() {
    authError = 'Loading chat history...';
    isLoading = true;

    try {
      const token = localStorage.getItem('jwtToken');
      const params = new URLSearchParams({ username: loggedInUsername });
      const historyUrl = `${API_BASE_URL}/history?${params.toString()}`;

      const response = await fetch(historyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const historyData = await response.json();

      if (!response.ok) {
        throw new Error(historyData.detail || 'Failed to load history.');
      }

      initialHistory = historyData.conversations || [];
      initialWelcomeMessage = null;
      startChat();
    } catch (error) {
      console.error('History load failed:', error);
      authError = `Could not load chat history: ${error.message}`;
      currentPage = 'login';
      isLoading = false;
    }
  }

  // Navigation
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

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem('jwtToken');
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
