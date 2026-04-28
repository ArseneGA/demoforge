"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Stepper } from "./Stepper"
import { Step1Source } from "./Step1Source"
import { Step2Repo } from "./Step2Repo"
import { Step3Analyse } from "./Step3Analyse"
import { Step4Recap } from "./Step4Recap"

export interface WizardInstallation {
  id: string
  github_install_id: number
  github_account_login: string
}

export interface WizardProject {
  id: string
  repo_full_name: string
  branch: string
  scan_status: string
  framework: string | null
}

interface Props {
  orgId: string
  isOwner: boolean
  installation: WizardInstallation | null
  existingProject: WizardProject | null
  initialStep: number
  error: string | null
}

export function WizardShell({ orgId, isOwner, installation, existingProject, initialStep, error }: Props) {
  const [step, setStep] = useState(initialStep)
  const [selectedRepo, setSelectedRepo] = useState<{
    full_name: string
    branch: string
    package_path?: string
    install_id: string  // UUID de github_installations.id
  } | null>(null)
  const [project, setProject] = useState<WizardProject | null>(existingProject)
  const [jobId, setJobId] = useState<string | null>(null)
  const router = useRouter()

  return (
    <main
      className="flex-1 min-h-0 grid relative"
      style={{ gridTemplateRows: "auto 1fr auto", overflow: "hidden" }}
    >
      <div
        className="pointer-events-none absolute top-[60px] -right-[120px] w-[460px] h-[460px] rounded-full -z-0"
        style={{ filter: "blur(100px)", background: "radial-gradient(circle, var(--brand-dim), transparent 65%)" }}
      />

      <Stepper current={step} />

      {/* Error banner */}
      {error && (
        <div
          className="relative z-10 mx-auto w-full max-w-[880px] px-6 pt-4"
        >
          <div
            className="px-4 py-3 rounded-xl text-[13px]"
            style={{
              background: "color-mix(in oklab, #ef4444 10%, transparent)",
              border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)",
              color: "#f87171",
            }}
          >
            ⚠ {errorMessage(error)}
          </div>
        </div>
      )}

      <div className="overflow-y-auto flex flex-col min-h-0">
        {step === 1 && (
          <Step1Source
            orgId={orgId}
            isOwner={isOwner}
            onNext={() => setStep(2)}
            onCancel={() => router.push("/dashboard")}
          />
        )}
        {step === 2 && (
          <Step2Repo
            orgId={orgId}
            installation={installation}
            onRepoSelected={(repo) => {
              setSelectedRepo(repo)
              setStep(3)
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && selectedRepo && (
          <Step3Analyse
            orgId={orgId}
            repo={selectedRepo}
            onScanComplete={(p, jId) => {
              setProject(p)
              setJobId(jId)
              setStep(4)
            }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && project && (
          <Step4Recap
            project={project}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </main>
  )
}

function errorMessage(code: string): string {
  const messages: Record<string, string> = {
    github_callback_invalid: "Callback GitHub invalide. Réessayez.",
    github_state_invalid: "Erreur de sécurité (state invalide). Réessayez.",
    github_not_owner: "Seul l'owner de l'org peut connecter GitHub.",
    github_install_failed: "Erreur lors de l'installation GitHub App.",
  }
  return messages[code] ?? `Erreur : ${code}`
}
