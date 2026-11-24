# Machine Downtime Tracker

A full-stack application for monitoring industrial machine status and recording downtime events.

Built with React, Node.js, Express, PostgreSQL and Docker.

## Overview

Machine Downtime Tracker provides a centralised interface for monitoring machine availability, reporting operational interruptions and maintaining downtime records.

The project focuses on practical full-stack development, relational database management and containerised application deployment.

## Features

- Machine status dashboard
- Machine search, filtering and sorting
- Downtime reporting and validation
- Active and closed event tracking
- Downtime history with filtering and pagination
- Downtime event closure

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Containerisation | Docker, Docker Compose |

## Architecture

```text
React Frontend
      |
      v
Node.js + Express API
      |
      v
PostgreSQL Database
      |
      v
Docker
```

## Project Structure

```text
machine-downtime-tracker/
│
├── machine-downtime-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── machine-downtime-api/
│   ├── database/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
│
├── compose.yaml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/machines` | Retrieve machines |
| GET | `/events` | Retrieve downtime events |
| POST | `/events` | Report machine downtime |
| PATCH | `/events/:id/close` | Close a downtime event |

## Configuration

Create a local `.env` file using `.env.example` as a template.

Set the required database connection variables and provide a secure database password.

Never commit actual credentials or environment files.

## Development Status

The React frontend, Express API, PostgreSQL database preparation and Docker configuration have been developed.

Frontend-to-backend integration and final end-to-end verification remain in progress.

Database schema and seed files are not included in this initial repository snapshot.

---

**Machine Downtime Tracker**  
A practical full-stack and containerisation project.