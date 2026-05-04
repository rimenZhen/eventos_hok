<template>
  <q-page padding class="institutional-page">
    <div class="text-center q-mb-lg">
      <h2 class="text-h4 text-weight-bolder">Información Institucional</h2>
      <div class="title-underline"></div>
    </div>

    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
    >
      <q-tab name="policies" label="Políticas" icon="gavel" />
      <q-tab name="about" label="Sobre Nosotros" icon="group" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated>
      <!-- POLÍTICAS -->
      <q-tab-panel name="policies">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Políticas de Privacidad y Protección de Datos</div>
            <p class="q-mt-md">
              En <strong>El Salvador Turismo</strong> nos comprometemos a proteger sus datos personales
              de acuerdo con la <strong>Ley de Protección de Datos Personales de El Salvador</strong>
              (Decreto Legislativo N° 887, 2021) y el Reglamento General de Protección de Datos (GDPR)
              cuando corresponda.
            </p>

            <h6>1. Datos que recopilamos</h6>
            <p>Recopilamos información de registro (nombre, correo, rol), datos de navegación, y contenido generado por el usuario (reseñas, favoritos, historial de viajes).</p>

            <h6>2. Uso de la información</h6>
            <p>Utilizamos sus datos para operar la plataforma, personalizar recomendaciones, y comunicarnos sobre eventos/negocios. No usamos sus datos para fines no autorizados.</p>

            <h6>3. Base legal del tratamiento</h6>
            <p>El tratamiento de sus datos se basa en: (i) su consentimiento explícito al registrarse, (ii) la ejecución de un contrato (prestación del servicio), y (iii) nuestro interés legítimo en mejorar la plataforma.</p>

            <h6>4. Compartición de datos</h6>
            <p>No vendemos sus datos. Sus datos se comparten únicamente con alcaldías y negocios cuando usted interactúa con ellos (ej. al dejar una reseña pública). Los datos agregados (estadísticas) son anónimos.</p>

            <h6>5. Seguridad</h6>
            <p>Implementamos medidas técnicas y organizativas: hash de contraseñas con bcrypt, autenticación básica en CouchDB, comunicación HTTPS, y acceso restringido a bases de datos.</p>

            <h6>6. Sus derechos (ARCO + oposición)</h6>
            <p>Usted tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos. Puede ejercerlos escribiendo a <strong>datos@elsalvadorturismo.com</strong> o desde su perfil de usuario.</p>

            <h6>7. Retención de datos</h6>
            <p>Conservamos sus datos mientras su cuenta esté activa. Si la elimina, anonimizamos los datos de reseñas y favoritos, pero conservamos información agregada con fines estadísticos.</p>

            <h6>8. Actualizaciones de esta política</h6>
            <p>Notificaremos cambios significativos por correo electrónico o mediante un aviso en la plataforma.</p>

            <div class="text-caption text-grey q-mt-md">Última actualización: mayo de 2026</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Términos y Condiciones de Uso</div>
            <h6>1. Aceptación</h6>
            <p>Al usar nuestra plataforma, acepta estos términos. Si no está de acuerdo, no utilice el servicio.</p>
            <h6>2. Responsabilidades del usuario</h6>
            <p>Es responsable de la veracidad de los datos proporcionados. No debe publicar contenido ilegal, ofensivo o que infrinja derechos de terceros.</p>
            <h6>3. Responsabilidad de la plataforma</h6>
            <p>Actuamos como intermediarios. No somos responsables por la veracidad de la información publicada por alcaldías o negocios, ni por la calidad de los servicios ofrecidos.</p>
            <h6>4. Modificaciones</h6>
            <p>Podemos modificar estos términos en cualquier momento. Los cambios serán notificados por correo o mediante aviso en la web.</p>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- SOBRE NOSOTROS (con fotos del equipo) -->
      <q-tab-panel name="about">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">¿Quiénes somos?</div>
            <p>
              <strong>El Salvador Turismo</strong> es una plataforma digital que conecta a viajeros, locales,
              alcaldías y negocios para promover el turismo sostenible en El Salvador. Nacimos con la misión
              de visibilizar los atractivos culturales, naturales y gastronómicos del país, facilitando el acceso
              a eventos, sitios turísticos y servicios locales.
            </p>
            <div class="text-h6 q-mt-md">Nuestra misión</div>
            <p>Impulsar la economía local mediante el turismo inteligente, ofreciendo información confiable y actualizada.</p>
          </q-card-section>
        </q-card>

        <!-- Equipo de desarrollo (6 integrantes) -->
        <q-card flat bordered>
    <q-card-section>
      <div class="text-h6 text-center q-mb-md">Equipo de desarrollo</div>
      <div class="row q-col-gutter-md justify-center">
        <div v-for="miembro in equipo" :key="miembro.nombre" class="col-6 col-sm-4 col-md-3">
          <div class="text-center">
            <q-avatar size="100px" class="q-mb-sm" icon="person" color="primary" text-color="white" />
              <template v-if="miembro.foto">
                <img :src="miembro.foto" :alt="miembro.nombre" style="object-fit: cover;">
              </template>
              <q-icon v-else name="person" color="primary" size="60px" />
            <div class="text-subtitle1 text-weight-bold">{{ miembro.nombre }}</div>
            <div class="text-caption text-grey">{{ miembro.rol || 'Desarrollador' }}</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Contacto</div>
            <p>✉️ info@elsalvadorturismo.com<br>📞 +503 2222-3333<br>📍 San Salvador, El Salvador</p>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const tab = ref('policies')

// Lista de 6 integrantes (cambia nombres, roles y rutas de fotos)
const equipo = ref([
  { nombre: 'Carlos Hernandez', foto: '/equipo/ana.jpg', rol: 'Frontend Lead' },
  { nombre: 'Brandon Cartagena', foto: '/equipo/carlos.jpg', rol: 'Backend Developer' },
  { nombre: 'Marvin Lemus', foto: '/equipo/laura.jpg', rol: 'UI/UX Designer' },
  { nombre: 'Jose Luna', foto: '/equipo/jose.jpg', rol: 'Database Admin' },
  { nombre: 'Andrea Soriano', foto: '/equipo/maria.jpg', rol: 'QA Tester' },
  { nombre: 'Edwin Herrera', foto: '/equipo/luis.jpg', rol: 'DevOps Engineer' }
])
</script>

<style scoped>
.institutional-page {
  max-width: 1200px;
  margin: 0 auto;
}
.title-underline {
  width: 80px;
  height: 4px;
  background: var(--q-color-primary);
  margin: 0.5rem auto 0;
  border-radius: 2px;
}
</style>
