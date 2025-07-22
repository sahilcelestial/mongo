# MongoDB Migration Tool UI

A React-based user interface for the MongoDB Migration Tool, providing a seamless experience for migrating data between MongoDB deployments.

## Features

- Visual configuration of source and target MongoDB connections
- Database analysis and exploration
- Migration configuration and execution
- Real-time migration progress tracking
- Migration logs viewer
- Application settings management

## Technology Stack

- React 18
- TypeScript
- Mantine UI Components
- React Router
- Axios for API communication
- Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```

3. Configure the environment variables:
```
cp .env.example .env
```

4. Start the development server:
```
npm run dev
```

## Usage

### Connection Setup

1. Navigate to the "Connection Setup" page
2. Configure your source MongoDB connection (standalone, replica set, sharded cluster, or Atlas)
3. Configure your target MongoDB connection
4. Save your configuration

### Database Analysis

1. Navigate to the "Analyze Databases" page
2. Select the databases you want to analyze (or leave empty to analyze all)
3. Click "Analyze Selected Databases"
4. Review the analysis results, including collections, document counts, and sizes

### Running Migrations

1. Navigate to the "Run Migration" page
2. Configure your migration options:
   - Select source databases
   - Configure batch size and concurrency
   - Enable/disable options like dropping target collections
3. Click "Start Migration"
4. Monitor the progress in real-time
5. View logs for detailed information

## Development

### Project Structure

- `src/components/`: Reusable UI components
- `src/pages/`: Page components for each route
- `src/services/`: API communication services
- `src/types/`: TypeScript interfaces and types
- `src/hooks/`: Custom React hooks
- `src/layouts/`: Layout components

### Building for Production

```
npm run build
```

This generates optimized files in the `dist` directory.

## License

ISC