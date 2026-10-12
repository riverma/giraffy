import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { registerServiceWorker } from '$lib/sw-client';
import { applyTheme, storedTheme } from '$lib/theme';
import { install } from '$lib/install.svelte';

applyTheme(storedTheme());
const app = mount(App, { target: document.getElementById('app') as HTMLElement });
install.listen();
registerServiceWorker();

export default app;
