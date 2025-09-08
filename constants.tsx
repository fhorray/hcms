import {
  Baby,
  Beef,
  Beer,
  Bike,
  BookMarked,
  BookOpen,
  Briefcase,
  Building,
  Car,
  ChefHat,
  Dumbbell as CrossTraining,
  DoorOpen,
  Droplets,
  Dumbbell,
  Fence,
  Flame,
  Gamepad2,
  GraduationCap,
  Joystick,
  PartyPopper,
  PawPrint,
  Shield,
  ShowerHead,
  Sofa,
  Star,
  Store,
  Sun,
  ThermometerSun,
  TreePine,
  Users,
  WashingMachine,
  Waves,
} from 'lucide-react';

export const ROLES = {
  Superadmin: 'superadmin',
  Admin: 'admin',
  Editor: 'editor',
} as const;

export const ROLE_LIST = Object.values(ROLES);

export const APP_CONFIG = {
  NAME: 'Construtora Metrocasa',
  DESCRIPTION: 'DESCRIPTION',
  LANG: 'pt-BR',
  PREFIX: 'metrocasa',
  STORAGE_URL: 'https://stgmedia.grupometrocasa.com', // eg.: https://media.yourdomain.com
  EMAIL: 'contato@metrocasa.com.br',
};
