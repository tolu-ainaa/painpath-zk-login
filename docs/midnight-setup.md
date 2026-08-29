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
- Get funds from the faucet **for the network the wallet is actually on** —
  preprod: <https://faucet.preprod.midnight.network/>,
  preview: <https://faucet.preview.midnight.network/>.
  Request tokens, wait a few minutes, then **Generate tDUST** and confirm the
  transaction. The faucet sends tNIGHT to the unshielded address; *Generate
  tDUST* delegates it into the tDUST that actually pays for transactions.
  tDUST has no value outside the testnet.

> **The faucet address gotcha.** Lace holds three addresses and the faucet
> accepts exactly one. Its default view is Cardano — you need the separate
> **Midnight tab → Receive → Unshielded address**.
>
> | Address | Prefix | Faucet |
> |---|---|---|
> | Cardano | `addr_test1…` | rejected |
> | Midnight shielded | `mn_shield-addr_preprod1…` | `InvalidAddressError` |
> | Midnight unshielded | `mn_addr_preprod1…` | accepted |
>
> Set the wallet's network **before** copying the address — the prefix encodes
> the network (`_preprod`, `_preview`, `_undeployed`), and an address from the
> wrong one is rejected even though the same seed generated it.

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

## Step 7 — The gate ✅ CLEARED

`bboard-cli` has a **`standalone`** script that the tutorial page does not
mention. It is the fastest way through the gate:

```bash
cd example-bboard/bboard-cli
npm run standalone
```

It uses testcontainers to bring up the whole stack from `compose.yml` —
`midnight-node:0.22.3`, `indexer-standalone:4.0.1`, `proof-server:8.0.3` — on
ephemeral ports. Crucially, `StandaloneConfig` sets `generateDust = false` and
`buildWallet` short-circuits to `GENESIS_MINT_WALLET_SEED`, so **it needs no
Lace wallet and no testnet funds.** The dev-preset node funds the genesis
wallet itself (NIGHT 250000000000000, Dust 1.25e24).

Verified round trip on this machine:

| | after `post` | after `takeDown` |
|---|---|---|
| `state` | `occupied` | `vacant` |
| `message` | `PainPath ZK login smoke test` | `none` |
| `sequence` | 1 | **2** — the replay guard |
| `owner` | `f8940f30ce351c21d9d06ca5cf6b20625e008776f52ea342dc1631ee0607261d` | unchanged |

The only thing derived from the secret that ever reaches the ledger is that
32-byte commitment.

Testnet deployment (`npm run preprod-remote`) still needs Lace and tDUST, but
that is a Phase 3 concern — it does not block the gate.

> **Driving the CLI non-interactively.** It uses `readline`, so piping all the
> answers at once (`printf '1\n1\n…' | npm run standalone`) fails with
> `readline was closed` — stdin hits EOF during the ~30s wallet sync, before
> the first prompt. Feed it through a FIFO and hold the write end open, pacing
> the answers around proof generation (deploy ~20s, post and takeDown ~2–3 min
> each).

---

## Windows gotchas actually hit on this machine

None of these are in the official docs.

1. **`wsl --install --no-launch` skips first-run user creation.** Launch the
   distro once so the UNIX account exists, or WSL falls back to root with
   `HOME` set to a mangled Windows path — which breaks nvm and the Compact
   installer, both of which install into `$HOME`.
2. **Docker Desktop's `docker` group takes gid 1000 first**, so the user
   account lands on uid 1001 while WSL's default-user pointer still says 1000
   → `getpwuid(1000) failed`.
3. **`wsl --terminate` tears down `/mnt/wsl/docker-desktop`**, the cross-distro
   mount Docker Desktop builds when *it* starts the distro. `docker` in WSL
   then fails as "command not found" from a dangling symlink. Restarting Docker
   Desktop rebuilds it — give it several minutes, it is slower than it looks.
4. **The daemon socket is not linked automatically.** If `/var/run/docker.sock`
   is missing, link it and fix the mode — it is created `755`, and sockets need
   *write* to connect:
   ```bash
   sudo ln -sf /mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock /var/run/docker.sock
   sudo chown root:docker /var/run/docker.sock && sudo chmod 660 /var/run/docker.sock
   ```
   This is a stopgap — it does not survive a Docker Desktop restart. The
   durable fix is **Settings → Resources → WSL Integration → enable Ubuntu**.
5. **The Ubuntu image ships without `unzip`.** The Compact installer fails with
   "Failed to spawn artifact extraction command", then leaves a version
   directory containing only an unextracted `artifact.zip` — after which
   `compact update` reports "already installed" while `compactc` does not
   exist. Fix: `apt install unzip`, `rm -rf ~/.compact/versions/0.31.0`, retry.

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
