// src/lib/authStore.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get token from localStorage (if it exists) when app loads
const initialToken = browser ? window.localStorage.getItem('jwtToken') : null;

// Create the writable store
export const jwtToken = writable(initialToken);

// When the store changes, update localStorage
if (browser) {
    jwtToken.subscribe((value) => {
        if (value) {
            window.localStorage.setItem('jwtToken', value);
        } else {
            window.localStorage.removeItem('jwtToken');
        }
    });
}