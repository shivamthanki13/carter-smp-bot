# CARTER BOT

Custom Discord management bot for the **CARTER SMP** Minecraft community.

- Node.js 20+ · discord.js v14 · SQLite (better-sqlite3) · slash commands
- Built for low-RAM hosting (512 MB target)
- You own the full source code (MIT license)

## Status: Phase 1 of the build

| Phase 1 (this release) | Later phases |
| --- | --- |
| Project structure, command + event loaders | Welcome / goodbye, autoroles, role menus |
| SQLite database + migrations + guild config table | Moderation commands and warnings |
| `/ping`, `/help`, `/botinfo` | Anti-spam / auto-moderation |
| Command deploy script | Tickets, suggestions |
| Cooldowns, central error handling, safe logger | Logging system, utility + admin config commands |
| Automated tests for database and utilities | Remaining info commands (`/ip`, `/rules`, ...) |

---

## Project layout

```
carter-bot/
├── src/
│   ├── index.js                  entry point (client, shutdown, error safety nets)
│   ├── config/index.js           reads .env, validates it
│   ├── commands/
│   │   ├── utility/              ping.js, help.js
│   │   ├── minecraft/            botinfo.js
│   │   ├── admin/ moderation/ tickets/   (empty until later phases)
│   ├── events/                   ready.js, guildCreate.js, interactionCreate.js
│   ├── handlers/                 commandHandler.js, eventHandler.js
│   ├── database/                 index.js (helpers), migrations.js (schema)
│   ├── services/                 (used from Phase 2)
│   └── utils/                    logger, embeds, errors, cooldowns, format, files
├── scripts/deploy-commands.js    registers slash commands with Discord
├── tests/                        automated tests (node:test)
├── data/                         SQLite database lives here (git-ignored)
├── .env.example  .gitignore  package.json  LICENSE  README.md
```

**Adding a command:** drop a file in `src/commands/<category>/`, exporting `data` (a `SlashCommandBuilder`) and `execute(interaction, client)`. Run `npm run deploy`. Nothing else needs editing.

---

## 1. Discord Developer Portal setup

1. Go to <https://discord.com/developers/applications> and click **New Application**. Name it `CARTER BOT`.
2. **General Information** tab: copy the **Application ID** → this is your `CLIENT_ID`.
3. **Bot** tab:
   - Click **Reset Token**, copy it once → this is your `DISCORD_TOKEN`. Treat it like a password. If it ever leaks, reset it immediately.
   - **Privileged Gateway Intents:** Phase 1 needs **none**. Later phases will need *Server Members Intent* and *Message Content Intent*; I will tell you exactly when to switch them on.
   - Turn **Public Bot** off so nobody else can add it.
4. **Invite the bot** (minimum permissions for Phase 1: View Channels, Send Messages, Embed Links). Replace `YOUR_CLIENT_ID`:

   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=19456
   ```

   Do **not** give the bot Administrator. Permissions for moderation features will be requested in the phases that need them.
5. Get your server ID: Discord → Settings → Advanced → enable **Developer Mode**, then right-click the CARTER SMP server icon → **Copy Server ID** → this is `GUILD_ID`.

---

## 2. Android Termux setup

Install Termux from **F-Droid** (<https://f-droid.org/packages/com.termux/>), not the old Play Store build.

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git python make clang binutils
node -v        # must be v20 or newer
termux-setup-storage   # optional, only if you want to access phone storage
```

Get the project into Termux (pick one):

```bash
# a) from git, if you push it to your own repo
git clone <your-repo-url> carter-bot

# b) from a zip copied to your phone
unzip carter-bot.zip && cd carter-bot
```

Install dependencies and configure:

```bash
cd carter-bot
npm install
cp .env.example .env
nano .env        # fill DISCORD_TOKEN, CLIENT_ID, GUILD_ID  (Ctrl+O, Enter, Ctrl+X to save)
```

Register commands, then start:

```bash
npm run deploy
npm start
```

Keep it running while the screen is off: pull down the notification shade and tap **Acquire wakelock** on the Termux notification, and disable battery optimization for Termux. Android may still kill background apps, so Termux is for development, not permanent hosting.

## 3. Windows setup

1. Install Node.js LTS (v20+) from <https://nodejs.org>.
2. Open PowerShell in the project folder:

   ```powershell
   npm install
   copy .env.example .env
   notepad .env
   npm run deploy
   npm start
   ```

If `better-sqlite3` fails to install on Windows, install "Desktop development with C++" from Visual Studio Build Tools, then run `npm install` again.

---

## 4. Environment variables

