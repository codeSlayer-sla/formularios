"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
  Building,
  Target,
  Lightbulb,
  CheckSquare,
  Info,
} from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"
import dynamic from "next/dynamic"
import emailjs from "@emailjs/browser"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useMobile } from "@/hooks/use-mobile"

// Estilos para controlar los saltos de página en el PDF
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

// Esquema de validación
const formSchema = z.object({
  // Información del Proyecto
  projectName: z.string().min(3, { message: "El nombre del proyecto es requerido" }),
  projectCode: z.string().min(2, { message: "El código del proyecto es requerido" }),
  startDate: z.date({ required_error: "La fecha de inicio es requerida" }),
  endDate: z.date({ required_error: "La fecha de fin es requerida" }),
  projectType: z.string({ required_error: "El tipo de proyecto es requerido" }),

  // Información del Cliente
  clientName: z.string().min(3, { message: "El nombre del cliente es requerido" }),
  clientContact: z.string().min(3, { message: "El contacto del cliente es requerido" }),
  clientEmail: z.string().email({ message: "Email inválido" }),
  clientPhone: z.string().min(8, { message: "Teléfono inválido" }),

  // Equipo del Proyecto
  projectManager: z.string().min(3, { message: "El gerente de proyecto es requerido" }),
  teamMembers: z.string().min(3, { message: "Los miembros del equipo son requeridos" }),

  // Objetivos y Alcance
  objectives: z.string().min(10, { message: "Los objetivos son requeridos" }),
  scope: z.string().min(10, { message: "El alcance es requerido" }),
  deliverables: z.string().min(10, { message: "Los entregables son requeridos" }),

  // Solución (opcional, solo para implementación)
  solution: z.string().optional(),

  // Aprobaciones
  approvalName: z.string().min(3, { message: "El nombre del aprobador es requerido" }),
  approvalPosition: z.string().min(3, { message: "El cargo del aprobador es requerido" }),
})

type FormValues = z.infer<typeof formSchema>

// Pasos del formulario
const formSteps = [
  { id: "project-info", title: "Información del Proyecto", icon: <Info className="h-4 w-4" /> },
  { id: "client-info", title: "Información del Cliente", icon: <Building className="h-4 w-4" /> },
  { id: "team-info", title: "Equipo del Proyecto", icon: <Users className="h-4 w-4" /> },
  { id: "objectives", title: "Objetivos y Alcance", icon: <Target className="h-4 w-4" /> },
  { id: "solution", title: "Solución", icon: <Lightbulb className="h-4 w-4" /> },
  { id: "approvals", title: "Aprobaciones", icon: <CheckSquare className="h-4 w-4" /> },
  { id: "review", title: "Revisión y Envío", icon: <FileText className="h-4 w-4" /> },
]

// Información de las soluciones
const solutionInfo = {
  myq: {
    name: "MyQ",
    description:
      "Solución de gestión de impresión que proporciona control, seguridad y eficiencia en el entorno de impresión.",
    color: "bg-red-600",
    features: ["Control de impresión", "Autenticación segura", "Reportes detallados", "Reducción de costos"],
  },
  docuware: {
    name: "Docuware",
    description:
      "Plataforma de gestión documental y flujos de trabajo que permite digitalizar, automatizar y optimizar procesos documentales.",
    color: "bg-blue-600",
    features: ["Gestión documental", "Flujos de trabajo", "Automatización", "Integración con sistemas existentes"],
  },
  papercut: {
    name: "Papercut",
    description:
      "Sistema de administración de impresión que ayuda a controlar y reducir costos mientras protege la información confidencial.",
    color: "bg-green-600",
    features: ["Impresión móvil", "Políticas de impresión", "Contabilidad detallada", "Seguridad de documentos"],
  },
  softexpert: {
    name: "Softexpert",
    description:
      "Suite integrada para la gestión de procesos, documentos, riesgos, cumplimiento normativo y excelencia empresarial.",
    color: "bg-purple-600",
    features: ["Gestión de procesos", "Gestión de riesgos", "Cumplimiento normativo", "Mejora continua"],
  },
  desarrollo: {
    name: "Desarrollo",
    description:
      "Desarrollo de software a medida para satisfacer las necesidades específicas del cliente con soluciones personalizadas.",
    color: "bg-amber-600",
    features: ["Personalización completa", "Integración con sistemas existentes", "Escalabilidad", "Soporte continuo"],
  },
  auraquantic: {
    name: "Auraquantic",
    description:
      "Plataforma de automatización de procesos de negocio (BPM) que permite digitalizar y optimizar operaciones empresariales.",
    color: "bg-teal-600",
    features: [
      "Automatización de procesos",
      "Formularios digitales",
      "Análisis de datos",
      "Integración con sistemas existentes",
    ],
  },
  personalizada: {
    name: "Solución Personalizada",
    description: "",
    color: "bg-slate-600",
    features: [],
  },
}

