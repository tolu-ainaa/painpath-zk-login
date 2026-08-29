# Phase 2 — Midnight development environment

Version-pinned setup runbook for this machine (Windows 11, no WSL, no Docker).

> **Midnight does not support Windows natively.** From the toolchain docs:
> *"Development is supported on Linux and Mac. Windows is not supported
> natively at this time, if you are using Windows, development through WSL is
> recommended."*
>
> So everything below the first step happens **inside WSL**, not in PowerShell.

## Machine state at the start of Phase 2

| Requirement | Needed | Present |
|---|---|---|
| Node.js | 24.11.1+ (`.nvmrc` in example-bboard) | 24.18.0 on Windows — none in WSL yet |
| WSL2 | Required (Midnight is Linux/Mac only) | **Not installed** |
| Docker | Required — proof server is a container | **Not installed** |
| Hardware virtualisation | Required for WSL2 | Enabled |
| Compact compiler | `compactc 0.31.0` | Not installed |
| Lace wallet | 1.36.0+, Chrome or Edge | Not installed |

---

## Step 1 — WSL2 + Docker Desktop (Windows, elevated)

Run in an **Administrator** PowerShell:

```powershell
wsl --install --no-launch -d Ubuntu
winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

Then **reboot**. After the reboot:

1. Launch **Ubuntu** from the Start menu and create your UNIX user.
2. Launch **Docker Desktop** and accept the licence agreement.
3. Docker Desktop → **Settings → Resources → WSL Integration** → enable
   **Ubuntu**. This is what puts `docker` on `PATH` inside WSL; without it
   every later step fails with `docker: command not found`.

Verify from inside Ubuntu:

```bash
docker info --format '{{.ServerVersion}}'
```

## Step 2 — Node (inside WSL)

```bash
sudo apt update && sudo apt install -y curl git build-essential
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 24.11.1
nvm alias default 24.11.1
node --version
```

## Step 3 — Compact toolchain (inside WSL)

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source ~/.bashrc
compact update 0.31.0
compact --version
compact compile --version
```

## Step 4 — Lace wallet (Windows, manual)

Chrome or Edge extension, **1.36.0 or newer**. Install it, create the wallet,
and write the seed phrase down on paper.

Then:

- Point it at the local proof server: **Settings → Midnight →
  `Local (http://localhost:6300)`**
- Get funds from the preprod faucet: <https://faucet.preprod.midnight.network/>
  Paste your address, request tokens, wait a few minutes, then **Generate
  tDUST** and confirm the transaction. tDUST has no value; it only exists to
  pay for testnet transactions.

## Step 5 — bboard tutorial (inside WSL)

```bash
git clone https://github.com/midnightntwrk/example-bboard.git
cd example-bboard
npm install

cd contract
npm run compact      # compactc → TypeScript bindings + ZK circuits
npm run build
cd ..

cd bboard-cli
npm run build
```

## Step 6 — Proof server

Its own terminal, left running:

```bash
cd example-bboard/bboard-cli
docker compose -f proof-server-local.yml up -d
```

The server listens on `http://localhost:6300`. It **must** stay up for the
whole of Phases 3 and 4 — every proof is generated through it. The single most
common way to lose a day here is starting work with Docker not running.

## Step 7 — The gate

```bash
cd example-bboard/bboard-cli
npm run preprod-remote
```

Deploy a board, post a message, take it down. **Do not start Phase 3 until this
round trip completes.** If you are stuck past three hours, ask in the Midnight
Discord `#mlh-hackers` channel rather than grinding alone.

---

## What bboard gives us for Phase 3

The bboard contract is the thing we fork — its shape maps almost directly onto
the ZK login:

| bboard | PainPath ZK Login |
|---|---|
| `owner` — a 32-byte commitment from a persistent hash | the clinician's credential commitment |
| `localSecretKey()` witness — reads the secret, never discloses it | `localSecret()` |
| `sequence` Counter — prevents replay | the nullifier set |
| `post` / `takeDown` circuits | `register` / `authenticate` circuits |

Which is why the plan says fork it rather than starting from an empty file.

## Sources

- [Toolchain installation](https://docs.midnight.network/examples/getting-started/installation)
- [bboard tutorial](https://docs.midnight.network/develop/tutorial/building/bboard)
- [example-bboard repository](https://github.com/midnightntwrk/example-bboard)
- [Lace wallet guide](https://docs.midnight.network/guides/lace-wallet)
- [Preprod faucet](https://faucet.preprod.midnight.network/)
