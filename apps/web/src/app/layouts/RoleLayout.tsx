import { NavLink, Outlet, useLocation } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';
import './role-layout.css';

interface RoleRoute {
  to: string;
  label: string;
}

interface RoleLayoutProps {
  title: string;
  description: string;
  routes: RoleRoute[];
  cta?: ReactNode;
}

export const RoleLayout = ({ title, description, routes, cta, children }: PropsWithChildren<RoleLayoutProps>) => {
  const location = useLocation();

  return (
    <div className="role-layout">
      <aside className="role-layout__sidebar">
        <div className="role-layout__hero">
          <h1>{title}</h1>
          <p>{description}</p>
          {cta}
        </div>
        <nav>
          <ul>
            {routes.map((route) => (
              <li key={route.to}>
                <NavLink to={route.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                  {route.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className="role-layout__content" aria-live="polite">
        <div className="role-layout__breadcrumbs">当前路径：{location.pathname}</div>
        {children ?? <Outlet />}
      </section>
    </div>
  );
};
