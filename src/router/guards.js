import { useAuthStore } from 'src/stores/auth'

export default function (router) {
  router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    console.log('🔐 Guard:', {
      path: to.fullPath,
      isLoggedIn: auth.isLoggedIn,
      rol: auth.rol,
      user: auth.user
    })

    if (to.meta.requiresAuth) {
      if (!auth.isLoggedIn) {
        console.log('⛔ No autenticado → login')
        return next({ name: 'login', query: { redirect: to.fullPath } })
      }

      if (to.meta.roles && !to.meta.roles.includes(auth.rol)) {
        console.log(`⛔ Rol no autorizado (${auth.rol}) → redirigiendo`)
        if (auth.rol === 'alcaldia') return next('/alcaldia')
        if (auth.rol === 'negocio') return next('/negocio')
        return next('/')
      }
    }

    next()
  })
}
