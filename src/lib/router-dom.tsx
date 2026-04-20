'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import NextLink from 'next/link';
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
} from 'next/navigation';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
};

type NavLinkState = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

type NavLinkProps = Omit<LinkProps, 'children' | 'className'> & {
  className?: string | ((state: NavLinkState) => string);
  children?: ReactNode | ((state: NavLinkState) => ReactNode);
};

type NavigateOptions = {
  replace?: boolean;
};

const isExternalUrl = (to: string): boolean =>
  to.startsWith('http://') ||
  to.startsWith('https://') ||
  to.startsWith('mailto:') ||
  to.startsWith('tel:');

export function Link({
  to,
  replace,
  scroll,
  prefetch,
  children,
  ...rest
}: LinkProps) {
  if (isExternalUrl(to)) {
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <NextLink
      href={to}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

export function NavLink({ to, className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname() || '/';
  const normalizedTo = to.split('?')[0] || '/';
  const isActive =
    pathname === normalizedTo ||
    (normalizedTo !== '/' && pathname.startsWith(`${normalizedTo}/`));

  const state: NavLinkState = {
    isActive,
    isPending: false,
    isTransitioning: false,
  };

  const resolvedClassName =
    typeof className === 'function' ? className(state) : className;

  const resolvedChildren =
    typeof children === 'function' ? children(state) : children;

  return (
    <Link
      to={to}
      className={resolvedClassName}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {resolvedChildren}
    </Link>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      if (to <= -1) {
        router.back();
      } else if (to >= 1) {
        router.forward();
      }
      return;
    }

    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  return {
    pathname,
    search,
    hash,
    state: null,
    key: pathname,
  };
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
>() {
  return useNextParams() as T;
}

export function BrowserRouter({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Route({
  element,
  children,
}: {
  element?: ReactNode;
  children?: ReactNode;
}) {
  return <>{element ?? children ?? null}</>;
}

export function Outlet() {
  return null;
}
