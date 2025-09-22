"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
    const [token, setToken] = useState<string>("")
    const [submitting, setSubmitting] = useState<boolean>(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/save-simplefin-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ SETUP_TOKEN: token }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to save token')
            }
            toast.success('SimpleFIN connected')
            router.push('/accounts')
        } catch (err: any) {
            toast.error(err?.message || 'Failed to connect SimpleFIN')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-xl border rounded-lg p-6 bg-white dark:bg-neutral-950">
                <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Connect your SimpleFIN account to start importing your accounts and transactions.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="token">Paste SimpleFIN Setup Token</Label>
                        <Input
                            id="token"
                            placeholder="e.g. BASE64_TOKEN_FROM_BRIDGE"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Open the SimpleFIN Bridge, copy the Setup Token, and paste it here.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={!token || submitting}>
                            {submitting ? 'Connecting…' : 'Connect SimpleFIN'}
                        </Button>
                        <Button type="button" variant="secondary" asChild>
                            <a href="https://beta-bridge.simplefin.org/" target="_blank" rel="noreferrer noopener">
                                Open SimpleFIN Bridge
                            </a>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}


