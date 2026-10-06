import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
import NotFound from '../src/components/NotFound';
import { routeAliases } from '../src/shared/routes';

export default function AliasPage() {
  const { alias } = useLocalSearchParams<{ alias: string }>();
  const path = routeAliases[alias];
  return path ? <Redirect href={path as Href} /> : <NotFound />;
}
