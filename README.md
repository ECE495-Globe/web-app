# Web App (Frontend + Backend)

This directory contains the web application for the project, including the frontend UI and supporting backend scripts.

These instructions guide a user on a Linux-based system from a clean environment to running the development server locally

### 1. Getting Started
On ubuntu or Debian:
```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip
```

### 2. Navigate to the web-app folder
From the repository root:
```bash
cd web-app
```

### 3. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate #This activates the virtual environment
```

### 4. Install dependancies
```
pip install -r requirements.txt
```

### 5. Install Node.js Dependancies
Install frontend Dependancies
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 6. Then, run the development server
To start the development server run:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### 7. Open the Application
Open [http://localhost:3000]
```
http://localhost:3000 # with your browser to see the result.
```

### 8. If port 3000 is already in use
You then have 2 options
### Option A, Kill the current process running on the port
In order to end the process
```bash
lsof  -i :3000 # Or your differently selected port number
# See what values omces up and kill the one thats running on the port
kill -9 <PID>
```
### Option B: Use a Different Port


## Stripe Environment Set-Up
### 9. Changing the stripe API Key
In order to properly use the Stripe API for your buisisness you must replace the key in the .env with the one that stripe gives to you
```env
STRIPE_API_KEY=your_stripe_api_key
```

It is also to be noted that the metadata is heavily relied on and if the invoices are not tagged correctly then the incorrect lights may turn on or may not turn on at all

## Expanding the Scope
If you want to expand the scope of this project, you can simply look at the current instantiated:
Event-app.py scripts - Backend event handeling Logic
route.ts - API route handeling
pages.tsx - Main UI Page 
publish.py - Messaging/Publishing

### Toubleshooting
If Dependancies fail to install try
```bash
pip install --upgrade pip
```

Server does not start
```
Ensure the dependancies are installed in steps 3 and 4
```

Port Conflicts
```
Kill the current process, See section 7
```

Stripe integration not working
```
Verify your stripe key is working
```
