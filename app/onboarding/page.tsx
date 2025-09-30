"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<number>(1)
    const [loading, setLoading] = useState<boolean>(false)
    const [token, setToken] = useState<string>("")
    const [autoMarkDuplicates, setAutoMarkDuplicates] = useState<boolean>(false)
    const [autoCategorize, setAutoCategorize] = useState<boolean>(false)
    const [classifierTrainingDate, setClassifierTrainingDate] = useState<string | null>(null)

    useEffect(() => {
        // Prime defaults from current config
        const loadConfig = async () => {
            try {
                const res = await fetch('/api/get-user-config', { cache: 'no-store' })
                if (!res.ok) return
                const data = await res.json()
                const cfg = data?.userConfig || {}
                setAutoMarkDuplicates(Boolean(cfg.auto_mark_duplicates))
                setAutoCategorize(Boolean(cfg.auto_categorize))
                setClassifierTrainingDate(cfg.classifier_training_date || null)
            } catch { }
        }
        loadConfig()
    }, [])

    const handleInitialize = () => {
        // Fire-and-forget; move to next step immediately with no UI interruption
        try {
            fetch('/api/initialize-database', { method: 'POST' }).catch(() => { /* silent */ })
        } catch { /* silent */ }
        setStep(2)
    }

    const handleSaveTokenAndRefresh = async () => {
        if (!token) return
        setLoading(true)
        try {
            // Save SimpleFIN token
            const save = await fetch('/api/save-simplefin-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ SETUP_TOKEN: token }),
            })
            const saveData = await save.json()
            if (!save.ok) throw new Error(saveData?.error || 'Failed to save SimpleFIN token')

            // Full refresh like settings-client
            const { refreshAll } = await import("@/app/settings/actions")
            await refreshAll()
            toast.success('Connected and data fetched')
            setStep(3)
        } catch (err: any) {
            toast.error(err?.message || 'Failed during setup')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleAutoMark = async (value: boolean) => {
        setAutoMarkDuplicates(value)
        try {
            const { setAutoMarkInternalTransfers } = await import("@/app/settings/actions")
            await setAutoMarkInternalTransfers(value)
        } catch {
            setAutoMarkDuplicates((v) => !v)
        }
    }

    const handleToggleAutoCategorize = async (value: boolean) => {
        if (!classifierTrainingDate) return
        setAutoCategorize(value)
        try {
            const { setAutoCategorize } = await import("@/app/settings/actions")
            await setAutoCategorize(value)
        } catch {
            setAutoCategorize((v) => !v)
        }
    }

    const handleFinish = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/complete-onboarding', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to complete onboarding')
            router.push('/')
        } catch (err: any) {
            toast.error(err?.message || 'Failed to complete onboarding')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="mt-2 flex items-center gap-2">
                        {[
                            { id: 1, label: 'Welcome' },
                            { id: 2, label: 'Connect' },
                            { id: 3, label: 'Preferences' },
                        ].map((s, idx, arr) => (
                            <div key={s.id} className="flex items-center gap-2 w-full">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${s.id <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                        aria-current={s.id === step ? 'step' : undefined}
                                    >
                                        {s.id}
                                    </div>
                                    <div className={`text-sm font-medium ${s.id === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</div>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className={`h-px flex-1 ${s.id < step ? 'bg-primary' : 'bg-border'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    {step === 1 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold">Welcome to Money App</h2>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Money App connects to your bank and card accounts via the <a className="underline text-primary" href="https://beta-bridge.simplefin.org/" target="_blank" rel="noopener noreferrer">SimpleFIN Bridge</a>.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    SimpleFIN issues you a one-time Setup Token that lets Money App securely claim a read-only access URL. Your credentials are never stored here; only the access URL is saved locally to fetch accounts and transactions.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Tip: Create a SimpleFIN account and add your financial connections first. Then return here to continue.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold">Connect SimpleFIN</h2>
                            <p className="text-sm text-muted-foreground">Paste your Setup Token from the SimpleFIN Bridge. We will save it and fetch all your data.</p>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="token">SimpleFIN Setup Token</Label>
                                <Input id="token" placeholder="BASE64_TOKEN_FROM_BRIDGE" value={token} onChange={(e) => setToken(e.target.value)} />
                                <p className="text-xs text-muted-foreground">Need a token? Get it from the <a className="underline" href="https://beta-bridge.simplefin.org/" target="_blank" rel="noopener noreferrer">SimpleFIN Bridge</a>.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-xl font-semibold">Preferences</h2>
                            <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                                <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                                    <Label>Mark Duplicate Transactions</Label>
                                    <p className="text-xs text-muted-foreground">Automatically mark internal transfers between your own accounts.</p>
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <Switch checked={autoMarkDuplicates} onCheckedChange={handleToggleAutoMark} />
                                </div>
                            </div>
                            <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                                <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                                    <Label>Auto-Classify Transactions</Label>
                                    <p className="text-xs text-muted-foreground">Requires a trained model; you can enable this later in Settings.</p>
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <Switch disabled={!classifierTrainingDate} checked={autoCategorize} onCheckedChange={handleToggleAutoCategorize} />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        disabled={loading || step === 1}
                    >
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            if (step === 1) return handleInitialize()
                            if (step === 2) return handleSaveTokenAndRefresh()
                            return handleFinish()
                        }}
                        disabled={(step === 2 && !token) || loading && step !== 1}
                    >
                        {loading
                            ? (step === 2 ? 'Connecting & Refreshing…' : 'Finishing…')
                            : 'Continue'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}


