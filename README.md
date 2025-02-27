# ZoomBooksManager

## Quick Start

To start the application, simply run:

```bash
./start.sh
```

This will:
1. Set up all required environment variables
2. Start the application server
3. Log all output to the console and to `server-log.txt`

## Manual Start

If you prefer to start the application manually, you can run:

```bash
node run-dev.js
```

Or use the original method:

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_AiDHzTW6Ftr5@ep-solitary-boat-a48bij2d.us-east-1.aws.neon.tech/neondb?sslmode=require"
export REPL_ID="f3b73006-c223-4337-8aee-7410fa12bb3f"
npm run dev
