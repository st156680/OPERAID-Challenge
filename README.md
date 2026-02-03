# OperaID Challenge

Brief project overview and setup instructions.

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm**

## Project Structure

- `backend/`: API server, MQTT broker, and Data Simulator.
- `frontend/`: Angular application for data visualization.

## Getting Started

### Backend

The backend includes the API, an embedded MQTT broker, and a simulator script.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the services:
   ```bash
   npm start
   ```
   This command concurrently runs:
   - **MQTT Broker** on port `1883`
   - **API Server** on port `3000`
   - **Simulator** (publishes data to MQTT)

   **Environment Variables** (Defaults in `.env`):
   - `PORT=3000`
   - `MQTT_PORT=1883`
   - `MQTT_URL=mqtt://localhost:1883`

### Frontend

The frontend is an Angular application that connects to the backend via Socket.IO.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   Access the application at `http://localhost:4200`.

## Architecture Flow

1. **Simulator**: Generates mock data and publishes to the MQTT broker.
2. **MQTT Broker**: Receives data from the simulator.
3. **Backend Aggregator**: Subscribes to the MQTT broker, aggregates data, and pushes it to the frontend via Socket.IO.
4. **Frontend**: Receives real-time updates and visualizes the data.
