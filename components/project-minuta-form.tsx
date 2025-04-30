"use client"

import { useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { jsPDF } from "jspdf"
import Image from "next/image"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default dynamic(() => Promise.resolve(MinutesPage), { ssr: false })

function MinutesPage() {
  const { toast } = useToast()
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // --- estados ---
  const [lugar, setLugar] = useState("")
  const [fecha, setFecha] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [objetivo, setObjetivo] = useState("")
  const [tema1, setTema1] = useState(""); const [desc1, setDesc1] = useState("")
  const [tema2, setTema2] = useState(""); const [desc2, setDesc2] = useState("")
  const [tema3, setTema3] = useState(""); const [desc3, setDesc3] = useState("")
  const [tareas, setTareas] = useState(
    Array(3).fill(0).map(() => ({ ref: "", coment: "", resp: "", fecha: "" }))
  )
  const [participantes, setParticipantes] = useState(Array(5).fill(""))

  const updateTarea = (i: number, field: keyof typeof tareas[0], v: string) => {
    const tmp = [...tareas]; tmp[i][field] = v; setTareas(tmp)
  }
  const updatePart = (i: number, v: string) => {
    const tmp = [...participantes]; tmp[i] = v; setParticipantes(tmp)
  }

  // altura fija para todas las cajas
  const inputH = "h-[64px]"

  const generatePDF = useCallback(async () => {
    if (!pdfContentRef.current) return
    setIsGenerating(true)
    toast({ title: "Generando PDF", description: "Un momento por favor..." })

    try {
      const content = pdfContentRef.current
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const scale = Math.min(1, pageHeight / imgHeight)
      const finalImgHeight = imgHeight * scale

      pdf.setFillColor(248, 249, 250)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, finalImgHeight)

      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text("Documento Confidencial", pageWidth / 2, pageHeight - 10, {
        align: "center",
      })

      const safeDate = fecha.replace(/-/g, "_") || new Date().toISOString().slice(0,10)
      pdf.save(`Minuta_${safeDate}.pdf`)

      toast({ title: "PDF generado", description: "Listo.", variant: "success" })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }, [toast, fecha])

  return (

    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 space-y-6">
      <div className="flex items-center gap-4">
                        <Image
                          src="/images/logo.png"
                          alt="Omicron Logo"
                          width={150}
                          height={50}
                          className="h-auto"
                          priority
                        />
                        <div className="bg-green-600 text-white px-4 py-2 rounded-md">
                          <h2 className="text-lg font-bold">MINUTA</h2>
                        </div>
                      </div>
      
      
      <div className="w-full max-w-4xl bg-white rounded shadow" ref={pdfContentRef}>
        <div className="p-6 space-y-6 text-gray-800">
          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Lugar",     type: "text",  value: lugar,     onChange: setLugar },
              { label: "Fecha",     type: "date",  value: fecha,     onChange: setFecha },
              { label: "Hora inicio",      type: "time",  value: horaInicio, onChange: setHoraInicio },
              { label: "Hora finalización", type: "time",  value: horaFin,     onChange: setHoraFin },
            ].map((f, i) => (
              <div key={i} className="space-y-2">
                <label className="font-medium">{f.label}</label>
                <Input
                  type={f.type as any}
                  value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  className={`w-full ${inputH} border border-black`}
                />
              </div>
            ))}
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Objetivo</h2>
            <Textarea
              rows={3}
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
              className="w-full border border-black overflow-hidden"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Agenda</h2>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => {
                const tema = i===1? tema1 : i===2? tema2 : tema3
                const desc = i===1? desc1 : i===2? desc2 : desc3
                const setT = i===1? setTema1 : i===2? setTema2 : setTema3
                const setD = i===1? setDesc1 : i===2? setDesc2 : setDesc3
                return (
                  <div key={i} className="space-y-2">
                    <label className="font-medium">TEMA {i}</label>
                    <Input
                      value={tema}
                      onChange={e => setT(e.target.value)}
                      className={`w-full ${inputH} border border-black`}
                    />
                    <label className="font-medium">Descripción</label>
                    <Textarea
                      rows={3}
                      value={desc}
                      onChange={e => setD(e.target.value)}
                      className="w-full border border-black overflow-hidden"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Asignación de tareas */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Asignación de tareas</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  {["Ref.","Comentarios/Acuerdos","Responsable/s","Fecha cumpl."].map(h => (
                    <th key={h} className="border border-black px-2 py-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tareas.map((t, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1 text-center">
                      <Input
                        value={t.ref}
                        onChange={e => updateTarea(i, "ref", e.target.value)}
                        className={`w-full ${inputH} border-0`} /* outer td has black border */
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Textarea
                        rows={2}
                        value={t.coment}
                        onChange={e => updateTarea(i, "coment", e.target.value)}
                        className="w-full border-0 overflow-hidden"
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Input
                        value={t.resp}
                        onChange={e => updateTarea(i, "resp", e.target.value)}
                        className={`w-full ${inputH} border-0`}
                      />
                    </td>
                    <td className="border border-black p-1">
                      <Input
                        type="date"
                        value={t.fecha}
                        onChange={e => updateTarea(i, "fecha", e.target.value)}
                        className={`w-full ${inputH} border-0`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Participantes */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Participantes</h2>
            <div className="grid grid-cols-2 gap-4">
              {participantes.map((p, i) => (
                <Input
                  key={i}
                  value={p}
                  onChange={e => updatePart(i, e.target.value)}
                  placeholder={`Nombre ${i+1}`}
                  className={`w-full ${inputH} border border-black`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Botón descargar */}
        <br />
        <div className="p-4 text-right">
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating
              ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Generando PDF...</>
              : "Descargar PDF"}
          </Button>
        </div>
      </div>
    </div>
  )
}
