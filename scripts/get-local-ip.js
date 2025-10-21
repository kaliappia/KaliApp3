#!/usr/bin/env node

// Script pour obtenir automatiquement l'adresse IP locale
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const interfaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[interfaceName]) {
      // Ignorer les interfaces internes et IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1'; // Fallback
}

const localIP = getLocalIP();
console.log(localIP);
