<script>
  import { createEventDispatcher } from 'svelte';

  export let details;
  const dispatch = createEventDispatcher();

  const handleSubmit = () => dispatch('signup');
  const navigateToLogin = () => dispatch('navigate', 'login');
</script>

<div class="auth-container">
  <h2 class="auth-title">Create Your Account</h2>
  <form on:submit|preventDefault={handleSubmit} class="signup-form">
    <input type="text" bind:value={details.username} class="form-input" placeholder="Username" required>
    <input type="email" bind:value={details.email} class="form-input" placeholder="Email" required>
    <input type="password" bind:value={details.password} class="form-input" placeholder="Password" required>
    <button type="submit" class="btn btn-primary btn-full">Create Account</button>
  </form>
  <p class="auth-footer-text">
    Already have an account?
    <button on:click={navigateToLogin} class="btn-link">Login here</button>
  </p>
</div>