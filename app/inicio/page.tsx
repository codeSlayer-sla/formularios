"use client"
import GoHomeButton from "@/components/GoHomeButton"
import ProjectInitiationForm from "@/components/project-initiation-form"

export default function InicioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <ProjectInitiationForm />
      </div>
      <GoHomeButton />
      
    </main>
  )
}
