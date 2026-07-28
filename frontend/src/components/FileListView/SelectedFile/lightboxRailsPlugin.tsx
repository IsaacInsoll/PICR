// Reserved top/bottom rails for the lightbox (issues #47, #79).
//
// The rails hold every piece of chrome so nothing is ever drawn on top of the
// photograph — a gradient scrim tints the image (which clients read as the
// photographer's edit) and floating controls are illegible over busy frames.
//
// Mechanism mirrors YARL's own Thumbnails plugin: a flex column whose middle
// child (the carousel wrapper) is `flex: 1`, so animating a rail's height
// reflows the image area above/below it. `carousel.padding` cannot be used
// instead: YARL applies it as a single CSS `padding` shorthand, so it pads all
// four sides and cannot do vertical-only.
//
// The module is inserted *inside* the Controller, wrapping the Carousel:
//
//   Controller  (.yarl__container — owns the backdrop colour)
//     Rails     (.picr-rails — flex column)
//       rail / carousel wrapper / rail
//     Toolbar   (absolute top:0 of .yarl__container → lands in the top rail)
//     Navigation
//
// Wrapping the Controller instead (as Thumbnails does) puts the rails outside
// the element carrying the background, so they render transparent, and shrinks
// .yarl__container to the image area, which drags the absolutely-positioned
// toolbar down onto the photo.
//
// Trade-off: YARL derives slideRect from the Controller's own element, which no
// longer matches the (smaller) carousel area. Only consumers of the `rect`
// passed to render.slide are affected — see RAIL_HEIGHT use in SelectedFileView.
import type { CSSProperties, ReactNode } from 'react';
import type { ComponentProps, Plugin } from 'yet-another-react-lightbox';
import {
  LightboxPropsProvider,
  MODULE_CAROUSEL,
  createModule,
  useController,
} from 'yet-another-react-lightbox';
import { useTapGesture } from '../../../hooks/useTapGesture';

const PLUGIN_RAILS = 'picrRails';

// Single source of truth for the rail height: fed to CSS as a custom property
// and used in JS to correct the slide rect for video (see the note above).
export const RAIL_HEIGHT = 48;

export interface RailsSettings {
  /** Chrome visible (Controls state). When false the image gets the viewport (Focus state). */
  visible: boolean;
  /** Rendered in the top rail. */
  top?: ReactNode;
  /** Rendered in the bottom rail. */
  bottom?: ReactNode;
  /** Tap anywhere on the image area toggles Focus. */
  onTap?: () => void;
}

declare module 'yet-another-react-lightbox' {
  interface LightboxProps {
    rails?: RailsSettings;
  }
}

const defaultRails: RailsSettings = { visible: true };

// A rail is deliberately NOT `inert` when hidden: keyboard users need to be able
// to tab back to the chrome, and doing so reveals all of it (see the
// :focus-visible rules in SelectedFileView.css). Marking it inert would make
// Focus state a dead end for anyone not using a pointer.
const Rail = ({
  children,
  position,
  visible,
  reserveEnd,
}: {
  children: ReactNode;
  position: 'top' | 'bottom';
  visible: boolean;
  /** Space to keep clear at the end of the rail, in px (see RailsContainer). */
  reserveEnd?: number;
}) => (
  <div
    className={`picr-rail picr-rail-${position}${
      visible ? '' : ' picr-rail-hidden'
    }`}
  >
    <div
      className="picr-rail-content"
      style={reserveEnd ? { paddingRight: reserveEnd } : undefined}
    >
      {children}
    </div>
  </div>
);

const RailsContainer = ({ children, ...props }: ComponentProps) => {
  // Defaults are already applied by `augment` below; this fallback only exists
  // because `rails` is optional on LightboxProps.
  const { visible, top, bottom, onTap } = props.rails ?? defaultRails;
  // YARL positions the toolbar absolutely at the top-right of .yarl__container,
  // overlapping the top rail, so the rail has to keep that width clear or a long
  // filename slides under the buttons. The Toolbar measures itself and publishes
  // the result on the controller context, so use the real width rather than a
  // hardcoded guess — the button count varies (no Download on proof links, no
  // Fullscreen on iPhone Safari, no zoom buttons on mobile).
  const { toolbarWidth } = useController();
  // The wrapper spans exactly the image area, so rail buttons are outside it
  // and can never be mistaken for a tap on the photo.
  const tapHandlers = useTapGesture(onTap);

  return (
    <LightboxPropsProvider {...props}>
      <div
        className="picr-rails"
        style={{ '--picr-rail-height': `${RAIL_HEIGHT}px` } as CSSProperties}
      >
        <Rail position="top" visible={visible} reserveEnd={toolbarWidth}>
          {top}
        </Rail>
        <div className="picr-rails-wrapper" {...tapHandlers}>
          {children}
        </div>
        <Rail position="bottom" visible={visible}>
          {bottom}
        </Rail>
      </div>
    </LightboxPropsProvider>
  );
};

export const Rails: Plugin = ({ augment, addParent }) => {
  augment(({ rails, ...restProps }) => ({
    rails: { ...defaultRails, ...rails },
    ...restProps,
  }));

  // Wrap the Carousel so the rails live inside .yarl__container. The filmstrip
  // (Thumbnails) wraps the Controller and therefore renders below the whole
  // container, i.e. below the bottom rail — one continuous bottom chrome region.
  addParent(MODULE_CAROUSEL, createModule(PLUGIN_RAILS, RailsContainer));
};
