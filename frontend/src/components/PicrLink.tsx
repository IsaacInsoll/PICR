import type { ReactNode } from 'react';
import type { AnchorProps, MenuItemProps } from '@mantine/core';
import { Anchor, Menu } from '@mantine/core';
import type { NavLinkProps } from 'react-router';
import { NavLink } from 'react-router';

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
  onClick,
  ...props
}: {
  children: ReactNode;
  to: string;
  onClick?: () => void;
} & Omit<MenuItemProps, 'component'>) => {
  return (
    <NavLink to={to} onClick={onClick}>
      <Menu.Item {...props}>{children}</Menu.Item>
    </NavLink>
  );
};
