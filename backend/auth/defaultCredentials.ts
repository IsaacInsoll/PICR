// This is the default account created if you first set up PICR
// These details are also used for testing
// If changing these you should update user instructions in `install.md`
export const defaultCredentials: ICredentials = {
  username: 'admin',
  password: 'picr1234',
};

export interface ICredentials {
  username: string;
  password: string;
}
