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
import { Loader2, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default dynamic(() => Promise.resolve(MinutesPage), { ssr: false })

// Add page break styles
const pageBreakStyles = `
  @media print {
    .page-break-before {
      page-break-before: always;
    }
    .page-break-after {
      page-break-after: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
  }
`

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
    toast({
      title: "Generando PDF",
      description: "Por favor espere mientras se genera el documento...",
    })

    try {
      const content = pdfContentRef.current
      const canvas = await html2canvas(content, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
        imageTimeout: 0,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const scale = Math.min(1, pageHeight / imgHeight)
      const finalImgHeight = imgHeight * scale

      pdf.setFillColor(248, 249, 250)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      pdf.addImage(
        imgData,
        "PNG",
        10,
        10,
        imgWidth,
        finalImgHeight
      )

      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text("Documento Confidencial", pageWidth / 2, pageHeight - 10, {
        align: "center",
      })

      const safeDate = fecha.replace(/-/g, "_") || format(new Date(), "yyyy-MM-dd")
      pdf.save(`Minuta_${safeDate}.pdf`)

      toast({
        title: "PDF generado con éxito",
        description: "El documento ha sido descargado correctamente.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error al generar PDF",
        description: "Ha ocurrido un error al generar el documento. Intente nuevamente.",
        variant: "destructive",
      })
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

      <div className="w-full max-w-4xl">
        {/* Form content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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

        {/* PDF Preview */}
        <div 
          ref={pdfContentRef}
          className="bg-white p-6 rounded-md border border-slate-200 shadow-sm"
          data-pdf-content="true"
        >
          <div className="flex justify-between items-center mb-6">
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
            <div className="text-sm text-slate-500">{format(new Date(), "PPP", { locale: es })}</div>
          </div>

          <div className="space-y-4">
            {/* Información General */}
            <div className="bg-slate-50 rounded-md p-3 border-l-4 border-green-600 avoid-break pdf-section">
              <h4 className="text-sm font-medium text-green-700 mb-1 border-b border-slate-200 pb-1">
                Información General
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex">
                  <span className="text-slate-500 w-[120px]">Lugar:</span>
                  <span className="font-medium">{lugar || "No especificado"}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-[120px]">Fecha:</span>
                  <span className="font-medium">{fecha || "No especificada"}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-[120px]">Hora Inicio:</span>
                  <span className="font-medium">{horaInicio || "No especificada"}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-[120px]">Hora Fin:</span>
                  <span className="font-medium">{horaFin || "No especificada"}</span>
                </div>
              </div>
            </div>

            {/* Objetivo */}
            <div className="bg-slate-50 rounded-md p-3 border-l-4 border-green-600 avoid-break pdf-section">
              <h4 className="text-sm font-medium text-green-700 mb-1 border-b border-slate-200 pb-1">
                Objetivo
              </h4>
              <p className="text-sm">{objetivo || "No especificado"}</p>
            </div>

            {/* Temas */}
            <div className="bg-slate-50 rounded-md p-3 border-l-4 border-green-600 avoid-break pdf-section">
              <h4 className="text-sm font-medium text-green-700 mb-1 border-b border-slate-200 pb-1">
                Temas Tratados
              </h4>
              <div className="space-y-4">
                {[
                  { tema: tema1, desc: desc1 },
                  { tema: tema2, desc: desc2 },
                  { tema: tema3, desc: desc3 }
                ].map((item, index) => (
                  item.tema && (
                    <div key={index} className="space-y-1">
                      <p className="font-medium text-sm">{item.tema}</p>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Tareas */}
            <div className="bg-slate-50 rounded-md p-3 border-l-4 border-green-600 avoid-break pdf-section">
              <h4 className="text-sm font-medium text-green-700 mb-1 border-b border-slate-200 pb-1">
                Tareas Asignadas
              </h4>
              <div className="space-y-2">
                {tareas.map((tarea, index) => (
                  tarea.ref && (
                    <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                      <div className="col-span-1">{tarea.ref}</div>
                      <div className="col-span-1">{tarea.resp}</div>
                      <div className="col-span-1">{tarea.fecha}</div>
                      <div className="col-span-1">{tarea.coment}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Participantes */}
            <div className="bg-slate-50 rounded-md p-3 border-l-4 border-green-600 avoid-break pdf-section">
              <h4 className="text-sm font-medium text-green-700 mb-1 border-b border-slate-200 pb-1">
                Participantes
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {participantes.map((participante, index) => (
                  participante && (
                    <p key={index} className="text-xs py-0.5">{participante}</p>
                  )
                ))}
              </div>
            </div>

            
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all duration-300 hover:shadow-green-200"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Descargar Minuta
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
