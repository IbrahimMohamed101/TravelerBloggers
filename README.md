<<<<<<< HEAD
# Traveler Bloggers Platform

## Overview
This project is a platform designed for traveler bloggers to manage their content and interactions with other travelers. The backend is built using Node.js and PostgreSQL, and it's containerized with Docker for easy deployment.

## Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

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

3. Build Docker images:
    ```bash
    make docker-build
    ```

4. Start the application:
    ```bash
    make docker-up
    ```

## Available Make Commands

### General Commands
- `make help`  
  Show this help message with descriptions of available commands.

### Application Commands
- `make start`  
  Start the application in normal mode (using `npm start`).

- `make dev`  
  Start the application in development mode. (Make sure the database is running first with `make docker-up`).

- `make dev-with-db`  
  Start both the database and the application in development mode. It will wait for the database to initialize.

### Docker Commands
- `make docker-build`  
  Build the Docker images defined in the `docker-compose.yml`.

- `make docker-up`  
  Start Docker containers (including the database). Make sure to run this before the application if you're using development mode.

- `make docker-down`  
  Stop the running Docker containers.

- `make docker-clean`  
  Remove Docker containers, volumes, and images.

### Database Commands
- `make migrate`  
  Run database migrations.

- `make seed`  
  Seed the database with initial data.

- `make reset-db`  
  Rebuild the database from scratch. This will drop all data and recreate the database by running migrations and seeding it.

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

- `make logs`  
  Show real-time logs from the backend Docker container.

- `make restart`  
  Restart the backend and database containers. It will bring down the existing containers and bring them up again.

## Troubleshooting
- If the Swagger UI doesn't load, ensure that the `swagger.yaml` file is placed correctly and the path is set properly in `index.js`.
- If the server is not responding, check the logs using `make logs` to debug any issues.
- If you encounter any issues with the database, you can reset it using `make reset-db`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Traveler Bloggers Platform

## Overview
This project is a platform designed for traveler bloggers to manage their content and interactions with other travelers. The backend is built using Node.js and PostgreSQL, and it's containerized with Docker for easy deployment.

## Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

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

3. Build Docker images:
    ```bash
    make docker-build
    ```

4. Start the application:
    ```bash
    make docker-up
    ```

## Available Make Commands

### General Commands
- `make help`  
  Show this help message with descriptions of available commands.

### Application Commands
- `make start`  
  Start the application in normal mode (using `npm start`).

- `make dev`  
  Start the application in development mode. (Make sure the database is running first with `make docker-up`).

- `make dev-with-db`  
  Start both the database and the application in development mode. It will wait for the database to initialize.

### Docker Commands
- `make docker-build`  
  Build the Docker images defined in the `docker-compose.yml`.

- `make docker-up`  
  Start Docker containers (including the database). Make sure to run this before the application if you're using development mode.

- `make docker-down`  
  Stop the running Docker containers.

- `make docker-clean`  
  Remove Docker containers, volumes, and images.

### Database Commands
- `make migrate`  
  Run database migrations.

- `make seed`  
  Seed the database with initial data.

- `make reset-db`  
  Rebuild the database from scratch. This will drop all data and recreate the database by running migrations and seeding it.

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

- `make logs`  
  Show real-time logs from the backend Docker container.

- `make restart`  
  Restart the backend and database containers. It will bring down the existing containers and bring them up again.

## Troubleshooting
- If the Swagger UI doesn't load, ensure that the `swagger.yaml` file is placed correctly and the path is set properly in `index.js`.
- If the server is not responding, check the logs using `make logs` to debug any issues.
- If you encounter any issues with the database, you can reset it using `make reset-db`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Traveler Bloggers Platform

## Overview
This project is a platform designed for traveler bloggers to manage their content and interactions with other travelers. The backend is built using Node.js and PostgreSQL, and it's containerized with Docker for easy deployment.

## Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

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

3. Build Docker images:
    ```bash
    make docker-build
    ```

4. Start the application:
    ```bash
    make docker-up
    ```

## Available Make Commands

### General Commands
- `make help`  
  Show this help message with descriptions of available commands.

### Application Commands
- `make start`  
  Start the application in normal mode (using `npm start`).

- `make dev`  
  Start the application in development mode. (Make sure the database is running first with `make docker-up`).

- `make dev-with-db`  
  Start both the database and the application in development mode. It will wait for the database to initialize.

### Docker Commands
- `make docker-build`  
  Build the Docker images defined in the `docker-compose.yml`.

- `make docker-up`  
  Start Docker containers (including the database). Make sure to run this before the application if you're using development mode.

- `make docker-down`  
  Stop the running Docker containers.

- `make docker-clean`  
  Remove Docker containers, volumes, and images.

### Database Commands
- `make migrate`  
  Run database migrations.

- `make seed`  
  Seed the database with initial data.

- `make reset-db`  
  Rebuild the database from scratch. This will drop all data and recreate the database by running migrations and seeding it.

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

- `make logs`  
  Show real-time logs from the backend Docker container.

- `make restart`  
  Restart the backend and database containers. It will bring down the existing containers and bring them up again.

## Troubleshooting
- If the Swagger UI doesn't load, ensure that the `swagger.yaml` file is placed correctly and the path is set properly in `index.js`.
- If the server is not responding, check the logs using `make logs` to debug any issues.
- If you encounter any issues with the database, you can reset it using `make reset-db`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Traveler Bloggers Platform

## Overview
This project is a platform designed for traveler bloggers to manage their content and interactions with other travelers. The backend is built using Node.js and PostgreSQL, and it's containerized with Docker for easy deployment.

## Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

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

3. Build Docker images:
    ```bash
    make docker-build
    ```

4. Start the application:
    ```bash
    make docker-up
    ```

## Available Make Commands

### General Commands
- `make help`  
  Show this help message with descriptions of available commands.

### Application Commands
- `make start`  
  Start the application in normal mode (using `npm start`).

- `make dev`  
  Start the application in development mode. (Make sure the database is running first with `make docker-up`).

- `make dev-with-db`  
  Start both the database and the application in development mode. It will wait for the database to initialize.

### Docker Commands
- `make docker-build`  
  Build the Docker images defined in the `docker-compose.yml`.

- `make docker-up`  
  Start Docker containers (including the database). Make sure to run this before the application if you're using development mode.

- `make docker-down`  
  Stop the running Docker containers.

- `make docker-clean`  
  Remove Docker containers, volumes, and images.

### Database Commands
- `make migrate`  
  Run database migrations.

- `make seed`  
  Seed the database with initial data.

- `make reset-db`  
  Rebuild the database from scratch. This will drop all data and recreate the database by running migrations and seeding it.

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

- `make logs`  
  Show real-time logs from the backend Docker container.

- `make restart`  
  Restart the backend and database containers. It will bring down the existing containers and bring them up again.

## Troubleshooting
- If the Swagger UI doesn't load, ensure that the `swagger.yaml` file is placed correctly and the path is set properly in `index.js`.
- If the server is not responding, check the logs using `make logs` to debug any issues.
- If you encounter any issues with the database, you can reset it using `make reset-db`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
=======
# TravelerBloggers
>>>>>>> 2cbe78f (Initial commit)
