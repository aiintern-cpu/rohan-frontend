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

  let loginDetails = { username: '', password: '' };
  let signupDetails = { username: '', email: '', password: '' };
  let userDetails = { nickname: '', age: '', designation: '', location: '' };

  let aiFriend = {
    name: 'Rohan',
    avatar: '/avatar.jpeg',
    passions: []
  };
  
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
    initialWelcomeMessage = {
      id: 1,
      text: `Hello there! It's so nice to meet you. My name is ${aiFriend.name}. What's on your mind?`,
      sender: 'ai',
      reaction: null
    };
  }

  function handleLogout() {
    currentPage = 'login';
    loggedInUsername = '';
    loginDetails = { username: '', password: '' };
    signupDetails = { username: '', email: '', password: '' };
    userDetails = { nickname: '', age: '', designation: '', location: '' };
    aiFriend.passions = [];
  }
</script>

<main>

  {#if currentPage === 'chat'}
    <ChatWindow
      friendName={aiFriend.name}
      friendAvatar={aiFriend.avatar}
      username={loggedInUsername}
      apiBaseUrl={API_BASE_URL}
      {initialWelcomeMessage}
      on:logout={handleLogout}
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