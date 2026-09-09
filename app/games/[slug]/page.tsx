import ScriptOrGamePage, {
  generateMetadata,
} from '@/app/scripts/[slug]/page';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export { generateMetadata };
export default ScriptOrGamePage;

