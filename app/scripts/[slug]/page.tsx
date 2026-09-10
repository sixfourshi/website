import { permanentRedirect } from 'next/navigation';

export default async function ScriptSlugRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;
  permanentRedirect(`/games/${resolvedParams.slug}`);
}
