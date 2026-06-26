import type { Credentials } from '@shared/types/credentials.js';

// The legacy default admin credentials.
// New installs no longer get this password automatically: an unset ADMIN_PASSWORD
// now generates a random one (see boot/envPassword.ts). These values are still
// used to (a) authenticate the test suite and (b) detect existing installs that
// never rotated the old default, so we can warn them on boot.
// If changing these you should update user instructions in `install.md`.
export const defaultCredentials: Credentials = {
  username: 'admin',
  password: 'picr1234',
};
