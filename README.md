# Eco Spain Mapper

Eco Spain Mapper is an interactive web application for visualising carbon emission data across Spain. Users can upload CSV files or load the bundled ClimateTrace dataset and inspect emissions on a Leaflet map with rich filtering options.

## Technologies

- **React** with **Vite** and **TypeScript** for the web application
- **Tailwind CSS** and **shadcn-ui** for styling
- **React Leaflet** and **Leaflet** for the map
- **@tanstack/react-query** for data management
- **Recharts** for future graphing capabilities

## Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Start a development server
   ```bash
   npm run dev
   ```
3. Lint the codebase
   ```bash
   npm run lint
   ```
4. Build for production
   ```bash
   npm run build
   ```
5. Preview the production build
   ```bash
   npm run preview
   ```
6. Fetch the latest ClimateTrace dataset
   ```bash
   npm run fetch-climatetrace
   ```

The application requires **Node.js 18+**.

## Features

- Upload custom CSV data and validate it on the client
- Load the default ClimateTrace dataset provided in the `public` folder
- Interactive map of Spanish autonomous communities with markers
- Filter by region, year and sector
- Select numeric metrics to visualise emissions at different scales
- English and Spanish language support

## Testing

No automated tests are present. You can check code quality with the linter:

```bash
npm run lint
```

## Roadmap

- Add visualisation graphs to show how emissions evolve over time
- Support loading and aggregating multiple CSV sources simultaneously
- Extend dataset handling to work with multiple countries, not just Spain

