import { Button } from '@/components/ui/button';
import { DatabaseIcon, FileTextIcon } from 'lucide-react';
import * as config from '@opaca-config';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            {config.admin.appName}
          </h1>
          <p className="text-xl text-muted-foreground">
            {config.admin.appDescription}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-cms-accent-blue to-cms-accent-purple hover:opacity-90"
          >
            <a href="/admin">
              <DatabaseIcon className="w-5 h-5 mr-2" />
              Access CMS Admin
            </a>
          </Button>
          <Button variant="outline" size="lg">
            <FileTextIcon className="w-5 h-5 mr-2" />
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
