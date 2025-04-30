"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import GoHomeButton from "@/components/GoHomeButton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Users,
  Target,
  CheckSquare,
  Info,
} from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useMobile } from "@/hooks/use-mobile"

const pageBreakStyles = `
  @media print {
    .avoid-break {
      page-break-inside: avoid;
    }
  }
`

// -----------------------------------------
// Schema de validación
// -----------------------------------------
const formSchema = z.object({
  projectName: z.string().min(3),
  projectCode: z.string().min(2),
  startDate: z.date(),
  endDate: z.date(),
  projectType: z.string(),

  projectManager: z.string().min(3),
  teamMembers: z.string().min(3),

  objectives: z.string().min(10),
  coment: z.string().min(10),
  deliverables: z.string().min(10),

  compliance: z
    .array(
      z.object({
        description: z.string().min(3),
        status: z.enum([
          "cumplido",
          "no cumplido",
          "parcialmente cumplido",
        ]),
      })
    )
    .min(1),
  scopeChanges: z.string().optional(),

  approvalName: z.string().min(3),
  approvalPosition: z.string().min(3),
})

type FormValues = z.infer<typeof formSchema>

// -----------------------------------------
// Pasos del formulario
// -----------------------------------------
type FormStep = { id: string; title: string; icon: React.ReactNode }

const formSteps: FormStep[] = [
  { id: "project-info", title: "Info. Proyecto", icon: <Info className="h-4 w-4" /> },
  { id: "team-info", title: "Equipo", icon: <Users className="h-4 w-4" /> },
  { id: "objectives", title: "Entregables", icon: <Target className="h-4 w-4" /> },
  { id: "approvals", title: "Aprobaciones", icon: <CheckSquare className="h-4 w-4" /> },
  { id: "review", title: "Revisión", icon: <FileText className="h-4 w-4" /> },
]

