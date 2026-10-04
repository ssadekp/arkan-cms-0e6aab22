# Project architecture rules

- Public homepage identity and banner data must be loaded by the route loader so SSR and hydration render the saved settings without placeholder flashes.