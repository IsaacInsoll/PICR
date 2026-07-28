import {
  Fullscreen,
  Thumbnails,
  Zoom,
} from 'yet-another-react-lightbox/plugins';
import { Rails } from './lightboxRailsPlugin';

// Captions and Counter are deliberately absent: both render *inside the slide*,
// i.e. on top of the photograph, which is what issues #47/#79 are about. The
// filename and slide counter are rendered in the rails instead (see
// SelectedFileView) where they can never overlap the image.
//
// Slideshow is absent too: its play icon reads as "play this video" when the
// current slide is one, and auto-advancing has little value in a proofing or
// delivery gallery.
//
// Download is absent as well: its only job is adding a toolbar button, and we
// render our own so it matches the rest of the chrome (see
// LightboxDownloadButton). Whether downloads are offered is gated by that
// button's presence in useLightboxToolbar, not by the plugin list.
//
// Rails wraps the Carousel (inside .yarl__container) so it is order-independent
// relative to the other plugins. See lightboxRailsPlugin.tsx.
export const lightboxPlugins = [Fullscreen, Thumbnails, Zoom, Rails];
