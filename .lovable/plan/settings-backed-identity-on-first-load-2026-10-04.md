# Settings-backed identity on first load

## Changes
- Load the homepage’s site settings and homepage content before rendering, then reuse that data in the existing page queries.
- Build the homepage title and social metadata from the configured default-language website title, name, and SEO text.
- Remove the old organisation identity and screenshot metadata from the shared document defaults.
- Remove the bundled placeholder banner fallback; display only the configured banner images and keep a neutral branded background when none is configured.
- Remove the temporary organisation-name fallback from the shared header/footer layout so unrelated text cannot flash during reload.

## Validation
- Reload the homepage and confirm the configured browser title and banner are present in the first rendered HTML.
- Check desktop and mobile layouts, browser errors, and the latest build result.

## Technical details
- Use the existing TanStack route loader and shared query cache so server rendering and client rendering read the same settings payload.
- Keep per-route metadata in the homepage route and only sitewide document defaults in the root route.
