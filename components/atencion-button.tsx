"use client"

import { useState } from "react"
import { Smile, Copy, Check } from "lucide-react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Opciones para los selects
const PRODUCTOS = ["Docuware", "MyQ", "Papercut", "Softexpert", "AuraQuantic", "Desarrollo", "Hardware"]

const INGENIEROS = [
  "Edwin Jimenez",
  "Eduardo Valle",
  "Vladimir Cornejo",
  "Graciela Ubillus",
  "Mario Melendez",
  "Jose Muñoz",
]

export function AtencionButton() {
  // Estados para el modal y el formulario
  const [isOpen, setIsOpen] = useState(false)
  const [cliente, setCliente] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [producto, setProducto] = useState("")
  const [ingeniero, setIngeniero] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  // Función para generar y copiar la URL
  const generateAndCopyUrl = () => {
    // Validar que todos los campos estén completos
    if (!cliente || !empresa || !producto || !ingeniero) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    // Generar la URL con los parámetros codificados
    const url = `https://delighted.com/t/9FmsNvHS?name=${encodeURIComponent(cliente)}&empresa=${encodeURIComponent(empresa)}&producto=${encodeURIComponent(producto)}&preventa=${encodeURIComponent(ingeniero)}`

    // Copiar al portapapeles
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsCopied(true)
        toast({
          title: "URL copiada",
          description: "La URL ha sido copiada al portapapeles",
          variant: "success",
        })

        // Resetear el estado de copiado después de 2 segundos
        setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch((error) => {
        console.error("Error al copiar: ", error)
        toast({
          title: "Error",
          description: "No se pudo copiar la URL",
          variant: "destructive",
        })
      })
  }

  // Resetear el formulario al cerrar el modal
  const handleClose = () => {
    setIsOpen(false)
    setCliente("")
    setEmpresa("")
    setProducto("")
    setIngeniero("")
    setIsCopied(false)
  }

  return (
    <>
      {/* Botón de Atención con animación */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-orange-600 hover:bg-orange-700 shadow-lg flex items-center justify-center"
          aria-label="Atención"
        >
          <Smile className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Modal de formulario */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Smile className="h-5 w-5 text-blue-600" />
              Generar URL de Encuesta
            </DialogTitle>
            <DialogDescription>
              Complete los datos para generar una URL personalizada para la encuesta de satisfacción.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">
                Cliente
              </Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="empresa" className="text-right">
                Empresa
              </Label>
              <Input
                id="empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nombre de la empresa"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="producto" className="text-right">
                Producto
              </Label>
              <Select value={producto} onValueChange={setProducto}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTOS.map((prod) => (
                    <SelectItem key={prod} value={prod}>
                      {prod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ingeniero" className="text-right">
                Ingeniero
              </Label>
              <Select value={ingeniero} onValueChange={setIngeniero}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un ingeniero" />
                </SelectTrigger>
                <SelectContent>
                  {INGENIEROS.map((ing) => (
                    <SelectItem key={ing} value={ing}>
                      {ing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={generateAndCopyUrl} className="bg-blue-600 hover:bg-blue-700">
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Generar y Copiar URL
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
