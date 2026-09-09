import * as Icons from 'lucide-react';
import { LucideProps, FileCode } from 'lucide-react';

export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    name
  ];
  const Resolved = Cmp || FileCode;
  return <Resolved {...props} />;
}
