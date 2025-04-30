"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingPage() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Preparando formulario...")

  useEffect(() => {
    const texts = [
      "Preparando formulario...",
      "Cargando componentes...",
      "Configurando validaciones...",
      "Casi listo...",
    ]

    // Simular progreso de carga
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 0.5
        if (newProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        return newProgress
      })

      // Cambiar texto según el progreso
      if (progress < 30) setLoadingText(texts[0])
      else if (progress < 60) setLoadingText(texts[1])
      else if (progress < 90) setLoadingText(texts[2])
      else setLoadingText(texts[3])
    }, 50)

    return () => clearInterval(interval)
  }, [progress])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex flex-col items-center justify-center text-gray-800">
      {/* Círculos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-600/20"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
            }}
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: 0.1,
            }}
            animate={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo animado */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="mb-8"
        >
          <Image src="/images/logo.png" alt="Omicron Logo" width={200} height={70} className="h-auto" priority />
        </motion.div>

        {/* Texto de carga */}
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingText}
            className="text-xl mb-6 text-gray-800/80"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {loadingText}
          </motion.p>
        </AnimatePresence>

        {/* Barra de progreso */}
        <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            style={{ width: `${progress}%` }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Porcentaje */}
        <p className="mt-2 text-sm text-gray-800/60">{progress}%</p>
      </div>
    </div>
  )
}
