<script>
  import { createEventDispatcher } from 'svelte';
  import { passions as allPassions } from '$lib/constants/passions.js'; // Import constants

  export let selectedPassions = [];
  export let isLoading = false;
  export let authError = '';

  const dispatch = createEventDispatcher();

  function togglePassion(passion) {
    const index = selectedPassions.indexOf(passion);
    if (index > -1) {
      selectedPassions.splice(index, 1);
    } else {
      selectedPassions.push(passion);
    }
    selectedPassions = selectedPassions; // Trigger Svelte reactivity
  }

  const handleComplete = () => dispatch('complete');
</script>

<div class="onboarding-container">
  <div class="onboarding-step">
    <h2 class="auth-title">Choose Passions</h2>
    <p class="auth-subtitle">Select a few things you're interested in.</p>
    {#if authError}<p class="error-message">{authError}</p>{/if}
    <div class="passions-grid">
      {#each allPassions as passion}
        <button on:click={() => togglePassion(passion)} class="passion-btn" class:selected={selectedPassions.includes(passion)}>
          {passion}
        </button>
      {/each}
    </div>
  </div>
  <button on:click={handleComplete} class="btn btn-primary btn-onboarding-next" disabled={isLoading}>
    {isLoading ? 'Finishing Up...' : 'Start Chatting'}
  </button>
</div>