<script>
  import { createEventDispatcher } from 'svelte';

  export let details;
  const dispatch = createEventDispatcher();

  const handleSubmit = () => dispatch('continue');
</script>

<div class="auth-container">
  <h2 class="auth-title">Tell Me About Yourself</h2>
  <p class="auth-subtitle">This will help personalize your experience.</p>
  <form on:submit|preventDefault={handleSubmit} class="signup-form">
    <div class="form-grid">
      <input type="text" bind:value={details.nickname} class="form-input" placeholder="Nickname" required>
      <input type="number" bind:value={details.age} class="form-input" placeholder="Age" required>
    </div>
    <input type="text" bind:value={details.designation} class="form-input" placeholder="Designation (e.g., Student)" required>
    <input type="text" bind:value={details.location} class="form-input" placeholder="Location (e.g., New York)" required>
    <button type="submit" class="btn btn-primary btn-full">Continue</button>
  </form>
</div>