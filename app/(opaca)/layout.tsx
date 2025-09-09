import configPromise from '@/opaca.config';
import { MakeRootLayout } from '@/new-cms/admin';

const RootLayout = MakeRootLayout(configPromise);
export default RootLayout;
