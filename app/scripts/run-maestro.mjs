import { spawn } from 'node:child_process';

const target = process.argv[2];

if (!target) {
  throw new Error('A Maestro flow or workspace path is required.');
}

const platform = process.env['MAESTRO_PLATFORM'] ?? 'android';
const expoPort = process.env['MAESTRO_EXPO_PORT'] ?? '8081';

if (platform !== 'android' && platform !== 'ios') {
  throw new Error('MAESTRO_PLATFORM must be either android or ios.');
}

if (!/^\d+$/.test(expoPort)) {
  throw new Error('MAESTRO_EXPO_PORT must be a port number.');
}

const getDevClientUrl = async () => {
  const configuredUrl = process.env['MAESTRO_DEV_CLIENT_URL'];
  if (configuredUrl) return configuredUrl;

  const endpoint = new URL(`http://127.0.0.1:${expoPort}/_expo/link`);
  endpoint.searchParams.set('platform', platform);
  endpoint.searchParams.set('choice', 'expo-dev-client');

  try {
    const response = await fetch(endpoint, { redirect: 'manual' });
    const location = response.headers.get('location');

    if (response.status !== 307 || !location) {
      throw new Error(`Expo returned HTTP ${response.status}`);
    }

    return location;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not get a development-client URL from Expo on port ${expoPort} (${reason}). ` +
        'Start Metro with `npx expo start --dev-client`, set MAESTRO_EXPO_PORT if it chose another port, ' +
        'or provide the full launch URI as MAESTRO_DEV_CLIENT_URL.',
    );
  }
};

const devClientUrl = await getDevClientUrl();
const child = spawn('maestro', ['test', target], {
  env: {
    ...process.env,
    MAESTRO_DEV_CLIENT_URL: devClientUrl,
  },
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`Could not start Maestro: ${error.message}`);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Maestro exited after receiving ${signal}.`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});