// -----------------------------------------
// Componente Principal
// -----------------------------------------
function ProjectClosureForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectCode: "",
      startDate: undefined,
      endDate: undefined,
      projectType: "",
      projectManager: "",
      teamMembers: "",
      objectives: "",
      coment: "",
      deliverables: "",
      compliance: [{ description: "", status: "cumplido" }],
      scopeChanges: "",
      approvalName: "",
      approvalPosition: "",
    },
    mode: "onChange",
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  // subscribe to dates so UI re-renders immediately
  const startDate = watch("startDate")
  const endDate   = watch("endDate")

  const { fields, append, remove } = useFieldArray({
    control,
    name: "compliance",
  })

  const nextStep = useCallback(() => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentStep])

  const generatePDF = useCallback(async () => {
    if (!pdfContentRef.current) return
    setIsGeneratingPdf(true)
    toast({ title: "Generando PDF", description: "Espere..." })
    try {
      const canvas = await html2canvas(pdfContentRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ unit: "mm", format: "a4" })
      const w = pdf.internal.pageSize.getWidth() - 20
      const h = (canvas.height * w) / canvas.width
      pdf.addImage(imgData, "PNG", 10, 10, w, h)
      pdf.setFontSize(10)
      pdf.text("Documento Confidencial", pdf.internal.pageSize.getWidth() / 2, 290, {
        align: "center",
      })
      pdf.save(`Cierre_${form.getValues("projectName")}.pdf`)
    } catch {
      toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" })
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [toast, form])

  const onSubmit = useCallback(() => {
    setIsSubmitted(true)
    toast({ title: "Enviado", variant: "success" })
  }, [toast])

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      // --- Step 0: Proyecto ---
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Código del Proyecto</Label>
                <Input {...register("projectCode")} />
                {errors.projectCode && <p className="text-red-500">{errors.projectCode.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      <CalendarIcon className="inline mr-2" />
                      {startDate
                        ? format(startDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => setValue("startDate", d!, { shouldValidate: true })}
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && <p className="text-red-500">{errors.startDate.message}</p>}
              </div>
              <div>
                <Label>Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      <CalendarIcon className="inline mr-2" />
                      {endDate
                        ? format(endDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => setValue("endDate", d!, { shouldValidate: true })}
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>
            <div>
              <Label>Tipo de Proyecto</Label>
              <Select {...register("projectType")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Desarrollo",
                    "Implementación",
                    "Consultoría",
                    "Infraestructura",
                    "Investigación",
                    "Otro",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectType && <p className="text-red-500">{errors.projectType.message}</p>}
            </div>
          </div>
        )

      // --- Step 1: Equipo ---
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Patrocinador</Label>
              <Input {...register("projectManager")} />
              {errors.projectManager && <p className="text-red-500">{errors.projectManager.message}</p>}
            </div>
            <div>
              <Label>Implementador</Label>
              <Textarea {...register("teamMembers")} className="min-h-[120px]" />
              {errors.teamMembers && <p className="text-red-500">{errors.teamMembers.message}</p>}
            </div>
          </div>
        )

      // --- Step 2: Entregables ---
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Comentarios</Label>
              <Textarea {...register("coment")} className="min-h-[120px]" />
              {errors.coment && <p className="text-red-500">{errors.coment.message}</p>}
            </div>
            <div>
              <Label>Entregables</Label>
              <Textarea {...register("deliverables")} className="min-h-[120px]" />
              {errors.deliverables && <p className="text-red-500">{errors.deliverables.message}</p>}
            </div>
            <div>
              <Label>Cumplimiento de Objetivos</Label>
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-center">
                  <Input
                    {...register(`compliance.${i}.description` as const)}
                    placeholder="Descripción"
                  />
                  <Select
                    value={watch(`compliance.${i}.status` as const)}
                    onValueChange={(val) =>
                      setValue(`compliance.${i}.status`, val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cumplido">✔ Cumplido</SelectItem>
                      <SelectItem value="no cumplido">✘ No cumplido</SelectItem>
                      <SelectItem value="parcialmente cumplido">⚠ Parcialmente cumplido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => remove(i)}>
                    Eliminar
                  </Button>
                </div>
              ))}
              <Button onClick={() => append({ description: "", status: "cumplido" })}>
                + Agregar objetivo
              </Button>
            </div>
            <div>
              <Label>Cambios de Alcance</Label>
              <Textarea {...register("scopeChanges")} placeholder="Describe aquí..." />
            </div>
          </div>
        )

      // --- Step 3: Aprobaciones ---
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Aprobador</Label>
              <Input {...register("approvalName")} />
              {errors.approvalName && <p className="text-red-500">{errors.approvalName.message}</p>}
            </div>
            <div>
              <Label>Cargo</Label>
              <Input {...register("approvalPosition")} />
              {errors.approvalPosition && (
                <p className="text-red-500">{errors.approvalPosition.message}</p>
              )}
            </div>
          </div>
        )

      // --- Step 4: Revisión / PDF ---
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Resumen y Descarga</h3>
              <Button onClick={generatePDF} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <FileText />}
                Descargar PDF
              </Button>
            </div>
            <div ref={pdfContentRef} className="space-y-4 bg-white p-6 rounded shadow avoid-break">
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6 avoid-break">
                <div className="flex items-center gap-4">
                  <Image src="/images/logo.png" alt="Logo" width={120} height={40} />
                  <h2 className="text-lg font-bold">ACTA DE CIERRE DE PROYECTO</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {format(new Date(), "PPP", { locale: es })}
                </span>
              </div>

              {/* Proyecto */}
              <div className="border-l-4 border-red-600 bg-slate-50 p-4 avoid-break">
                <h4 className="font-medium mb-2">Información del Proyecto</h4>
                <p><strong>Código:</strong> {watch("projectCode")}</p>
                <p>
                  <strong>Fechas:</strong>{" "}
                  {startDate ? format(startDate, "PPP", { locale: es }) : "--"} –{" "}
                  {endDate   ? format(endDate,   "PPP", { locale: es }) : "--"}
                </p>
                <p><strong>Tipo:</strong> {watch("projectType")}</p>
              </div>

              {/* Equipo */}
              <div className="border-l-4 border-red-600 bg-slate-50 p-4 avoid-break">
                <h4 className="font-medium mb-2">Equipo</h4>
                <p><strong>Gerente del proyecto:</strong> {watch("projectManager")}</p>
                <p><strong>Implementador:</strong> {watch("teamMembers")}</p>
              </div>

              {/* Comentarios & Entregables */}
              <div className="border-l-4 border-red-600 bg-slate-50 p-4 avoid-break">
                <h4 className="font-medium mb-2">Entregables</h4>
                <p><strong>Comentarios:</strong> {watch("coment")}</p>
                <p><strong>Entregables:</strong> {watch("deliverables")}</p>
              </div>

              {/* Cumplimiento */}
              <div className="border-l-4 border-red-600 bg-slate-50 p-4 avoid-break">
                <h4 className="font-medium mb-2">Cumplimiento de Objetivos</h4>
                {watch("compliance").map((c, i) => (
                  <p key={i}>
                    {c.status === "cumplido"
                      ? "✔ Cumplido: "
                      : c.status === "no cumplido"
                      ? "✘ No cumplido: "
                      : "⚠ Parcialmente cumplido: "}
                    {c.description}
                  </p>
                ))}
              </div>

              {/* Cambios de Alcance */}
              <div className="border-l-4 border-red-600 bg-slate-50 p-4 avoid-break">
                <h4 className="font-medium mb-2">Cambios de Alcance</h4>
                <p>{watch("scopeChanges") || "No hubo cambios de alcance."}</p>
              </div>

              {/* Firmas */}
              <div className="mt-8 pt-4 border-t border-dashed border-slate-300 pdf-section">
                <div className="flex justify-between">
                  <div className="w-1/3 border-t border-slate-400 pt-2 text-center">
                    <p className="text-sm font-bold">{watch("approvalName")}</p>
                    <p className="text-xs text-slate-500">{watch("approvalPosition")}</p>
                  </div>
                  <div className="w-1/3 border-t border-slate-400 pt-2 text-center">
                    <p className="text-sm font-bold">{watch("projectManager")}</p>
                    <p className="text-xs text-slate-500">Gerente de Proyecto</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="font-medium text-red-800 mb-2">Confirmación</h3>
              <p className="text-red-700 text-sm">
                Al enviar este formulario, usted confirma que toda la información proporcionada es correcta y que está
                autorizado para cerrar este proyecto.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }, [currentStep, fields, errors, startDate, endDate, generatePDF])

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <CheckCircle2 /> ¡Enviado con Éxito!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={generatePDF} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download />}
            Descargar PDF
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <style>{pageBreakStyles}</style>
      <div className="flex justify-between items-center">
        <Image src="/images/logo.png" alt="Logo" width={180} height={60} />
        <h2 className="text-xl font-semibold">Acta de Cierre de Proyecto</h2>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <Tabs
          value={`step-${currentStep}`}
          onValueChange={(v) => setCurrentStep(Number(v.split("-")[1]))}
        >
          <TabsList className="flex flex-wrap gap-2">
            {formSteps.map((s, i) => (
              <TabsTrigger key={s.id} value={`step-${i}`}>
                {s.icon} {!isMobile && s.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Progress value={((currentStep + 1) / formSteps.length) * 100} className="mt-2" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{formSteps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft /> Anterior
              </Button>
            )}
            {currentStep < formSteps.length - 1 ? (
              <Button onClick={nextStep}>
                Siguiente <ChevronRight />
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ProjectClosureForm), {
  ssr: false,
})
