# MongoDB Migration Tool

A comprehensive toolkit for migrating MongoDB databases between different deployment types:
- Self-managed standalone MongoDB instances
- Self-managed MongoDB replica sets
- Self-managed MongoDB clusters
- MongoDB Atlas

## Project Structure

This project consists of three main components:

1. **CLI Tool** (mongodb-migration-tool)
   - Command-line interface for running migrations
   - Supports both Linux and Windows servers
   - Features database analysis, migration execution, and verification

2. **REST API** (mongodb-migration-api)
   - Provides HTTP endpoints for migration operations
   - Connects the CLI tool with the web UI
   - Handles connection testing, database analysis, and migration management

3. **Web UI** (mongodb-migration-ui)
   - User-friendly web interface for configuring and running migrations
   - Visualizes database structure and migration progress
   - Provides migration logs and monitoring

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or pnpm
- MongoDB (for testing)

### Installation

#### CLI Tool

```bash
cd mongodb-migration-tool
npm install
npm run build
```

#### API Server

```bash
cd mongodb-migration-api
npm install
npm run build
```

#### Web UI

```bash
cd mongodb-migration-ui
npm install
npm run build
```

### Running the Application

1. Start the API server:
```bash
cd mongodb-migration-api
npm run dev
```

2. Start the Web UI:
```bash
cd mongodb-migration-ui
npm run dev
```

3. Access the web interface at: http://localhost:5173

## Features

- Cross-platform compatibility (Linux & Windows)
- Support for various MongoDB deployment types
- Interactive setup wizard
- Database structure analysis
- Batched data migration with progress tracking
- Schema and index migration
- Detailed logging
- Real-time migration status updates

## Usage

### Web UI Workflow

1. **Setup Connections**: Configure source and target MongoDB connections
2. **Analyze Databases**: Explore source database structure
3. **Configure Migration**: Set migration options and filters
4. **Run Migration**: Start and monitor migration progress
5. **View Logs**: Review detailed migration logs

### CLI Usage

```bash
# Interactive setup
npx mongodb-migrate setup

# Analyze source database
npx mongodb-migrate analyze --source-uri "mongodb://localhost:27017/source_db"

# Run migration
npx mongodb-migrate migrate --source-uri "mongodb://localhost:27017/source_db" --target-uri "mongodb://localhost:27017/target_db"
```

## License

ISC