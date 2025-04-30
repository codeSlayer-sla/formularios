"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, FileText, FileCheck, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
export default function SelectionPage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleSelection = (option: string) => {
    setSelectedOption(option)
    setIsTransitioning(true)

    // Simular un tiempo de transición antes de navegar
    setTimeout(() => {
      router.push(`/${option}`)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-500 to-gray-700 text-gray-800 overflow-hidden">
      
      {/* Contenido principal */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen bg-blue:300">
        {/* Logo y título con animación */}
        <motion.div
          className="text-center mb-16"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center mb-6">
            <Image src="/images/logo.png" alt="Omicron Logo" width={220} height={80} className="h-auto" priority />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-red-300">
            Sistema de Proyectos 
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Seleccione el tipo de acta que desea generar para su proyecto
          </p>
        </motion.div>

        {/* Opciones de selección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <OptionCard
            title="Acta de Inicio"
            description="Genere un acta para formalizar el inicio de un nuevo proyecto y establecer sus parámetros iniciales."
            icon={<FileCheck className="h-8 w-8" />}
            color="from-red-600 to-red-800"
            isSelected={selectedOption === "inicio"}
            onClick={() => handleSelection("inicio")}
            disabled={isTransitioning}
          />
         
          
          
          

          <OptionCard
            title="Acta de Cierre"
            description="Genere un acta para documentar la finalización formal de un proyecto y sus resultados."
            icon={<FileCheck className="h-8 w-8" />}
            color="from-blue-600 to-blue-800"
            isSelected={selectedOption === "cierre"}
            onClick={() => handleSelection("cierre")}
            disabled={isTransitioning}
          />

          
        </div>
        <br/>
        <OptionCard
            title="Minuta"
            description="Genere una minuta para documentar los acuerdos y decisiones tomadas durante la reunión."
            icon={<FileText className="h-8 w-8" />}
            color="from-green-600 to-green-800"
            isSelected={selectedOption === "minuta"}
            onClick={() => handleSelection("minuta")}
            disabled={isTransitioning}
          />

        
      </div>

      {/* Overlay de transición */}
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 bg-gray-300 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Image src="/images/logo.png" alt="Omicron Logo" width={180} height={60} className="h-auto" />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// Componente de tarjeta de opción
function OptionCard({
  title,
  description,
  icon,
  color,
  isSelected,
  onClick,
  disabled,
}: {
  title: string
  description: string
  icon: React.ReactNode
  color: string
  isSelected: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden cursor-pointer ${disabled ? "pointer-events-none" : ""}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`}></div>
      <div className={`absolute inset-0 backdrop-blur-sm ${isSelected ? "bg-white/20" : ""}`}></div>

      <div className="relative p-8 h-full flex flex-col">
        <div className="bg-white/20 p-3 rounded-full w-fit mb-4">{icon}</div>

        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-white/80 mb-6 flex-grow">{description}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-medium text-white/70">{isSelected ? "Seleccionado" : "Seleccionar"}</span>
          <motion.div
            animate={isSelected ? { x: [0, 5, 0] } : {}}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
          >
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </div>
      </div>

      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 border-white rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
