import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { registerServiceWorker } from '$lib/sw-client';

const app = mount(App, { target: document.getElementById('app') as HTMLElement });
registerServiceWorker();

export default app;
