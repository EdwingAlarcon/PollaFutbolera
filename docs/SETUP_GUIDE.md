# 📖 Guía de Setup Detallada - Polla Futbolera

Esta guía te llevará paso a paso para tener tu app funcionando en 15-20 minutos.

## 📋 Checklist Rápido

- [ ] Node.js 18+ instalado
- [ ] Cuenta de Supabase creada
- [ ] Proyecto clonado/descargado
- [ ] Variables de entorno configuradas
- [ ] Base de datos inicializada
- [ ] App corriendo en local

---

## 🚀 Paso 1: Preparar el Entorno

### Instalar Node.js

Si no tienes Node.js:
1. Ve a [nodejs.org](https://nodejs.org)
2. Descarga la versión LTS (Long Term Support)
3. Instala y reinicia tu terminal

Verifica la instalación:
```bash
node --version  # Debe ser 18.0.0 o superior
npm --version
```

### Descargar el Proyecto

Si tienes el proyecto localmente, abre la terminal en la carpeta:
```bash
cd c:\Users\bdp_u\Documents\Repos\PollaFutbolera
```

---

## 🗄️ Paso 2: Configurar Supabase

### 2.1 Crear Cuenta y Proyecto

1. **Ir a Supabase**
   - Abre [supabase.com](https://supabase.com)
   - Haz clic en "Start your project"

2. **Crear Cuenta**
   - Regístrate con GitHub o email
   - Confirma tu email

3. **Crear Proyecto**
   - Clic en "New Project"
   - **Organization**: Crea una nueva (ej: "Mi Organización")
   - **Name**: `polla-futbolera` (o el nombre que quieras)
   - **Database Password**: Guarda esto en un lugar seguro
   - **Region**: Elige el más cercano (ej: South America - São Paulo)
   - **Plan**: Free (gratis)
   - Clic en "Create new project"

⏰ **Espera 2-3 minutos** mientras se crea el proyecto.

### 2.2 Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️) en el menú lateral
2. Click en **API**
3. Encontrarás:
   - **Project URL**: Algo como `https://abcdefghijk.supabase.co`
   - **anon/public key**: Una cadena larga que empieza con `eyJ...`

**📋 Copia ambos valores** (los usaremos en el Paso 3)

### 2.3 Crear las Tablas de la Base de Datos

1. En el menú lateral, ve a **SQL Editor**
2. Clic en el botón `+ New query`
3. Abre el archivo `database/schema.sql` de tu proyecto
4. **Copia todo el contenido** (Ctrl+A, Ctrl+C)
5. **Pégalo** en el editor de Supabase
6. Clic en **Run** (o presiona Ctrl+Enter)

✅ **Verifica que funcionó:**
- Deberías ver un mensaje verde "Success. No rows returned"
- Ve a **Table Editor** en el menú lateral
- Deberías ver las tablas: `users`, `pools`, `matches`, `predictions`, `pool_members`

### 2.4 Configurar Autenticación Email/Password

Ya está habilitado por defecto, pero verifica:

1. Ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado (toggle verde)

### 2.5 (OPCIONAL) Configurar Google OAuth

Solo si quieres permitir login con Google:

#### A. Configurar Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. En el menú lateral: **APIs & Services** → **Credentials**
4. Clic en **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
5. Si es tu primera vez, configura la **OAuth consent screen**:
   - User Type: **External**
   - App name: `Polla Futbolera`
   - User support email: tu email
   - Developer contact: tu email
   - Guarda
6. Vuelve a **Credentials** → **+ CREATE CREDENTIALS** → **OAuth Client ID**
7. Application type: **Web application**
8. Name: `Polla Futbolera`
9. **Authorized redirect URIs**: Agrega:
   ```
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```
   (Reemplaza `TU-PROYECTO` con el dominio de tu Supabase)
10. Clic en **CREATE**
11. **Copia** el Client ID y Client Secret

#### B. Configurar en Supabase

1. En Supabase, ve a **Authentication** → **Providers**
2. Busca **Google** y haz clic
3. Habilita el toggle
4. Pega el **Client ID** y **Client Secret**
5. Clic en **Save**

---

## ⚙️ Paso 3: Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo `.env.local`:
   ```bash
   # En Windows (PowerShell)
   copy .env.example .env.local
   
   # O manualmente: crea un archivo llamado .env.local
   ```

2. Abre `.env.local` con tu editor de texto

3. Reemplaza con tus valores de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Guarda el archivo**

---

## 📦 Paso 4: Instalar Dependencias

En la terminal, en la carpeta del proyecto:

```bash
npm install
```

Esto descargará todas las librerías necesarias (puede tomar 1-2 minutos).

---

## 🎉 Paso 5: Ejecutar la App

```bash
npm run dev
```

Deberías ver:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**Abre tu navegador** en [http://localhost:3000](http://localhost:3000)

---

## ✅ Paso 6: Probar la App

### Registrar tu Primera Cuenta

1. Haz clic en **"Comenzar Gratis"**
2. Llena el formulario:
   - Username: `admin`
   - Email: tu email
   - Contraseña: mínimo 6 caracteres
3. Clic en **"Crear cuenta"**

⚠️ **Nota**: Con Supabase en modo desarrollo, debes confirmar el email. Revisa tu bandeja de entrada y haz clic en el link.

### Crear tu Primera Polla

1. Una vez logueado, estarás en el Dashboard
2. Clic en **"+ Crear Nueva Polla"**
3. Nombre: `Polla de Prueba`
4. Torneo: `Mundial 2026`
5. Clic en **"Crear Polla"**

✅ **¡Listo!** Deberías ver tu polla creada con un código de invitación.

### Probar Invitaciones

1. Copia el código de invitación (ej: `ABC123`)
2. Abre una **ventana de incógnito**
3. Ve a [http://localhost:3000](http://localhost:3000)
4. Clic en **"Unirme con Código"**
5. Pega el código
6. Regístrate con otro usuario
7. Deberías unirte automáticamente a la polla

---

## 🚢 Paso 7: Deploy en Vercel (OPCIONAL)

### Opción A: Deploy Automático con GitHub

1. **Sube tu código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/polla-futbolera.git
   git push -u origin main
   ```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Clic en **"Add New..."** → **"Project"**
   - Importa tu repositorio de GitHub
   - **Environment Variables**: Agrega tus variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
     ```
   - Clic en **"Deploy"**

3. **Espera 1-2 minutos** y tu app estará en línea!

### Opción B: Deploy con CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Agrega las variables de entorno cuando se te pregunte
```

### Actualizar Google OAuth para Producción

Si configuraste Google OAuth, agrega tu dominio de Vercel:

1. En Google Cloud Console → Credentials
2. Edita tu OAuth Client ID
3. Agrega a **Authorized redirect URIs**:
   ```
   https://TU-APP.vercel.app/auth/callback
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```

---

## 🐛 Solución de Problemas

### Error: "No se puede crear el usuario"

**Causa**: Variables de entorno incorrectas

**Solución**:
1. Verifica que `.env.local` exista
2. Comprueba que las URLs no tengan espacios o comillas
3. Reinicia el servidor (`Ctrl+C` y `npm run dev`)

### Error: "relation 'users' does not exist"

**Causa**: No ejecutaste el SQL en Supabase

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta todo el contenido de `database/schema.sql`

### La página no carga / Error 500

**Causa**: Node.js desactualizado o dependencias faltantes

**Solución**:
```bash
# Actualiza Node.js a la versión 18+
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Google OAuth no funciona

**Causa**: URLs de callback incorrectas

**Solución**:
1. Verifica que el redirect URI en Google Cloud Console coincida exactamente con:
   ```
   https://tu-proyecto.supabase.co/auth/v1/callback
   ```
2. Sin espacios ni barras extra al final

---

## 📞 Necesitas Ayuda?

1. **Revisa los errores en la consola** del navegador (F12 → Console)
2. **Revisa la terminal** donde corre `npm run dev`
3. **Verifica Supabase Logs**: Dashboard → Logs
4. **Pregunta**: Abre un issue en GitHub con el error completo

---

## 🎯 Próximos Pasos

Ahora que tu app está funcionando:

1. **Personaliza los estilos** en `src/app/globals.css`
2. **Agrega partidos reales** en la tabla `matches`
3. **Integra una API de fútbol** para datos en tiempo real
4. **Invita a tus amigos** a probar la app

---

**¡Felicidades! 🎉 Tu app está lista.**

¿Quieres agregar más features? Revisa el README para ideas de próximas implementaciones.
