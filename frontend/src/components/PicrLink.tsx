import { ReactNode } from 'react';
import { Anchor, AnchorProps, Menu } from '@mantine/core';
import { NavLink, NavLinkProps } from 'react-router';
import { MenuItemsProps } from './PicrDataGrid';

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
  ...props
}: { children: ReactNode } & MenuItemsProps & NavLinkProps) => {
  return (
    <Menu.Item component={NavLink} {...props}>
      {children}
    </Menu.Item>
  );
};
