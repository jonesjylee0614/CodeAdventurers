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
  
  console.log('[RoleLayout] 渲染中');
  console.log('[RoleLayout] location.pathname:', location.pathname);
  console.log('[RoleLayout] children:', children);

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
                <NavLink 
                  to={route.to}
                  end
                  className={({ isActive }) => {
                    console.log('[RoleLayout] NavLink', route.to, 'isActive:', isActive);
                    return isActive ? 'active' : undefined;
                  }}
                  onClick={(e) => {
                    console.log('[RoleLayout] NavLink clicked:', route.to);
                  }}
                >
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
