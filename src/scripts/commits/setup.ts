/**
 * Everything the Snacks pages do in the browser, loaded by snacks/index.astro (the history) and
 * snacks/[slug].astro (an entry). It is all enhancement: without JavaScript the pages are plain links.
 *
 * Astro bundles this as one module that runs once and stays loaded across client-side navigations, so every
 * listener sits on `document` and looks up the current page's elements when an event arrives. The imports
 * run in this order, which is also the order their listeners are registered in.
 */
import "./behind";
import "./page-transitions";
import "./keyboard";
import "./swipe";
import "./activity-grid";
import "./lightbox";
