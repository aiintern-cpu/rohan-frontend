<script>
  import { createEventDispatcher } from 'svelte';

  export let details;
  export let isLoading = false;
  export let authError = '';

  const dispatch = createEventDispatcher();

  const handleSubmit = () => dispatch('login');
  const navigateToSignup = () => dispatch('navigate', 'signup');
</script>

<div class="auth-container">
  <h2 class="auth-title">Welcome Back</h2>
  <p class="auth-subtitle">Sign in to continue</p>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="username">Username</label>
      <input type="text" id="username" class="form-input" bind:value={details.username} required disabled={isLoading}>
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" class="form-input" bind:value={details.password} required disabled={isLoading}>
    </div>
    {#if authError}<p class="error-message">{authError}</p>{/if}
    <button type="submit" class="btn btn-primary btn-full" disabled={isLoading}>
      {isLoading ? 'Logging In...' : 'Login'}
    </button>
  </form>
  <p class="auth-footer-text">
    Don't have an account?
    <button on:click={navigateToSignup} class="btn-link">Create now</button>
  </p>
</div>