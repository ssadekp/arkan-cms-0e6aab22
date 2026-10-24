# Project architecture rules

- Public homepage identity and banner data must be loaded by the route loader so SSR and hydration render the saved settings without placeholder flashes.
- Documents use an optional image_url cover stored through the existing image uploader and a shared on-site PDF reader, keeping public and admin previews consistent.