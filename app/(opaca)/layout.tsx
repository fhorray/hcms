import { MakeRootLayout } from '@/cms/admin';
import config from '@/opaca.config';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <MakeRootLayout config={config}>{children}</MakeRootLayout>
);

export default Layout;
