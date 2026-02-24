import type { Credentials } from '../../shared/types/credentials.js';

// This is the default account created if you first set up PICR
// These details are also used for testing
// If changing these you should update user instructions in `install.md`
export const defaultCredentials: Credentials = {
  username: 'admin',
  password: 'picr1234',
};
