<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/store/app.svelte';
  import { router } from '$lib/store/router.svelte';
  import { seedData } from '$lib/data/samples';
  import TabBar from '$lib/ui/TabBar.svelte';
  import Toast from '$lib/ui/Toast.svelte';
  import InstallBar from '$lib/ui/InstallBar.svelte';
  import Onboarding from '$lib/screens/Onboarding.svelte';
  import NeedsHome from '$lib/screens/NeedsHome.svelte';
  import NeedDetail from '$lib/screens/NeedDetail.svelte';
  import CheckIn from '$lib/screens/CheckIn.svelte';
  import CardsHome from '$lib/screens/CardsHome.svelte';
  import CardDetail from '$lib/screens/CardDetail.svelte';
  import Composer from '$lib/screens/Composer.svelte';
  import Thread from '$lib/screens/Thread.svelte';
  import People from '$lib/screens/People.svelte';
  import Person from '$lib/screens/Person.svelte';
  import Settings from '$lib/screens/Settings.svelte';
  import About from '$lib/screens/About.svelte';
  import Import from '$lib/screens/Import.svelte';
  import Sheets from '$lib/sheets/Sheets.svelte';

  onMount(async () => {
    router.start();
    // `?demo` seeds the sample data on a fresh install, for screenshots and the Playwright happy path
    const demo = new URLSearchParams(location.search).has('demo');
    await app.init(demo ? seedData('Maya') : undefined);
    if (!app.prefs.onboarded) router.root('/onboarding');
  });

  const screen = $derived(router.route.screen);
  const id = $derived(router.route.id);
  const showTabs = $derived(!['onboarding', 'compose', 'checkin'].includes(screen));

  // editing a list is a mood, not a setting: leaving the screen puts the app back to plain
  $effect(() => { void router.route.path; app.editing = false; });
</script>

{#if app.ready}
  {#if screen === 'onboarding'}
    <Onboarding />
  {:else if screen === 'checkin'}
    <CheckIn />
  {:else if screen === 'compose'}
    <Composer />
  {:else if screen === 'cards'}
    <CardsHome />
  {:else if screen === 'card'}
    <CardDetail id={id ?? ''} />
  {:else if screen === 'thread'}
    <Thread id={id ?? ''} />
  {:else if screen === 'people'}
    <People />
  {:else if screen === 'person'}
    <Person id={id ?? ''} />
  {:else if screen === 'settings'}
    <Settings />
  {:else if screen === 'about'}
    <About />
  {:else if screen === 'restore'}
    <Import mode="restore" />
  {:else if screen === 'import'}
    <Import />
  {:else if screen === 'need'}
    <NeedDetail id={id ?? ''} />
  {:else}
    <NeedsHome />
  {/if}
  {#if showTabs}
    <TabBar />
  {/if}
  <InstallBar />
  <Sheets />
  <Toast />
{/if}
