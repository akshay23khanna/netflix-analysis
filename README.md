# Netflix Analysis

A full-stack Netflix catalogue analytics project by Akshay Khanna.

The app includes:

- A Node.js backend with local analytics API endpoints.
- A polished responsive frontend for catalogue, genre, behaviour, recommendation, and executive insights.
- Saved data files so the project runs without any external preview service.
- No AI, Emergent, or temporary-preview branding.

## Run

```bash
npm start
```

Open:

```text
http://localhost:4180
```

On Windows, you can also double-click:

```text
open-local.cmd
```

That starts the backend server and opens the frontend in your browser. Keep the server window open while viewing the site.


## API

- `GET /api/kpis`
- `GET /api/eda/content-type`
- `GET /api/eda/ratings`
- `GET /api/eda/release-trends`
- `GET /api/eda/top-countries`
- `GET /api/genres/trends`
- `GET /api/user-behavior/peak-hours`
- `GET /api/user-behavior/retention`
- `GET /api/user-behavior/devices`
- `GET /api/recommendations/similarity`
- `GET /api/recommendations/popularity-prediction`
- `GET /api/insights`
- `GET /api/analysis/summary`
