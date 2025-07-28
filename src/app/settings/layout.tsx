import Link from 'next/link';
import { User, Settings, Users, Zap, CreditCard, Shield, Trash2, LogOut, Database, KeyRound } from 'lucide-react';

const navItems = [
  { label: 'General', icon: Settings, href: '/settings#general' },
  { label: 'Account', icon: User, href: '/settings#account' },
  { label: 'Workspace', icon: Users, href: '/settings#workspace' },
  { label: 'Integrations', icon: Zap, href: '/settings#integrations' },
  { label: 'Subscription', icon: CreditCard, href: '/settings#subscription' },
  { label: 'Danger Zone', icon: Trash2, href: '/settings#danger' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
