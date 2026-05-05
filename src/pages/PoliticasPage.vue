<template>
  <q-page padding class="politicas-page">
    <div class="text-center q-mb-lg">
      <h2 class="text-h4 text-weight-bolder">Políticas de la Plataforma</h2>
      <div class="title-underline"></div>
    </div>

    <!-- Políticas de Privacidad -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Políticas de Privacidad y Protección de Datos</div>
        <p class="q-mt-md">
          En <strong>El Salvador Turismo</strong> nos comprometemos a proteger sus datos personales
          de acuerdo con la <strong>Ley para la Protección de Datos Personales de El Salvador</strong>
          (Decreto Legislativo N° 144, 12 de noviembre de 2024), que alinea la normativa nacional
          con los estándares internacionales en la materia[reference:1].
        </p>

        <div class="q-mt-md">
          <h6>1. Datos que recopilamos</h6>
          <p>
            ✔️ <strong>Información de registro:</strong> nombre, apellidos, correo electrónico y rol (usuario final, alcaldía o negocio).<br>
            ✔️ <strong>Datos de navegación:</strong> interacciones con la plataforma, búsquedas y preferencias.<br>
            ✔️ <strong>Contenido generado por el usuario:</strong> reseñas, favoritos y historial de viajes.
          </p>

          <h6>2. Uso de la información</h6>
          <p>
            ✔️ Operar y mejorar la plataforma.<br>
            ✔️ Personalizar recomendaciones de eventos, sitios y negocios.<br>
            ✔️ Comunicarnos sobre actividades relevantes.<br>
            ✔️ <strong>No</strong> utilizamos sus datos para fines no autorizados ni los vendemos a terceros.
          </p>

          <h6>3. Base legal del tratamiento</h6>
          <p>
            El tratamiento de sus datos se fundamenta en:<br>
            (i) su <strong>consentimiento explícito</strong> al registrarse,<br>
            (ii) la <strong>ejecución del contrato</strong> de prestación del servicio, y<br>
            (iii) nuestro <strong>interés legítimo</strong> en mejorar la plataforma.[reference:2]
          </p>

          <h6>4. Compartición de datos</h6>
          <p>
            ✔️ <strong>No vendemos</strong> sus datos personales.<br>
            ✔️ Se comparten únicamente con alcaldías o negocios cuando usted interactúa con ellos (ej. al dejar una reseña pública).<br>
            ✔️ Los datos agregados (estadísticas) son <strong>anónimos</strong> y no permiten identificación personal.<br>
            ✔️ Cualquier transferencia internacional de datos se realizará con los mismos niveles de protección exigidos por la ley[reference:3].
          </p>

          <h6>5. Seguridad</h6>
          <p>
            Implementamos medidas técnicas y organizativas para proteger su información:<br>
            ✔️ Hash de contraseñas con <strong>bcrypt</strong>.<br>
            ✔️ Autenticación básica en <strong>CouchDB</strong>.<br>
            ✔️ Comunicación mediante <strong>HTTPS</strong>.<br>
            ✔️ Acceso restringido a las bases de datos.<br>
            ✔️ En caso de una brecha de seguridad, notificaremos a la autoridad competente en un plazo máximo de 72 horas, conforme a la ley[reference:4].
          </p>

          <h6>6. Sus derechos ARCO-POL</h6>
          <p>
            Usted, como titular de los datos personales, tiene derecho a ejercer los <strong>Derechos ARCO-POL</strong>, que comprenden:<br>
            ✔️ <strong>Acceso:</strong> conocer qué datos personales tenemos sobre usted y para qué se usan.<br>
            ✔️ <strong>Rectificación:</strong> solicitar la corrección de sus datos si son inexactos o incompletos.[reference:5]<br>
            ✔️ <strong>Cancelación:</strong> solicitar la eliminación de sus datos personales.<br>
            ✔️ <strong>Oposición:</strong> oponerse a que tratemos sus datos para fines específicos.<br>
            ✔️ <strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y transferirlos a otro responsable.<br>
            ✔️ <strong>Olvido:</strong> solicitar la supresión de sus datos personales cuando ya no sean necesarios.<br>
            ✔️ <strong>Limitación del Tratamiento:</strong> suspender el procesamiento de sus datos mientras se resuelve una impugnación.<br>
            Puede ejercer estos derechos enviando un correo a <strong>datos@elsalvadorturismo.com</strong>, indicando su nombre completo, domicilio, los derechos que desea ejercer y adjuntando un documento que acredite su identidad[reference:6].
          </p>

          <h6>7. Plazo de respuesta y delegado de datos</h6>
          <p>
            Hemos designado un <strong>Delegado de Protección de Datos (DPD)</strong> para garantizar el manejo adecuado de su información personal. El Delegado responderá a su solicitud de derechos ARCO-POL en un plazo de <strong>veinte (20) días hábiles</strong>, prorrogable por otros veinte (20) días hábiles por causas justificadas[reference:7]. Si su solicitud está incompleta, el Delegado le solicitará información adicional una sola vez, y usted contará con diez (10) días hábiles para completarla; de lo contrario, la solicitud será archivada sin más trámite[reference:8].
          </p>

          <h6>8. Retención de datos</h6>
          <p>
            Conservamos sus datos <strong>mientras su cuenta esté activa</strong>. Si la elimina:<br>
            ✔️ Los datos de reseñas y favoritos se <strong>anonimizan</strong> (se elimina su identidad).<br>
            ✔️ Conservamos información agregada con fines estadísticos, pero no asociada a usted.
          </p>

          <h6>9. Actualizaciones de esta política</h6>
          <p>
            Notificaremos cambios significativos a través de:<br>
            ✔️ Correo electrónico (si ha proporcionado uno).<br>
            ✔️ Un aviso destacado dentro de la plataforma.
          </p>
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
        <p>
          ✔️ Usted es responsable de la <strong>veracidad y actualización</strong> de los datos proporcionados.<br>
          ✔️ No debe publicar contenido <strong>ilegal, ofensivo, difamatorio o que infrinja derechos de terceros</strong> (incluyendo propiedad intelectual).<br>
          ✔️ El incumplimiento puede derivar en la <strong>suspensión o cancelación</strong> de su cuenta.
        </p>

        <h6>3. Responsabilidad de la plataforma</h6>
        <p>
          ✔️ Actuamos como un <strong>intermediario</strong> que conecta a usuarios, alcaldías y negocios.<br>
          ✔️ <strong>No somos responsables</strong> por la veracidad de la información publicada por alcaldías o negocios, ni por la calidad de los servicios que estos ofrezcan.<br>
          ✔️ Tampoco garantizamos la disponibilidad continua del servicio ante fallos técnicos ajenos a nuestra voluntad.
        </p>

        <h6>4. Modificaciones de los términos</h6>
        <p>
          Nos reservamos el derecho de <strong>modificar estos términos en cualquier momento</strong>.<br>
          Los cambios serán notificados por:<br>
          ✔️ Correo electrónico (si está disponible).<br>
          ✔️ Un aviso visible en la web.<br>
          El uso continuado de la plataforma después de los cambios implica su <strong>aceptación tácita</strong>.
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// No se requiere lógica adicional
</script>

<style scoped>
.politicas-page {
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
