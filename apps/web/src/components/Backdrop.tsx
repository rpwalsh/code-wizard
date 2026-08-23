// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
import sceneJpeg from '../assets/cascades.jpg';
import sceneWebp from '../assets/cascades.webp';
import { scenePlaceholder } from '../assets/placeholder.ts';

/**
 * The landscape behind the glass.
 *
 * Diablo Lake from the Sourdough Mountain side of North Cascades National
 * Park, Washington — layered ridgelines going blue into rain haze, water in
 * the middle distance, evergreens near. Released into the public domain under
 * CC0 1.0 by its photographer; the full provenance, including the source page
 * and the license deed, is in `docs/credits.md`.
 *
 * A photograph rather than vector shapes because a drawn landscape reads as a
 * drawn landscape, and the point of this surface is that it recedes. Real
 * atmospheric haze is the one thing that is hard to fake and the exact thing
 * that makes glass look like glass.
 *
 * **Imported rather than referenced by path.** The first version pointed at
 * `/scene/cascades.webp` in the public directory, which is wrong in two
 * deployments that matter: the desktop app loads the page over `file://`,
 * where a leading slash means the root of the disk, and any host serving the
 * site under a subpath would miss it too. Importing the file puts it through
 * the bundler's asset graph, so the URL is resolved against the real base and
 * fingerprinted for caching — and a missing file becomes a build error rather
 * than an empty background nobody notices until someone opens the desktop
 * build.
 *
 * Shipped already blurred and already downsized: thirty-seven kilobytes of
 * WebP, so the browser never runs a full-resolution filter on every paint and
 * the picture costs less than a typeface.
 */
export function Backdrop() {
  return (
    <div
      className="backdrop"
      aria-hidden="true"
      // The 200-byte version, present in the first paint. The panels above are
      // translucent, so an unpainted backdrop shows *through* them.
      style={{ backgroundImage: `url(${scenePlaceholder})` }}
    >
      <picture>
        <source srcSet={sceneWebp} type="image/webp" />
        <img
          className="backdrop__scene"
          src={sceneJpeg}
          alt=""
          decoding="async"
          fetchPriority="low"
        />
      </picture>
    </div>
  );
}
