"use client"
import GoHomeButton from "@/components/GoHomeButton"
import  ProjectClosureForm  from "@/components/project-closure-form"

export default function CierrePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <ProjectClosureForm />
      </div>
      <GoHomeButton />
    </main>
  )
}
