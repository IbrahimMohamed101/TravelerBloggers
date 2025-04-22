# Traveler Bloggers Platform

## Overview
This project is a platform designed for traveler bloggers to manage their content and interactions with other travelers. The backend is built using Node.js and PostgreSQL.

## Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/download/)

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-repository-url.git
    cd Traveler_Bloggers_Platform
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up your local PostgreSQL database:
    - Create a database named `traveler_bloggers_db`.
    - Create a user `traveler_admin` with password `1234` (or update your `.env` accordingly).
    - Ensure the database is running on `localhost:5432`.

4. Run database migrations:
    ```bash
    make migrate
    ```

5. Seed the database (optional):
    ```bash
    make seed
    ```

6. Start the application:
    ```bash
    npm run dev
    ```

## Available Make Commands

### General Commands
- `make help`  
  Show this help message with descriptions of available commands.

### Application Commands
- `make start`  
  Start the application in normal mode (using `npm start`).

- `make dev`  
  Start the application in development mode.

### Database Commands
- `make migrate`  
  Run database migrations.

- `make seed`  
  Seed the database with initial data.

### Development Utilities
- `make lint`  
  Run the linter to check for code quality and adherence to coding standards.

- `make format`  
  Format the code according to predefined style rules.

- `make install`  
  Install all dependencies listed in `package.json`.

### Utility Commands
- `make swagger`  
  Open Swagger UI documentation in your browser (`http://localhost:3000/api-docs`).

- `make health`  
  Check if the server is running and reachable.

- `make kill-port`  
  Kill any process using port 3000 (useful if the server is stuck).

## Troubleshooting
- If the Swagger UI doesn't load, ensure that the `swagger.yaml` file is placed correctly and the path is set properly in `index.js`.
- If the server is not responding, check the logs to debug any issues.
- If you encounter any issues with the database, you can reset it by dropping and recreating the database, then running migrations and seeding.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
