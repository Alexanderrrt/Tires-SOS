import { MARQUEE_ITEMS } from "../site.config";

// Infinite horizontal banner strip. Pure CSS animation; the track is
// rendered twice so the loop is seamless (second copy hidden from a11y tree).
export default function Marquee() {
  const track = (ariaHidden) => (
    <div className="marquee__track" aria-hidden={ariaHidden || undefined}>
      {MARQUEE_ITEMS.map((item, i) => (
        <span className="marquee__item" key={i}>
          {item} <span className="marquee__dot">•</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      {track(false)}
      {track(true)}
    </div>
  );
}
