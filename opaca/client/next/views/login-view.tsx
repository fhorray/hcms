'use client';

import { useOpaca } from '@opaca/client/hooks';
import { useAppForm } from '@/components/form/form-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function LoginView() {
  const router = useRouter();
  const { auth } = useOpaca();

  type FormData = {
    email: string;
    password: string;
    remember?: boolean;
  };

  // Initialize form
  const form = useAppForm({
    defaultValues: { email: '', password: '', remember: false },
    onSubmit: async ({ value }) => {
      auth.login.mutate(value, {
        onSuccess: () => router.push('/admin'),
      });
    },
  });

  return (
    <div className="min-h-[60vh] h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-muted-foreground">
              Access your Opaca CMS dashboard
            </p>
          </div>
        </div>

        {/* Card with form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-5"
            >
              {/* Email */}
              <form.AppField
                name="email"
                children={(field) => (
                  <field.InputField
                    type="email"
                    id="email"
                    label="Email"
                    placeholder="example@email.com"
                  />
                )}
              />

              {/* Password */}
              <form.AppField
                name="password"
                children={(field) => (
                  <field.PasswordField
                    id="password"
                    label="Password"
                    placeholder="••••••••"
                  />
                )}
              />
              {/* Remember + Forgot */}
              <div className="w-full flex items-center justify-between">
                <div className="w-full flex items-center gap-2">
                  <form.AppField
                    name="remember"
                    children={(field) => <field.SwitcherField id="remember" />}
                  />
                  <span className="w-full text-sm">Remember Me?</span>
                </div>

                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push('/admin/forgot')}
                >
                  Forgot password?
                </Button>
              </div>

              {/* Error message */}
              {/* {error && (
                <div className="text-sm text-red-500 border border-red-200 rounded-md p-2">
                  {error}
                </div>
              )} */}

              {/* Submit */}
              <Button
                type="submit"
                disabled={false}
                className="w-full cursor-pointer"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {false ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Optionally: link to sign up if you support it */}
        {/* <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/admin/sign-up')}>
            Create one
          </Button>
        </p> */}
      </div>
    </div>
  );
}
