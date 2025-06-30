export const protectedRoutes = [
  { path: '/api/urls', method: 'GET' },
  { path: '/api/urls', method: 'POST' },
  { path: '/api/urls/:id', method: 'PUT' },
  { path: '/api/urls/:id', method: 'DELETE' },
];

export const isProtectedRoute = (path: string, method: string): boolean => {
  return protectedRoutes.some(route => {
    const pathMatches = route.path === path || 
      (route.path.includes(':') && 
       new RegExp('^' + route.path.replace(/:[^/]+/g, '[^/]+') + '$').test(path));
    return pathMatches && route.method === method;
  });
};
