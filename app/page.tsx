import ProjectInitiationFormWrapper from "@/components/project-initiation-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <ProjectInitiationFormWrapper />
      </div>
    </main>
  )
}
