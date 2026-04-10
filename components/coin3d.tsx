"use client"

import React, { useState, useRef, useEffect } from "react"

export function Coin3D() {
    const [rotationY, setRotationY] = useState(0)
    const isDragging = useRef(false)
    const lastX = useRef(0)
    const velocity = useRef(0)
    const frameRef = useRef<number>(0)
    const THICKNESS = 15;

    // Smooth deceleration animation loop
    const updatePhysics = () => {
        if (!isDragging.current) {
            if (Math.abs(velocity.current) > 0.05) {
                setRotationY((prev) => prev + velocity.current)
                velocity.current *= 0.95 // Friction
            } else {
                // Return to flat if slow enough, or just let it stop
                // velocity.current = 0
            }
        }
        frameRef.current = requestAnimationFrame(updatePhysics)
    }

    useEffect(() => {
        frameRef.current = requestAnimationFrame(updatePhysics)
        return () => cancelAnimationFrame(frameRef.current)
    }, [])

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true
        lastX.current = e.clientX
        velocity.current = 0
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return
        const deltaX = e.clientX - lastX.current
        setRotationY((prev) => prev + deltaX * 0.8) // Adjust sensitivity
        velocity.current = deltaX * 0.8
        lastX.current = e.clientX
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false
            ; (e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 my-8">
            <div
                className="relative w-32 h-32 cursor-grab active:cursor-grabbing touch-none select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ perspective: "800px" }}
            >
                <div
                    className="w-full h-full relative origin-center"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(0deg) rotateY(${rotationY}deg)`
                    }}
                >
                    {/* Edge layers to give thickness */}
                    {Array.from({ length: THICKNESS }).map((_, i) => {
                        const offset = i - Math.floor(THICKNESS / 2);
                        return (
                            <div
                                key={`edge-${i}`}
                                className="absolute inset-0 rounded-full border border-yellow-500 bg-yellow-400"
                                style={{
                                    transform: `translateZ(${offset}px)`,
                                    transformStyle: "preserve-3d",
                                }}
                            />
                        );
                    })}

                    {/* Front face */}
                    <div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[inset_0_0_15px_rgba(161,98,7,0.5)] border-2 border-yellow-500"
                        style={{
                            transform: `translateZ(${Math.floor(THICKNESS / 2) + 1}px)`,
                            backfaceVisibility: "hidden"
                        }}
                    >
                        <div className="w-[85%] h-[85%] rounded-full border-[2px] border-yellow-500 flex items-center justify-center opacity-80 backdrop-blur-sm shadow-inner">
                            <span className="text-yellow-700 text-5xl font-extrabold font-serif" style={{ textShadow: "1px 1px 0px rgba(255,255,255,0.5)" }}>$</span>
                        </div>
                    </div>

                    {/* Back face */}
                    <div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[inset_0_0_15px_rgba(161,98,7,0.5)] border-2 border-yellow-500"
                        style={{
                            transform: `translateZ(${-(Math.floor(THICKNESS / 2) + 1)}px) rotateY(180deg)`,
                            backfaceVisibility: "hidden"
                        }}
                    >
                        <div className="w-[85%] h-[85%] rounded-full border-[2px] border-yellow-500 flex items-center justify-center opacity-80 backdrop-blur-sm shadow-inner">
                            <span className="text-yellow-700 text-5xl font-extrabold font-serif" style={{ textShadow: "1px 1px 0px rgba(255,255,255,0.5)" }}>$</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
