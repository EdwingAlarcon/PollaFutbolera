import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            ⚽ Polla Futbolera
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Crea predicciones de fútbol y compite con tus amigos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Comenzar Gratis
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-green-600 font-bold py-3 px-8 rounded-lg border-2 border-green-600 transition"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Crea tu Polla</h3>
            <p className="text-gray-600">
              Configura tu polla privada para cualquier torneo de fútbol
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Invita Amigos</h3>
            <p className="text-gray-600">
              Comparte el código de invitación y juega con conocidos
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Compite</h3>
            <p className="text-gray-600">
              Sigue el ranking en tiempo real y gana puntos
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Cómo funciona?
          </h2>
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <ol className="text-left space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </span>
                <div>
                  <strong>Regístrate</strong> con tu email o Google
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </span>
                <div>
                  <strong>Crea una polla</strong> o únete con un código de invitación
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </span>
                <div>
                  <strong>Predice resultados</strong> antes de cada partido
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </span>
                <div>
                  <strong>Gana puntos</strong> y sube en el ranking
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
