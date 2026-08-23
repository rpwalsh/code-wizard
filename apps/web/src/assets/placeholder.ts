/**
 * A 48-pixel-wide copy of the scene, inlined.
 *
 * Two hundred bytes, so it costs nothing and is present in the very first
 * paint. Without it the glass panels sit on a flat colour until the real
 * photograph decodes, which reads as a broken page rather than a loading
 * one — the panels are translucent, so an empty backdrop is visible
 * *through* them.
 */
export const scenePlaceholder =
  'data:image/webp;base64,UklGRtoAAABXRUJQVlA4IM4AAACwBgCdASowABMAPr1Kn0qnJCKhsBqtUOAXiWMAp0ewAffSVKAGa/JBa54K3t2fRUxwOm6M3lciLTGHK+lIAADOJcK1Uc2d7y1GrH4IB2fEsYRSQ5fMHxDNNFW69ydbuiAX0QSyeUKzFQPJGgK0VXfokAxTRPLdgGqpSQGz+YwkMOXhRtgRfLdGSL8qHor5HUz7toyWs1b5F0HYbNT1p5lspBq4QlIOiFH+mwjHGHdfaTH6dBnluf9eOu3/tIDKp3NZOUvOv2wf/+f/tgMAAA==';