| Variable | Required | Meaning |
| --- | --- | --- |
| `DISCORD_TOKEN` | yes | Bot token (secret) |
| `CLIENT_ID` | yes | Application ID |
| `GUILD_ID` | recommended | Server to deploy commands to instantly; empty = global (up to 1 hour) |
| `DATABASE_PATH` | no | Default `./data/carter-bot.sqlite` |
| `LOG_LEVEL` | no | `debug`, `info` (default), `warn`, `error` |
| `MC_*` | no | Minecraft details; defaults already set to CARTER SMP values |

---

## 5. Expected output

`npm run deploy`:

```
[INFO ] [commands] Loaded 3 command(s)
[INFO ] [deploy] Deploying 3 command(s) to guild 123...
[INFO ] [deploy] Successfully deployed 3 command(s): /botinfo, /help, /ping
```

`npm start`:

```
[INFO ] [main] Starting CARTER BOT...
[INFO ] [database] Applied migration 1: guild_config      (first run only)
[INFO ] [database] Database ready (schema v1) {"file":"carter-bot.sqlite"}
[INFO ] [commands] Loaded 3 command(s)
[INFO ] [events] Registered 3 event(s)
[INFO ] [ready] Logged in as CARTER BOT#1234
[INFO ] [ready] Connected to 1 server(s)
[INFO ] [ready] CARTER BOT is ready.
```

(Each line is prefixed with a timestamp.) The bot shows as online with the status "Playing CARTER SMP | /help".

---

## 6. Phase 1 test checklist

- [ ] `npm test` → all tests pass
- [ ] `npm run deploy` succeeds
- [ ] `npm start` reaches "CARTER BOT is ready."
- [ ] Bot is online in your server
- [ ] Typing `/` shows `/ping`, `/help`, `/botinfo`
- [ ] `/ping` shows round-trip and gateway latency
- [ ] `/help` lists all three commands (only you can see it)
- [ ] `/botinfo` shows uptime, memory, versions
- [ ] Running `/ping` twice quickly shows a cooldown message
- [ ] Stop with `Ctrl+C` → logs "shutting down gracefully" and "Database closed"
- [ ] Restart: no "Applied migration" line, `data/carter-bot.sqlite` still exists

---

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `DISCORD_TOKEN is missing` | `.env` doesn't exist or is empty. Run `cp .env.example .env` and fill it in. Make sure the file is named exactly `.env`. |
| `An invalid token was provided` | Reset the token in the Developer Portal and paste the new one, no quotes or spaces. |
| `Unknown application` (deploy) | `CLIENT_ID` is wrong; use the Application ID. |
| `Missing Access` (deploy) | Re-invite the bot using the URL above (must include `applications.commands`) and check `GUILD_ID`. |
| Commands don't appear | Run `npm run deploy` again. With no `GUILD_ID` it can take up to an hour. Restart Discord (Ctrl+R). |
| "Used disallowed intents" | You enabled an intent in code without enabling it in the portal. Phase 1 uses none. |
| `Cannot find module 'better-sqlite3'` / bindings error | Run `npm install` again. On Termux make sure `python make clang` are installed. |
| `better-sqlite3` fails to build on Termux (gyp errors mentioning `android_ndk_path`) | Run `export GYP_DEFINES="android_ndk_path=''"` and then `npm install` again. This is a commonly reported workaround for node-gyp on Termux. |
| `SQLITE_BUSY` / database locked | Only one copy of the bot may run at a time. Check with `ps aux \| grep node`. |
| `getaddrinfo ENOTFOUND discord.com` | No internet connection or DNS problem. |
| Bot online but commands say "application did not respond" | Check the console for an error line; the bot must be running the same code you deployed. |

---

## 8. Running on Linux hosting (preview, detailed in a later phase)

```bash
npm install --omit=dev
cp .env.example .env && nano .env
npm run deploy
npm start
```

For automatic restart after crashes, a process manager such as `pm2` (`npm i -g pm2 && pm2 start src/index.js --name carter-bot`) or a systemd service works. The bot exits with code 1 on fatal errors so a manager can restart it.

Free hosts frequently sleep, restart or limit usage; **uptime is not guaranteed**.

**Backing up the database:** stop the bot (or use SQLite's backup) and copy `data/carter-bot.sqlite`. With the bot stopped, one file is enough. Example: `cp data/carter-bot.sqlite backups/carter-bot-$(date +%F).sqlite`. A scripted backup command arrives in a later phase.

## Security notes

- The token is only read from `.env`; `.env` is git-ignored. Never paste it in chat or screenshots.
- The logger masks token-shaped strings and fields named like `token`/`password`.
- All SQL uses bound parameters; dynamic column names are whitelisted.
- The bot never runs shell commands from Discord and does not need Administrator.