// Create a client-side only wrapper component
const ClientOnlyForm = dynamic(() => Promise.resolve(ProjectInitiationForm), {
  ssr: false,
})

// Export the client-only version
export default function ProjectInitiationFormWrapper() {
  return <ClientOnlyForm />
}

// Make the original component the default export
function ProjectInitiationForm() {
  // Todos los hooks deben ser llamados antes de cualquier retorno condicional
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [progress, setProgress] = useState(0)
  const [forceUpdate, setForceUpdate] = useState(0) // Estado para forzar actualización
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile() // Hook para detectar dispositivos móviles
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      projectCode: "",
      projectType: "",
      clientName: "",
      clientContact: "",
      clientEmail: "",
      clientPhone: "",
      projectManager: "",
      teamMembers: "",
      objectives: "",
      scope: "",
      deliverables: "",
      solution: "",
      approvalName: "",
      approvalPosition: "",
    },
    mode: "onChange",
  })

  const { formState, watch } = form
  const { errors, dirtyFields } = formState

  // Observar cambios en la solución seleccionada
  const selectedSolutionValue = watch("solution")
  const [customSolutionDescription, setCustomSolutionDescription] = useState("")

  // Memoizar la solución seleccionada para evitar cálculos innecesarios
  const selectedSolution = useMemo(() => {
    if (!selectedSolutionValue) return null
    const solution = solutionInfo[selectedSolutionValue as keyof typeof solutionInfo]
    if (selectedSolutionValue === "personalizada") {
      return {
        ...solution,
        description: customSolutionDescription,
        features: ["Solución personalizada según requerimientos específicos"],
      }
    }
    return solution
  }, [selectedSolutionValue, customSolutionDescription])

  // Observar cambios en el tipo de proyecto
  const projectType = watch("projectType")

  // Filtrar los pasos basados en el tipo de proyecto
  const filteredSteps = useMemo(() => {
    return formSteps.filter(step => !step.condition || step.condition(projectType))
  }, [projectType])

  // Calcular el índice del paso actual en los pasos filtrados
  const currentFilteredStepIndex = useMemo(() => {
    return filteredSteps.findIndex(step => step.id === formSteps[currentStep].id)
  }, [currentStep, filteredSteps])

  // Ajustar el paso actual cuando se filtra la sección de solución
  useEffect(() => {
    if (currentFilteredStepIndex === -1) {
      // Si el paso actual no está en los pasos filtrados, ajustar al paso anterior
      setCurrentStep(prev => Math.max(0, prev - 1))
    }
  }, [currentFilteredStepIndex])

  // Observar cambios en los valores del formulario
  const formValues = watch()

  // Calcular el progreso del formulario de manera optimizada
  useEffect(() => {
    const calculateProgress = () => {
      const totalFields = Object.keys(formSchema.shape).length
      let completedFields = 0

      // Verificar cada campo individualmente
      if (formValues.projectName) completedFields++
      if (formValues.projectCode) completedFields++
      if (formValues.startDate) completedFields++
      if (formValues.endDate) completedFields++
      if (formValues.projectType) completedFields++
      if (formValues.clientName) completedFields++
      if (formValues.clientContact) completedFields++
      if (formValues.clientEmail) completedFields++
      if (formValues.clientPhone) completedFields++
      if (formValues.projectManager) completedFields++
      if (formValues.teamMembers) completedFields++
      if (formValues.objectives) completedFields++
      if (formValues.scope) completedFields++
      if (formValues.deliverables) completedFields++
      if (formValues.solution) completedFields++
      if (formValues.approvalName) completedFields++
      if (formValues.approvalPosition) completedFields++

      return (completedFields / totalFields) * 100
    }

    const progressValue = calculateProgress()
    requestAnimationFrame(() => {
      setProgress(progressValue)
    })
  }, [formValues])

  // Observar cambios en los valores del formulario para actualizar la UI
  useEffect(() => {
    const subscription = form.watch(() => {
      // Forzar actualización de la UI cuando cambian los valores
      setForceUpdate((prev) => prev + 1)
    })

    return () => subscription.unsubscribe()
  }, [form])

  // Optimizar funciones con useCallback
  const nextStep = useCallback(() => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentStep])

  // Función para generar y descargar el PDF
  const generatePDF = useCallback(async () => {
    if (!pdfContentRef.current) return

    setIsGeneratingPdf(true)
    toast({
      title: "Generando PDF",
      description: "Por favor espere mientras se genera el documento...",
    })

    try {
      const content = pdfContentRef.current
      const canvas = await html2canvas(content, {
        scale: 2,
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

      pdf.save(`Acta_Inicio_${form.getValues("projectName").replace(/\s+/g, "_")}.pdf`)

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
      setIsGeneratingPdf(false)
    }
  }, [toast, form])

  // Función para generar el PDF como base64 (usada para el correo)
  const generatePDFBase64 = useCallback(async () => {
    if (!pdfContentRef.current) return null

    const content = pdfContentRef.current
    const canvas = await html2canvas(content, {
      scale: 1.5, // Reducir la escala para comprimir
      useCORS: true,
      logging: false,
      windowWidth: content.scrollWidth,
      windowHeight: content.scrollHeight,
      imageTimeout: 0,
      allowTaint: true,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.7) // Usar JPEG con calidad reducida
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true // Habilitar compresión
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
      "JPEG", // Cambiar a JPEG
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

    return pdf.output("datauristring")
  }, [])

  // Función para verificar si todos los campos requeridos están llenos
  const isFormComplete = useCallback(() => {
    const values = form.getValues()
    return (
      values.projectName &&
      values.projectCode &&
      values.startDate &&
      values.endDate &&
      values.projectType &&
      values.clientName &&
      values.clientContact &&
      values.clientEmail &&
      values.clientPhone &&
      values.projectManager &&
      values.teamMembers &&
      values.objectives &&
      values.scope &&
      values.deliverables &&
      values.solution &&
      values.approvalName &&
      values.approvalPosition
    )
  }, [form])

  // Modificar la función onSubmit para incluir el envío de correo
  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!isFormComplete()) {
        toast({
          title: "Campos incompletos",
          description: "Por favor complete todos los campos requeridos antes de enviar.",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)
      console.log("Iniciando proceso de envío...")

      try {
        // Generar el PDF como base64
        console.log("Generando PDF...")
        const pdfBase64 = await generatePDFBase64()
        if (!pdfBase64) {
          throw new Error("Error al generar el PDF")
        }
        console.log("PDF generado correctamente")

        // Enviar el correo
        console.log("Enviando correo...")
        setIsSendingEmail(true)

        // Preparar los datos del correo
        const emailData = {
          to_email: data.clientEmail,
          to_name: data.clientName,
          from_name: "Omicron Corp",
          message: `Se adjunta el acta de inicio del proyecto ${data.projectName}`,
          pdf_attachment: pdfBase64,
          cc_email: "aplicaciones3@omicroncorp.com",
          project_name: data.projectName,
          project_code: data.projectCode,
          start_date: format(data.startDate, "PPP", { locale: es }),
          end_date: format(data.endDate, "PPP", { locale: es }),
          project_type: data.projectType,
          client_name: data.clientName,
          client_contact: data.clientContact,
          client_email: data.clientEmail,
          client_phone: data.clientPhone,
          project_manager: data.projectManager,
          team_members: data.teamMembers,
          objectives: data.objectives,
          scope: data.scope,
          deliverables: data.deliverables,
          solution: data.solution,
          approval_name: data.approvalName,
          approval_position: data.approvalPosition
        }

        console.log("Enviando datos al servidor...")
        // Enviar el correo usando el endpoint
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || "Error al enviar el correo")
        }

        console.log("Correo enviado correctamente:", responseData)

        setIsSubmitted(true)
        toast({
          title: "Acta de Inicio enviada",
          description: "El documento ha sido enviado correctamente por correo electrónico.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error detallado:", error)
        toast({
          title: "Error al enviar",
          description: error instanceof Error ? error.message : "Ha ocurrido un error al enviar el formulario. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
        setIsSendingEmail(false)
      }
    },
    [toast, generatePDFBase64, isFormComplete],
  )

  // Resetear el formulario (optimizado)
  const resetForm = useCallback(() => {
    setIsSubmitted(false)
    setCurrentStep(0)
    form.reset()
    setForceUpdate(0)
  }, [form])

  // Memoizar el contenido de los pasos para evitar re-renderizados innecesarios
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 0: // Información del Proyecto
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="flex items-center gap-1">
                  Nombre del Proyecto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  {...form.register("projectName")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.projectName ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: Implementación de sistema de gestión documental"
                />
                {errors.projectName && <p className="text-sm text-red-500">{errors.projectName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectCode" className="flex items-center gap-1">
                  Código del Proyecto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectCode"
                  {...form.register("projectCode")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.projectCode ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: PRJ-2023-001"
                />
                {errors.projectCode && <p className="text-sm text-red-500">{errors.projectCode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-1">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all duration-300",
                        !form.getValues("startDate") && "text-muted-foreground",
                        errors.startDate ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.getValues("startDate") ? (
                        format(form.getValues("startDate"), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.getValues("startDate")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("startDate", date, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                          setForceUpdate((prev) => prev + 1)
                        }
                      }}
                      initialFocus
                      className="border rounded-md"
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-1">
                  Fecha de Finalización estimada <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal transition-all duration-300",
                        !form.getValues("endDate") && "text-muted-foreground",
                        errors.endDate ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.getValues("endDate") ? (
                        format(form.getValues("endDate"), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.getValues("endDate")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("endDate", date, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                          setForceUpdate((prev) => prev + 1)
                        }
                      }}
                      initialFocus
                      className="border rounded-md"
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType" className="flex items-center gap-1">
                Tipo de Proyecto <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => form.setValue("projectType", value)}
                defaultValue={form.getValues("projectType")}
              >
                <SelectTrigger
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.projectType ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                >
                  <SelectValue placeholder="Seleccionar tipo de proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desarrollo">Desarrollo de Software</SelectItem>
                  <SelectItem value="implementacion">Implementación</SelectItem>
                  <SelectItem value="consultoria">Consultoría</SelectItem>
                  <SelectItem value="infraestructura">Infraestructura</SelectItem>
                  <SelectItem value="investigacion">Investigación</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.projectType && <p className="text-sm text-red-500">{errors.projectType.message}</p>}
            </div>
          </div>
        )

      case 1: // Información del Cliente
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-1">
                Nombre del Cliente/Organización <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                className={cn(
                  "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.clientName ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
                placeholder="Ej: Empresa ABC S.A."
              />
              {errors.clientName && <p className="text-sm text-red-500">{errors.clientName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientContact" className="flex items-center gap-1">
                Persona de Contacto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientContact"
                {...form.register("clientContact")}
                className={cn(
                  "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.clientContact ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
                placeholder="Ej: Juan Pérez"
              />
              {errors.clientContact && <p className="text-sm text-red-500">{errors.clientContact.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="flex items-center gap-1">
                  Email de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  {...form.register("clientEmail")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.clientEmail ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: juan.perez@empresa.com"
                />
                {errors.clientEmail && <p className="text-sm text-red-500">{errors.clientEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="flex items-center gap-1">
                  Teléfono de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientPhone"
                  {...form.register("clientPhone")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.clientPhone ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: +507 123-4567"
                />
                {errors.clientPhone && <p className="text-sm text-red-500">{errors.clientPhone.message}</p>}
              </div>
            </div>
          </div>
        )

      case 2: // Equipo del Proyecto
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectManager" className="flex items-center gap-1">
                Gerente de Proyecto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectManager"
                {...form.register("projectManager")}
                className={cn(
                  "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.projectManager ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
                placeholder="Ej: María González"
              />
              {errors.projectManager && <p className="text-sm text-red-500">{errors.projectManager.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamMembers" className="flex items-center gap-1">
                Miembros del Equipo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="teamMembers"
                {...form.register("teamMembers")}
                placeholder="Ingrese los nombres y roles de los miembros del equipo, uno por línea"
                className={cn(
                  "min-h-[120px] transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.teamMembers ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
              />
              {errors.teamMembers && <p className="text-sm text-red-500">{errors.teamMembers.message}</p>}
              <p className="text-xs text-slate-500">Ejemplo: Juan Pérez - Desarrollador Frontend</p>
            </div>
          </div>
        )

      case 3: // Objetivos y Alcance
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objectives" className="flex items-center gap-1">
                Objetivos del Proyecto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="objectives"
                {...form.register("objectives")}
                placeholder="Describa los objetivos principales del proyecto"
                className={cn(
                  "min-h-[120px] transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.objectives ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
              />
              {errors.objectives && <p className="text-sm text-red-500">{errors.objectives.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope" className="flex items-center gap-1">
                Alcance del Proyecto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="scope"
                {...form.register("scope")}
                placeholder="Defina claramente qué está incluido y qué no está incluido en el proyecto"
                className={cn(
                  "min-h-[120px] transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.scope ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
              />
              {errors.scope && <p className="text-sm text-red-500">{errors.scope.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables" className="flex items-center gap-1">
                Entregables <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deliverables"
                {...form.register("deliverables")}
                placeholder="Liste los productos o servicios que se entregarán como parte del proyecto"
                className={cn(
                  "min-h-[120px] transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                  errors.deliverables ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                )}
              />
              {errors.deliverables && <p className="text-sm text-red-500">{errors.deliverables.message}</p>}
            </div>
          </div>
        )

      case 4: // Solución
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solution" className="flex items-center gap-1">
                Solución a Implementar <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => {
                  form.setValue("solution", value)
                  setForceUpdate((prev) => prev + 1)
                }}
                defaultValue={form.getValues("solution")}
              >
                <SelectTrigger
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.solution ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                >
                  <SelectValue placeholder="Seleccionar solución" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="myq">MyQ</SelectItem>
                  <SelectItem value="docuware">Docuware</SelectItem>
                  <SelectItem value="papercut">Papercut</SelectItem>
                  <SelectItem value="softexpert">Softexpert</SelectItem>
                  <SelectItem value="desarrollo">Desarrollo</SelectItem>
                  <SelectItem value="auraquantic">Auraquantic</SelectItem>
                  <SelectItem value="personalizada">Solución Personalizada</SelectItem>
                </SelectContent>
              </Select>
              {errors.solution && <p className="text-sm text-red-500">{errors.solution.message}</p>}

              {selectedSolutionValue === "personalizada" && (
                <div className="mt-4">
                  <Label htmlFor="customSolutionDescription" className="flex items-center gap-1">
                    Descripción de la Solución Personalizada <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="customSolutionDescription"
                    value={customSolutionDescription}
                    onChange={(e) => setCustomSolutionDescription(e.target.value)}
                    placeholder="Describa la solución personalizada que se implementará"
                    className="min-h-[120px] mt-2"
                  />
                </div>
              )}

              {selectedSolution && (
                <div className="mt-6 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <div className={cn("p-4 text-white", selectedSolution.color)}>
                    <h3 className="font-medium text-lg">{selectedSolution.name}</h3>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-slate-700 mb-4">{selectedSolution.description}</p>

                    <h4 className="font-medium text-slate-800 mb-2">Características principales:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedSolution.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700">
                            {feature}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 5: // Aprobaciones
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="approvalName" className="flex items-center gap-1">
                  Nombre del Aprobador <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="approvalName"
                  {...form.register("approvalName")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.approvalName ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: Carlos Rodríguez"
                />
                {errors.approvalName && <p className="text-sm text-red-500">{errors.approvalName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalPosition" className="flex items-center gap-1">
                  Cargo/Posición <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="approvalPosition"
                  {...form.register("approvalPosition")}
                  className={cn(
                    "transition-all duration-300 focus:border-red-300 focus:ring-red-200",
                    errors.approvalPosition ? "border-red-300 focus-visible:ring-red-500" : "border-slate-200",
                  )}
                  placeholder="Ej: Director de Tecnología"
                />
                {errors.approvalPosition && <p className="text-sm text-red-500">{errors.approvalPosition.message}</p>}
              </div>
            </div>

            <div className="pt-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-800 mb-2">Nota Importante</h3>
                <p className="text-red-700 text-sm">
                  Al firmar este documento, usted confirma que ha revisado y aprobado el acta de inicio del proyecto.
                  Esta aprobación autoriza el inicio formal del proyecto y el uso de los recursos asignados.
                </p>
              </div>
            </div>
          </div>
        )

      // Modificar la sección de revisión para mejorar el diseño del PDF
      case 6: // Revisión y Envío
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-slate-800">Resumen del Acta de Inicio</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 border-none shadow-sm hover:shadow-md transition-all duration-300"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        generatePDF()
                      }}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Descargar PDF
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generar y descargar el acta en formato PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

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
                  <div className="bg-red-600 text-white px-4 py-2 rounded-md">
                    <h2 className="text-lg font-bold">ACTA DE INICIO DE PROYECTO</h2>
                  </div>
                </div>
                <div className="text-sm text-slate-500">{format(new Date(), "PPP", { locale: es })}</div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">
                    Información del Proyecto
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Nombre:</span>
                      <span className="font-medium">{form.getValues("projectName") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Código:</span>
                      <span className="font-medium">{form.getValues("projectCode") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Fecha de Inicio:</span>
                      <span className="font-medium">
                        {form.getValues("startDate")
                          ? format(form.getValues("startDate"), "PPP", { locale: es })
                          : "No especificado"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Fecha de Finalización:</span>
                      <span className="font-medium">
                        {form.getValues("endDate")
                          ? format(form.getValues("endDate"), "PPP", { locale: es })
                          : "No especificado"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Tipo:</span>
                      <span className="font-medium">
                        {form.getValues("projectType") === "desarrollo" && "Desarrollo de Software"}
                        {form.getValues("projectType") === "implementacion" && "Implementación"}
                        {form.getValues("projectType") === "consultoria" && "Consultoría"}
                        {form.getValues("projectType") === "infraestructura" && "Infraestructura"}
                        {form.getValues("projectType") === "investigacion" && "Investigación"}
                        {form.getValues("projectType") === "otro" && "Otro"}
                        {!form.getValues("projectType") && "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">
                    Información del Cliente
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Cliente:</span>
                      <span className="font-medium">{form.getValues("clientName") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Contacto:</span>
                      <span className="font-medium">{form.getValues("clientContact") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Email:</span>
                      <span className="font-medium">{form.getValues("clientEmail") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Teléfono:</span>
                      <span className="font-medium">{form.getValues("clientPhone") || "No especificado"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">
                    Equipo del Proyecto
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Gerente:</span>
                      <span className="font-medium">{form.getValues("projectManager") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Equipo:</span>
                      <span className="font-medium whitespace-pre-line">
                        {form.getValues("teamMembers") || "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">
                    Objetivos y Alcance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="flex">
                        <span className="text-slate-500 w-[120px]">Objetivos:</span>
                        <span className="font-medium">{form.getValues("objectives") || "No especificado"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex">
                        <span className="text-slate-500 w-[120px]">Alcance:</span>
                        <span className="font-medium">{form.getValues("scope") || "No especificado"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex">
                        <span className="text-slate-500 w-[120px]">Entregables:</span>
                        <span className="font-medium">{form.getValues("deliverables") || "No especificado"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">Solución</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Solución seleccionada:</span>
                      <span className="font-medium">{selectedSolution ? selectedSolution.name : "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Descripción:</span>
                      <span className="font-medium">
                        {selectedSolution ? selectedSolution.description : "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-md p-4 border-l-4 border-red-600 avoid-break pdf-section">
                  <h4 className="text-sm font-medium text-red-700 mb-2 border-b border-slate-200 pb-1">Aprobación</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Aprobador:</span>
                      <span className="font-medium">{form.getValues("approvalName") || "No especificado"}</span>
                    </div>

                    <div className="flex">
                      <span className="text-slate-500 w-[120px]">Cargo:</span>
                      <span className="font-medium">{form.getValues("approvalPosition") || "No especificado"}</span>
                    </div>
                  </div>
                </div>

                {/* Sección de firmas */}
                <div className="mt-8 pt-4 border-t border-dashed border-slate-300 pdf-section">
                  <div className="flex justify-between">
                    <div className="w-1/3 border-t border-slate-400 pt-2 text-center">
                      <p className="text-sm font-bold">{form.getValues("approvalName") || "Nombre del Aprobador"}</p>
                      <p className="text-xs text-slate-500">{form.getValues("approvalPosition") || "Cargo"}</p>
                    </div>
                    <div className="w-1/3 border-t border-slate-400 pt-2 text-center">
                      <p className="text-sm font-bold">{form.getValues("projectManager") || "Gerente de Proyecto"}</p>
                      <p className="text-xs text-slate-500">Gerente de Proyecto</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="font-medium text-red-800 mb-2">Confirmación</h3>
              <p className="text-red-700 text-sm">
                Al enviar este formulario, usted confirma que toda la información proporcionada es correcta y que está
                autorizado para iniciar este proyecto.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }, [currentStep, errors, form, selectedSolution, selectedSolutionValue, customSolutionDescription, isGeneratingPdf, generatePDF])

  // Importante: Manejar el caso de isSubmitted antes de renderizar el formulario principal
  // para evitar problemas con los hooks
  const submittedContent = (
    <Card className="w-full shadow-lg border-red-200 bg-white">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 border-b border-red-200 text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <CheckCircle2 className="h-6 w-6" />
          ¡Acta de Inicio Enviada con Éxito!
        </CardTitle>
        <CardDescription className="text-white/90">
          Su acta de inicio de proyecto ha sido registrada correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-4 text-center">
        <div className="flex justify-center items-center gap-4 mb-6">
          <Image src="/images/logo.png" alt="Omicron Logo" width={150} height={50} className="h-auto" priority />
          <div className="bg-red-600 text-white px-4 py-2 rounded-md">
            <h2 className="text-lg font-bold">ACTA DE INICIO</h2>
          </div>
        </div>
        <p className="text-slate-700 mb-6">
          Hemos enviado una copia del acta a todos los interesados. Puede descargar una copia para sus registros.
        </p>
        <Button
          className="bg-red-600 hover:bg-red-700 flex items-center gap-2 shadow-lg transition-all duration-300 hover:shadow-red-200"
          onClick={generatePDF}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar Acta de Inicio
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <Button
          variant="outline"
          onClick={resetForm}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Crear Nueva Acta
        </Button>
      </CardFooter>
    </Card>
  )

  // Ensure consistent date formatting
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return "No especificado"
    return format(date, "PPP", { locale: es })
  }, [])

  // Renderizar el contenido según el estado
  if (isSubmitted) {
    return submittedContent
  }

  return (
    <div className="space-y-8">
      {/* Header with logo */}
      <div className="flex justify-between items-center">
        <Image src="/images/logo.png" alt="Omicron Logo" width={180} height={60} className="h-auto" priority />
        <div className="text-right">
          <h2 className="text-lg font-semibold text-slate-800">Acta de Inicio de Proyecto</h2>
          <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="w-full bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-slate-700">Progreso del formulario</h2>
          <span className="text-sm text-slate-500">{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-2 bg-slate-200" indicatorClassName="bg-red-600" />

        <div className="mt-4">
          <Tabs
            defaultValue={`step-${currentStep}`}
            value={`step-${currentStep}`}
            className="w-full"
            onValueChange={(value) => {
              const stepIndex = Number.parseInt(value.split("-")[1])
              setCurrentStep(stepIndex)
            }}
          >
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent">
              {filteredSteps.map((step, index) => (
                <TabsTrigger
                  key={step.id}
                  value={`step-${index}`}
                  className={cn(
                    "flex items-center gap-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200 border",
                    index <= currentStep ? "text-slate-700" : "text-slate-400",
                  )}
                >
                  {step.icon}
                  {!isMobile && <span>{step.title}</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="shadow-lg border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center gap-2">
              {formSteps[currentStep].icon}
              <CardTitle>{formSteps[currentStep].title}</CardTitle>
            </div>
            <CardDescription>
              {currentStep === 0 && "Ingrese la información básica del proyecto"}
              {currentStep === 1 && "Datos del cliente o patrocinador del proyecto"}
              {currentStep === 2 && "Defina el equipo que trabajará en el proyecto"}
              {currentStep === 3 && "Establezca los objetivos y el alcance del proyecto"}
              {currentStep === 4 && "Seleccione la solución a implementar"}
              {currentStep === 5 && "Información de las personas que aprueban el proyecto"}
              {currentStep === 6 && "Revise toda la información antes de enviar"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">{renderStepContent()}</CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}

            {currentStep === 0 && <div></div>}

            {currentStep < formSteps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || isGeneratingPdf || isSendingEmail || !isFormComplete()}
                className="bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {isSubmitting || isGeneratingPdf || isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isGeneratingPdf ? "Generando PDF..." : isSendingEmail ? "Enviando correo..." : "Enviando..."}
                  </>
                ) : (
                  "Enviar Acta de Inicio"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
