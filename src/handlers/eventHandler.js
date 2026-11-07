'use strict';

/**
 * Event loader.
 *
 * Every .js file under src/events/ must export:
 *   name     - a discord.js event name (e.g. "ready", "interactionCreate")
 *   execute  - async (...eventArgs, client) => void   (client is passed LAST)
 * Optional:
 *   once     - true to listen only once
 *
 * Errors thrown by an event are caught and logged so one failing handler can
 * never crash the whole bot.
 */

const path = require('node:path');
const { walkJsFiles } = require('../utils/files');
const { createLogger } = require('../utils/logger');

const log = createLogger('events');
const EVENTS_DIR = path.join(__dirname, '..', 'events');

/**
 * Load all event modules and attach them to the client.
 * @param {import('discord.js').Client} client
 */
function registerEvents(client) {
  let count = 0;

  for (const file of walkJsFiles(EVENTS_DIR)) {
    const relative = path.relative(EVENTS_DIR, file);
    let event;
    try {
      event = require(file);
    } catch (error) {
      log.error(`Failed to load event file ${relative}`, error);
      continue;
    }

    if (!event || typeof event.name !== 'string' || typeof event.execute !== 'function') {
      log.warn(`Skipping ${relative}: must export "name" (string) and "execute" (function)`);
      continue;
    }

    const listener = async (...args) => {
      try {
        await event.execute(...args, client);
      } catch (error) {
        log.error(`Unhandled error in event "${event.name}"`, error);
      }
    };

    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);
    count += 1;
  }

  log.info(`Registered ${count} event(s)`);
}

module.exports = { registerEvents };
