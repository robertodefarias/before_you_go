# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bin/rails server                        # Start server on port 3000
bin/rails db:create db:migrate db:seed  # Set up database
bundle install                          # Install gems

# Testing
bin/rails test                          # Run unit/integration tests
bin/rails test:system                   # Run system tests (Selenium/Capybara)
bin/rails test test/models/user_test.rb # Run a single test file

# Linting & Security
bin/rubocop                             # Lint Ruby (RuboCop Rails Omakase)
bin/brakeman --no-pager                 # Security scan
bin/bundler-audit                       # Check gem vulnerabilities
bin/importmap audit                     # Check JS vulnerabilities
```

## Architecture

**Before You Go** is a community-powered safety map where users report safety incidents (violence, harassment, discrimination) at venues (bars, restaurants). Users can browse a Mapbox map to check venues before visiting.

### Models

```
User (Devise auth)
  has_many :reports

Place
  has_many :reports
  geocoded_by :address  # Geocoder gem stores lat/lng
  status → "positive" | "negative" | "neutral"  (based on report majority)
  status_label → "Safe" | "Unsafe" | "Neutral"  (human-readable label for views)
  pin_color → "green" | "red" | "gray"

Report
  belongs_to :user
  belongs_to :place
  # Fields: category, status ("positive"/"negative"), description
```

### Request Flow

- Routes are scoped under `/:locale` (en or pt-BR, default pt-BR), set in `ApplicationController#set_locale`
- `PlacesController#index`: serializes all places as JSON markers for the Stimulus map controller
- `PlacesController#show`: renders place details + reports + new report form
- `ReportsController#create`: authenticated action, links report to `current_user` and `@place`

### Frontend

No Node.js build step — uses **Importmap** for ESM imports (Bootstrap, Stimulus, Turbo all via importmap).

The main interactive component is `app/javascript/controllers/map_controller.js`:
- Initializes Mapbox GL JS (loaded via CDN in layout)
- Reads marker data from a Stimulus `data-map-markers-value` attribute (JSON array from controller)
- Renders colored pins based on `place.pin_color` and attaches popup partials
- Mapbox token comes from `MAPBOX_API_KEY` env var, passed via `<meta>` tag or data attribute

### Environment Variables

| Variable | Purpose |
|---|---|
| `MAPBOX_API_KEY` | Mapbox GL access token (required for map) |
| `RAILS_MASTER_KEY` | Decrypt credentials (production) |
| `DATABASE_URL` | Override database.yml (optional) |

`.env` file is gitignored; copy values locally before running.

### i18n

- Default locale: `pt-BR`, also supports `en`
- Locale is set via URL param (e.g. `/en/places`) or falls back to default
- Translation files in `config/locales/`
- Navbar has a language switcher

### Key Conventions

- RuboCop max line length: 120 characters (see `.rubocop.yml`)
- RuboCop excludes: `vendor`, `bin`, `db`, `config`, `test`, `node_modules`
- Authentication guard: use `before_action :authenticate_user!` in controllers
- Place status logic lives in `app/models/place.rb` — drives map pin color and `status_label` for views
- Route resource is `resources :places` (not `:lists`) — helpers are `place_path`, `places_path`, `place_reports_path`

## Context

Before You Go was created after a real incident of homophobic violence at a bar.
The app is not exclusive to LGBT+ users — it's for anyone who wants to make safer
choices about where to go out. It does NOT review service quality (food, price, etc)
— only safety-related incidents.


