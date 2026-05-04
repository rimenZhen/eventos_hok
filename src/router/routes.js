const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Públicas
      { path: '', name: 'inicio', component: () => import('pages/IndexPage.vue') },
      { path: 'descubre', name: 'descubre', component: () => import('pages/DescubreMas.vue') },
      { path: 'politicas', component: () => import('pages/PoliticasPage.vue') },
      { path: 'sobre-nosotros', component: () => import('pages/SobreNosotrosPage.vue') },
      { path: 'estadisticas', component: () => import('pages/alcaldia/EstadisticasPage.vue') },

      // Auth
      { path: 'auth/login', name: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'auth/registro', name: 'registro', component: () => import('pages/auth/RegistroPage.vue') },

      // Detalles públicos
      { path: 'evento/:id', name: 'detalle-evento', component: () => import('pages/DetalleEvento.vue') },
      { path: 'sitio/:id', name: 'detalle-sitio', component: () => import('pages/DetalleSitio.vue') },
      { path: 'negocio/:id', name: 'detalle-negocio', component: () => import('pages/DetalleNegocio.vue') },

      // Usuario (autenticado, cualquier rol)
      {
        path: 'usuario',
        meta: { requiresAuth: true, roles: ['usuario_final', 'negocio', 'alcaldia'] },
        children: [
          { path: 'perfil', name: 'perfil', component: () => import('pages/usuario/PerfilPage.vue') },
          { path: 'favoritos', name: 'favoritos', component: () => import('pages/usuario/FavoritosPage.vue') },
          { path: 'historial', name: 'historial', component: () => import('pages/usuario/HistorialViajesPage.vue') },
          { path: 'resenas', name: 'mis-resenas', component: () => import('pages/usuario/MisResenasPage.vue') }
        ]
      }
    ]
  },

  // Alcaldía (autenticado, rol alcaldia)
  {
    path: '/alcaldia',
    component: () => import('layouts/MainLayout.vue'), // o AdminLayout si prefieres
    meta: { requiresAuth: true, roles: ['alcaldia'] },
    children: [
      { path: '', name: 'dashboard-alcaldia', component: () => import('pages/alcaldia/DashboardPage.vue') },
      { path: 'eventos', name: 'gestion-eventos', component: () => import('pages/alcaldia/GestionEventosPage.vue') },
      { path: 'eventos/crear', name: 'crear-evento', component: () => import('pages/alcaldia/FormularioEventoPage.vue') },
      { path: 'eventos/editar/:id', name: 'editar-evento', component: () => import('pages/alcaldia/FormularioEventoPage.vue') },
      { path: 'sitios', name: 'gestion-sitios', component: () => import('pages/alcaldia/GestionSitiosPage.vue') },
      { path: 'sitios/crear', name: 'crear-sitio', component: () => import('pages/alcaldia/FormularioSitioPage.vue') },
      { path: 'sitios/editar/:id', name: 'editar-sitio', component: () => import('pages/alcaldia/FormularioSitioPage.vue') },
      { path: 'solicitudes', name: 'solicitudes-negocios', component: () => import('pages/alcaldia/SolicitudesNegociosPage.vue') },
      { path: 'negocios', name: 'admin-negocios', component: () => import('pages/alcaldia/AdministracionNegociosPage.vue') },
      { path: 'estadisticas', name: 'estadisticas-alcaldia', component: () => import('pages/alcaldia/EstadisticasPage.vue') }
    ]
  },

  // Negocio (autenticado, rol negocio)
  {
    path: '/negocio',
    component: () => import('layouts/MainLayout.vue'), // o AdminLayout
    meta: { requiresAuth: true, roles: ['negocio'] },
    children: [
      { path: '', name: 'dashboard-negocio', component: () => import('pages/negocio/DashboardPage.vue') },
      { path: 'perfil', name: 'mi-negocio', component: () => import('pages/negocio/MiNegocioPage.vue') },
      { path: 'editar', name: 'editar-negocio', component: () => import('pages/negocio/EditarNegocioPage.vue') },
      { path: 'catalogo', name: 'catalogo', component: () => import('pages/negocio/CatalogoPage.vue') },
      { path: 'estadisticas', name: 'estadisticas-negocio', component: () => import('pages/negocio/EstadisticasPage.vue') },
      { path: 'resenas', name: 'resenas-negocio', component: () => import('pages/negocio/ResenasPage.vue') }
    ]
  },

  // 404 (siempre al final)
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
