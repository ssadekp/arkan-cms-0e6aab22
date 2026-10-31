# Project architecture rules

- Public homepage identity and banner data must be loaded by the route loader so SSR and hydration render the saved settings without placeholder flashes.
- Documents use an optional image_url cover stored through the existing image uploader and a shared PDF.js reader loaded after hydration, keeping public/admin previews consistent and supporting mobile browsers without native PDF embeds.
- Homepage AI advice uses an administrator-authorized streaming server route with server-only Gateway helpers; recommendations remain advisory and never mutate homepage settings or execute generated code.