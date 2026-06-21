# Planova — Free Deployment Guide

Deploy Planova for **free, forever, no sleeping** using:

| What | Service | Cost |
|---|---|---|
| Your backend (Node.js API) | Oracle Cloud VM | $0 forever |
| Your database (Postgres) | Neon | $0 forever |
| Your cache (Redis) | Upstash | $0 forever |
| Your frontend (React app) | Vercel | $0 forever |

> **In plain English:** Right now Planova runs only on your laptop. We're going to move it to free cloud servers so anyone can access it 24/7 without your laptop being on.

---

## Before You Start

Make sure you have:
- Your code pushed to a **GitHub repository** (public or private — both work)
- Your `backend/.env` file listed in `.gitignore` (so secrets don't go to GitHub)
- About **1 hour** of free time

---

## Phase 1 — Set Up Your Database (Neon)

> Think of Neon as Google Drive, but for your database. It lives on their servers so you don't need to manage it.

### Step 1 — Create a Neon account

1. Go to [neon.tech](https://neon.tech)
2. Click **Sign Up** — use "Continue with GitHub" for speed
3. Once inside, click **New Project**
4. Name it `planova`
5. For **Region**, pick the one closest to you:
   - India → `AWS / ap-south-1 (Mumbai)`
   - US → `AWS / us-east-1`
6. Click **Create Project**

### Step 2 — Copy your database connection string

1. On the Neon dashboard, find the box labeled **Connection String**
2. From the dropdown, select **Prisma** (not the default psql)
3. Copy the full string — it looks like this:

```
postgresql://planova_owner:XXXX@ep-something.ap-south-1.aws.neon.tech/planova?sslmode=require
```

4. **Paste it somewhere safe** (Notepad is fine) — you'll need it in Step 10

> **Why this string?** It's like a complete address + password in one line. Your app uses it to find and log into the database.

---

## Phase 2 — Set Up Redis (Upstash)

> Redis is like your app's short-term memory — it remembers who is logged in without hitting the database every second. Upstash hosts it free.

### Step 3 — Create an Upstash account

1. Go to [upstash.com](https://upstash.com)
2. Click **Sign Up** → use GitHub login
3. Once inside, click **Create Database**
4. Name it `planova-redis`
5. Pick the **same region** you chose for Neon (e.g. `ap-south-1`)
6. Leave everything else as default
7. Click **Create**

### Step 4 — Copy the Redis URL

1. On the database page, scroll down to find **Redis URL**
2. Copy it — it looks like:

```
rediss://default:XXXX@global-smiling-xxx.upstash.io:6379
```

3. Save this in your Notepad too

---

## Phase 3 — Set Up Your Free Server (Oracle Cloud)

> Oracle gives you a real server computer, free forever. It's like having a PC in a data center that never turns off and costs you nothing.

### Step 5 — Create an Oracle Cloud account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Click **Start for free**
3. Fill in your name, email, and country
4. **Choose your home region** — pick the one closest to you. **You cannot change this later.**
5. Enter your credit card details — Oracle uses this for identity verification only. You will **not** be charged on the Always Free tier.
6. Complete the sign-up and wait for the confirmation email (usually 5–15 minutes)

> **Why a credit card?** Oracle needs to verify you're a real person. The Always Free tier has hard limits and you won't be billed unless you manually upgrade.

### Step 6 — Create a free virtual machine

1. Log into [cloud.oracle.com](https://cloud.oracle.com)
2. In the top search bar, type **Instances** and click it
3. Click **Create Instance**
4. Set **Name** to `planova-server`
5. Under **Image and shape**, click **Change image**:
   - Select **Ubuntu**
   - Select **Ubuntu 22.04** (the LTS version)
   - Click **Select image**
6. Click **Change shape**:
   - Select **Ampere** (ARM processor)
   - Select **VM.Standard.A1.Flex**
   - Set **OCPUs** to `4` and **Memory** to `24 GB`
   - Click **Select shape**
7. Under **Add SSH keys**, click **Generate a key pair for me**
8. Click **Save private key** — this downloads a `.key` file to your computer
9. Click **Create** and wait about 2 minutes

> **What is SSH?** It's like a secure remote control for your server. The `.key` file is the only "key" to get in — if you lose it, you're locked out. Save it somewhere safe like `Documents/oracle-keys/`.

### Step 7 — Copy your server's IP address

1. Once the instance shows **Running** (green dot), click on its name
2. Find the **Public IP address** on the right side
3. Copy it and save it in your Notepad — it looks like `150.230.xx.xx`

### Step 8 — Open the firewall for your backend

By default Oracle blocks all incoming traffic. We need to open the port your backend listens on.

1. On your instance page, click the link next to **Virtual cloud network** (looks like `vcn-XXXXXXXX`)
2. On the left sidebar, click **Security Lists**
3. Click the one called **Default Security List for...**
4. Click **Add Ingress Rules**
5. Add this rule:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `4000`
   - **Description:** `Planova backend`
6. Click **Add Ingress Rules** to save

> **What is a port?** Think of your server as an apartment building. Port 4000 is the apartment number where your backend lives. Opening it means traffic is allowed to reach that apartment.

### Step 9 — Connect to your server

On your Windows PC, open **Command Prompt** (press `Win + R`, type `cmd`, press Enter) and run:

```cmd
:: Replace C:\Users\BharathR\Downloads\ssh-key.key with the actual path to your .key file
:: Replace 150.230.xx.xx with your actual Oracle IP address
ssh -i "C:\Users\BharathR\Downloads\ssh-key.key" ubuntu@150.230.xx.xx
```

If it asks **"Are you sure you want to continue connecting?"** — type `yes` and press Enter.

You should now see a prompt like:

```
ubuntu@planova-server:~$
```

This means you're inside your server. Everything you type now runs on the Oracle computer in the cloud.

> **Troubleshooting:** If you get `WARNING: UNPROTECTED PRIVATE KEY FILE`, right-click the `.key` file → Properties → Security tab → make sure only your Windows user account has access.

### Step 10 — Install Docker

Docker is software that runs your backend app in a container — like a sealed box that has everything the app needs inside it. Paste these commands one at a time into your SSH terminal:

```bash
# Download and install Docker
curl -fsSL https://get.docker.com | sudo sh

# Allow your user to run Docker without typing "sudo" every time
sudo usermod -aG docker ubuntu

# Apply the permission (or just close and reopen the SSH connection)
newgrp docker

# Confirm Docker installed correctly — should print a version number
docker --version
```

### Step 11 — Upload your code to the server

```bash
# Download your code from GitHub onto the server
# Replace YOUR_USERNAME/planova with your actual GitHub repo path
git clone https://github.com/YOUR_USERNAME/planova.git

# Go into the backend folder
cd planova/backend
```

### Step 12 — Create the production secrets file

Your app needs secrets (database password, JWT keys, etc.) to run. These never go to GitHub — you type them directly on the server.

```bash
# Open a text editor on the server to create the .env file
nano .env
```

The `nano` editor will open. Type or paste the following, filling in your real values:

```env
NODE_ENV=production
PORT=4000

# Paste your Neon connection string from Step 2
DATABASE_URL=postgresql://planova_owner:XXXX@ep-xxx.neon.tech/planova?sslmode=require

# Paste your Upstash Redis URL from Step 4
REDIS_URL=rediss://default:XXXX@global-xxx.upstash.io:6379

# Go to https://generate-secret.vercel.app/64 — generate TWO different 64-character secrets
JWT_SECRET=paste_your_first_64_char_secret_here
JWT_REFRESH_SECRET=paste_your_second_64_char_secret_here

# Your Vercel URL — you'll create this in Phase 4. Use a placeholder for now.
CLIENT_URL=https://planova.vercel.app
```

To **save and exit** nano:
- Press `Ctrl + O` → press `Enter` (saves the file)
- Press `Ctrl + X` (exits the editor)

### Step 13 — Build and start the backend

```bash
# Build your app into a Docker container (takes 2-4 minutes the first time)
docker build -t planova-backend .

# Start the container
# --restart always = automatically restarts if server reboots
# --env-file .env = loads your secrets from the .env file
# -p 4000:4000 = exposes port 4000 to the internet
docker run -d \
  --name planova-backend \
  --restart always \
  --env-file .env \
  -p 4000:4000 \
  planova-backend

# Run your database migrations (creates all the tables in Neon)
docker exec planova-backend npx prisma migrate deploy

# Check the logs — should show "Server running on port 4000"
docker logs planova-backend --tail 30
```

### Step 14 — Test your backend

Open your browser and go to:

```
http://YOUR_ORACLE_IP:4000/health
```

Replace `YOUR_ORACLE_IP` with your actual IP. If you see a JSON response, your backend is live.

---

## Phase 4 — Deploy Frontend (Vercel)

> Vercel hosts your React app and makes it available at a public URL like `planova.vercel.app`. It auto-deploys every time you push code to GitHub.

### Step 15 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → Continue with GitHub
3. Click **Add New → Project**
4. Find your `planova` repository and click **Import**
5. Set **Root Directory** to `frontend` (click Edit → type `frontend`)
6. Vercel will auto-detect Vite — don't change the framework setting
7. Click **Environment Variables** and add these two:

| Variable Name | Value |
|---|---|
| `VITE_API_URL` | `http://YOUR_ORACLE_IP:4000/api` |
| `VITE_SOCKET_URL` | `http://YOUR_ORACLE_IP:4000` |

   Replace `YOUR_ORACLE_IP` with your actual Oracle IP from Step 7.

8. Click **Deploy** — takes about 2 minutes
9. When done, you'll get a URL like `https://planova-abc123.vercel.app`

### Step 16 — Update backend with your real frontend URL

Go back to your SSH terminal and update the `CLIENT_URL`:

```bash
# Open the .env file
nano .env

# Change this line to your real Vercel URL:
# CLIENT_URL=https://planova-abc123.vercel.app

# Save: Ctrl+O → Enter → Ctrl+X

# Restart the backend to apply the change
docker restart planova-backend
```

---

## Final Checklist — Is Everything Working?

Go through each of these to confirm:

- [ ] `http://YOUR_IP:4000/health` returns JSON in the browser
- [ ] Your Vercel URL loads the Planova login page
- [ ] You can create an account and log in
- [ ] You can create a project and add tasks (confirms Neon DB is connected)
- [ ] Open the app in two browser tabs — changes in one appear in the other (confirms real-time/Socket.IO works)

---

## Updating the App Later

Every time you push new code to GitHub, **Vercel auto-deploys the frontend**. For the backend, SSH into your server and run:

```bash
cd ~/planova/backend
git pull
docker build -t planova-backend .
docker stop planova-backend && docker rm planova-backend
docker run -d --name planova-backend --restart always --env-file .env -p 4000:4000 planova-backend
docker exec planova-backend npx prisma migrate deploy
```

---

## Useful Commands (run inside SSH)

```bash
# See live backend logs
docker logs planova-backend -f

# Restart backend
docker restart planova-backend

# Check how much disk space is used
df -h

# Check if Docker container is running
docker ps
```

---

## Cost Summary

| Service | Cost | Free Limit |
|---|---|---|
| Oracle Cloud VM | $0 forever | 4 CPU, 24 GB RAM |
| Neon Postgres | $0 forever | 0.5 GB storage |
| Upstash Redis | $0 forever | 10,000 requests/day |
| Vercel Frontend | $0 forever | 100 GB bandwidth/month |
| **Total** | **$0** | |
