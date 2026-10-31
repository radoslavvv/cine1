import { accountLayoutTheme as theme } from './AccountLayout.theme';
import type { ReactNode } from 'react';
import { AccountHeader } from '../AccountHeader/AccountHeader';
import { CarpetFooter } from '../../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';

export function AccountLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div id="account-top" className={theme.page}>
      <ProjectorAtmosphere />
      <div className={theme.container}>
        <AccountHeader />
        <div className={theme.content}>
          <p className={theme.eyebrow}>YOUR CINEMA, YOUR SEAT</p>
          <h1 className={theme.title}>{title}</h1>
          <section className={theme.panel}>{children}</section>
        </div>
      </div>
      <CarpetFooter topId="account-top" />
    </div>
  );
}
