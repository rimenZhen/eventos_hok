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
  <!-- Políticas de Privacidad -->
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">Políticas de Privacidad y Protección de Datos</div>
      <p class="q-mt-md">
        En <strong>El Salvador Turismo</strong> nos comprometemos a proteger sus datos personales
        de acuerdo con la <strong>Ley de Protección de Datos Personales de El Salvador</strong>
        (Decreto Legislativo N° 887, 2021) y el Reglamento General de Protección de Datos (GDPR)
        cuando corresponda.
      </p>

      <div class="q-mt-md">
        <h6>1. Datos que recopilamos</h6>
        <p>✔️ Información de registro: nombre, apellidos, correo electrónico y rol (usuario final, alcaldía o negocio).<br>
        ✔️ Datos de navegación: interacciones con la plataforma, búsquedas y preferencias.<br>
        ✔️ Contenido generado por el usuario: reseñas, favoritos y historial de viajes.</p>

        <h6>2. Uso de la información</h6>
        <p>✔️ Operar y mejorar la plataforma.<br>
        ✔️ Personalizar recomendaciones de eventos, sitios y negocios.<br>
        ✔️ Comunicarnos sobre actividades relevantes.<br>
        ✔️ <strong>No</strong> utilizamos sus datos para fines no autorizados ni los vendemos a terceros.</p>

        <h6>3. Base legal del tratamiento</h6>
        <p>El tratamiento de sus datos se fundamenta en:<br>
        (i) su <strong>consentimiento explícito</strong> al registrarse,<br>
        (ii) la <strong>ejecución del contrato</strong> de prestación del servicio, y<br>
        (iii) nuestro <strong>interés legítimo</strong> en mejorar la plataforma.</p>

        <h6>4. Compartición de datos</h6>
        <p>✔️ <strong>No vendemos</strong> sus datos personales.<br>
        ✔️ Se comparten únicamente con alcaldías o negocios cuando usted interactúa con ellos (ej. al dejar una reseña pública).<br>
        ✔️ Los datos agregados (estadísticas) son <strong>anónimos</strong> y no permiten identificación personal.</p>

        <h6>5. Seguridad</h6>
        <p>Implementamos medidas técnicas y organizativas:<br>
        ✔️ Hash de contraseñas con <strong>bcrypt</strong>.<br>
        ✔️ Autenticación básica en <strong>CouchDB</strong>.<br>
        ✔️ Comunicación mediante <strong>HTTPS</strong>.<br>
        ✔️ Acceso restringido a las bases de datos.</p>

        <h6>6. Sus derechos (ARCO + oposición)</h6>
        <p>Usted tiene derecho a <strong>acceder, rectificar, cancelar y oponerse</strong> al tratamiento de sus datos.
        Puede ejercer estos derechos:<br>
        ✔️ Enviando un correo a <strong>datos@elsalvadorturismo.com</strong><br>
        ✔️ O directamente desde su <strong>perfil de usuario</strong> en la plataforma.</p>

        <h6>7. Retención de datos</h6>
        <p>Conservamos sus datos <strong>mientras su cuenta esté activa</strong>. Si la elimina:<br>
        ✔️ Los datos de reseñas y favoritos se <strong>anonimizan</strong> (se elimina su identidad).<br>
        ✔️ Conservamos información agregada con fines estadísticos, pero no asociada a usted.</p>

        <h6>8. Actualizaciones de esta política</h6>
        <p>Notificaremos cambios significativos a través de:<br>
        ✔️ Correo electrónico (si ha proporcionado uno).<br>
        ✔️ Un aviso destacado dentro de la plataforma.</p>
      </div>

      <div class="text-caption text-grey q-mt-md">📅 Última actualización: mayo de 2026</div>
    </q-card-section>
  </q-card>

  <!-- Términos y Condiciones -->
  <q-card flat bordered>
    <q-card-section>
      <div class="text-h6">Términos y Condiciones de Uso</div>

      <h6>1. Aceptación</h6>
      <p>Al utilizar nuestra plataforma, <strong>acepta estos términos</strong> en su totalidad. Si no está de acuerdo, no debe usar el servicio.</p>

      <h6>2. Responsabilidades del usuario</h6>
      <p>✔️ Usted es responsable de la <strong>veracidad y actualización</strong> de los datos proporcionados.<br>
      ✔️ No debe publicar contenido <strong>ilegal, ofensivo, difamatorio o que infrinja derechos de terceros</strong> (incluyendo propiedad intelectual).<br>
      ✔️ El incumplimiento puede derivar en la <strong>suspensión o cancelación</strong> de su cuenta.</p>

      <h6>3. Responsabilidad de la plataforma</h6>
      <p>✔️ Actuamos como un <strong>intermediario</strong> que conecta a usuarios, alcaldías y negocios.<br>
      ✔️ <strong>No somos responsables</strong> por la veracidad de la información publicada por alcaldías o negocios, ni por la calidad de los servicios que estos ofrezcan.<br>
      ✔️ Tampoco garantizamos la disponibilidad continua del servicio ante fallos técnicos ajenos a nuestra voluntad.</p>

      <h6>4. Modificaciones de los términos</h6>
      <p>Nos reservamos el derecho de <strong>modificar estos términos en cualquier momento</strong>.<br>
      Los cambios serán notificados por:<br>
      ✔️ Correo electrónico (si está disponible).<br>
      ✔️ Un aviso visible en la web.<br>
      El uso continuado de la plataforma después de los cambios implica su <strong>aceptación tácita</strong>.</p>
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
