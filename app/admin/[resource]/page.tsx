import { getCloudflareContext } from '@opennextjs/cloudflare';

async function getPosts() {
  const res = await fetch(
    `${getCloudflareContext().env.NEXT_PUBLIC_BASE_URL}/api/posts`,
    {
      // em dev pode ser simplesmente "/api/posts"
      cache: 'no-store',
    },
  );
  return res.json() as Promise<any[]>;
}

async function getSchema(resource: string) {
  const res = await fetch(
    `${
      getCloudflareContext().env.NEXT_PUBLIC_BASE_URL
    }/api/_schema/${resource}`,
    {
      // em dev pode ser simplesmente "/api/_schema/..."
      cache: 'no-store',
    },
  );
  return res.json() as Promise<any>;
}

export default async function AdminPosts({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;

  const posts = await getPosts();
  const schema = await getSchema(resource);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Resources: {resource ?? 'N/A'}</h1>
      <ul className="list-disc pl-6">
        {posts?.map((p: any) => (
          <li key={p.id}>
            <b>{p.title}</b>
          </li>
        ))}
      </ul>
      {/* depois você inclui um <form> que faz POST para /api/posts */}
    </main>
  );
}
