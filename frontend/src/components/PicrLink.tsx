import { ReactNode } from 'react';
import { Anchor, AnchorProps, Menu, MenuItemProps } from '@mantine/core';
import { NavLink, NavLinkProps } from 'react-router';

//These override Mantine components with NavLink stuff so we get proper links that work with router

export const PicrLink = ({
  children,
  ...props
}: { children: ReactNode } & AnchorProps & NavLinkProps) => {
  return (
    <Anchor component={NavLink} {...props}>
      {children}
    </Anchor>
  );
};
export const PicrMenuItem = ({
  children,
  to,
  ...props
}: {
  children: ReactNode;
  to: string;
} & Omit<MenuItemProps, 'component'> &
  Partial<NavLinkProps>) => {
  return (
    <Menu.Item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={NavLink as any}
      to={to}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      {children}
    </Menu.Item>
  );
};
