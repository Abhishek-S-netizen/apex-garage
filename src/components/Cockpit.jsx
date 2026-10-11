import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Cockpit({ fleet, activeView, onOpenDossier, onAddCar, themeTokens }) {
    const canvasRef = useRef(null);
    const [scaleFilter, setScaleFilter] = useState('all');
    const [spotlightIdx, setSpotlightIdx] = useState(0);

    // Filtered cars
    const filteredCars = scaleFilter === 'all'
        ? fleet
        : fleet.filter(c => c.scale === scaleFilter);

    const uniqueBrands = new Set(fleet.map(c => c.brand).filter(Boolean));
    const uniqueMakers = new Set(fleet.map(c => c.maker).filter(Boolean));

    // Milestone calculation for capacity
    const calculateMilestoneMax = (count) => {
        if (count <= 20) return 20;
        if (count <= 50) return 50;
        if (count <= 100) return 100;
        return Math.ceil((count + 20) / 50) * 50;
    };

    const maxFleet = calculateMilestoneMax(fleet.length);

    // Physics state for smooth needle interpolation
    const physicsRef = useRef({
        fleetVal: 0,
        brandsVal: 0,
        makersVal: 0,
        maxFleet: 20
    });

    const sweepRef = useRef({
        active: true,
        startTime: 0,
        duration: 3200,
        fromFleet: 0,
        peakFleet: 20,
        targetFleet: filteredCars.length,
        fromBrands: 0,
        peakBrands: 14,
        targetBrands: uniqueBrands.size,
        fromMakers: 0,
        peakMakers: 14,
        targetMakers: uniqueMakers.size
    });

    // Targets reference for continuous, non-restarting 60fps canvas lerping
    const targetsRef = useRef({
        fleet: filteredCars.length,
        brands: uniqueBrands.size,
        makers: uniqueMakers.size,
        maxFleet: maxFleet
    });

    useEffect(() => {
        targetsRef.current = {
            fleet: filteredCars.length,
            brands: uniqueBrands.size,
            makers: uniqueMakers.size,
            maxFleet: maxFleet
        };
    }, [filteredCars.length, uniqueBrands.size, uniqueMakers.size, maxFleet]);

    const themeTokensRef = useRef(themeTokens);
    useEffect(() => {
        themeTokensRef.current = themeTokens;
    }, [themeTokens]);

    // ══════════════════════════════════════════════════════════════════
    // FERRARI FLAT-PLANE CRANK V8 / V12 GUTTURAL GROWL AUDIO ENGINE
    // (Low grunting, threatening, sub-bass manifold bark via Web Audio)
    // ══════════════════════════════════════════════════════════════════
    const playFerrariGrowlAudio = useCallback(() => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const t0 = ctx.currentTime;

            // Saturation Curve for Exhaust Manifold Rasp & Throat Overdrive
            const makeDistortionCurve = (amount = 45) => {
                const n = 44100;
                const curve = new Float32Array(n);
                const deg = Math.PI / 180;
                for (let i = 0; i < n; ++i) {
                    const x = (i * 2) / n - 1;
                    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
                }
                return curve;
            };

            const waveShaper = ctx.createWaveShaper();
            waveShaper.curve = makeDistortionCurve(35);
            waveShaper.oversample = '4x';

            // Master Exhaust Lowpass Resonant Filter (Deep guttural resonance)
            const exhaustFilter = ctx.createBiquadFilter();
            exhaustFilter.type = 'lowpass';
            exhaustFilter.Q.setValueAtTime(3.8, t0);
            exhaustFilter.frequency.setValueAtTime(140, t0);
            exhaustFilter.frequency.exponentialRampToValueAtTime(750, t0 + 1.35); // Opens into savage bark
            exhaustFilter.frequency.exponentialRampToValueAtTime(420, t0 + 2.0);  // Decel closure
            exhaustFilter.frequency.exponentialRampToValueAtTime(160, t0 + 3.0);  // Deep idle resonance

            // Master Volume Gain
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.001, t0);
            masterGain.gain.linearRampToValueAtTime(0.24, t0 + 0.18);
            masterGain.gain.linearRampToValueAtTime(0.28, t0 + 1.35);
            masterGain.gain.linearRampToValueAtTime(0.14, t0 + 2.2);
            masterGain.gain.exponentialRampToValueAtTime(0.001, t0 + 3.2);

            waveShaper.connect(exhaustFilter);
            exhaustFilter.connect(masterGain);
            masterGain.connect(ctx.destination);

            // 1. Initial Low-End Exhaust Punch (38 Hz sub-bass kick)
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.type = 'sine';
            kickOsc.frequency.setValueAtTime(85, t0);
            kickOsc.frequency.exponentialRampToValueAtTime(34, t0 + 0.35);
            kickGain.gain.setValueAtTime(0.25, t0);
            kickGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
            kickOsc.connect(kickGain);
            kickGain.connect(masterGain);
            kickOsc.start(t0);
            kickOsc.stop(t0 + 0.42);

            // 2. Primary Cylinder Bank (Subterranean growl: 34 Hz -> 118 Hz -> 42 Hz)
            const cylOsc1 = ctx.createOscillator();
            cylOsc1.type = 'sawtooth';
            cylOsc1.frequency.setValueAtTime(34, t0);
            cylOsc1.frequency.exponentialRampToValueAtTime(118, t0 + 1.35);
            cylOsc1.frequency.exponentialRampToValueAtTime(82, t0 + 1.95);
            cylOsc1.frequency.exponentialRampToValueAtTime(42, t0 + 3.0);
            cylOsc1.connect(waveShaper);
            cylOsc1.start(t0);
            cylOsc1.stop(t0 + 3.2);

            // 3. Opposed Bank Harmonic (Flat-plane crank vibration: 51 Hz -> 176 Hz -> 63 Hz)
            const cylOsc2 = ctx.createOscillator();
            cylOsc2.type = 'sawtooth';
            cylOsc2.frequency.setValueAtTime(51, t0);
            cylOsc2.frequency.exponentialRampToValueAtTime(176, t0 + 1.35);
            cylOsc2.frequency.exponentialRampToValueAtTime(122, t0 + 1.95);
            cylOsc2.frequency.exponentialRampToValueAtTime(63, t0 + 3.0);
            cylOsc2.connect(waveShaper);
            cylOsc2.start(t0);
            cylOsc2.stop(t0 + 3.2);

            // 4. Low-Frequency Overrun Crackle & Wastegate Burble (t0 + 1.4s to 2.2s)
            const burbleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
            const burbleData = burbleBuffer.getChannelData(0);
            for (let i = 0; i < burbleData.length; i++) {
                const env = Math.exp(-i / (ctx.sampleRate * 0.12));
                burbleData[i] = (Math.random() * 2 - 1) * env * (Math.sin(i * 0.02) > 0 ? 1 : -0.5);
            }
            const burbleNode = ctx.createBufferSource();
            burbleNode.buffer = burbleBuffer;
            const burbleFilter = ctx.createBiquadFilter();
            burbleFilter.type = 'lowpass';
            burbleFilter.frequency.setValueAtTime(480, t0 + 1.4);
            const burbleGain = ctx.createGain();
            burbleGain.gain.setValueAtTime(0.08, t0 + 1.4);
            burbleGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.0);

            burbleNode.connect(burbleFilter);
            burbleFilter.connect(burbleGain);
            burbleGain.connect(masterGain);
            burbleNode.start(t0 + 1.4);

        } catch (e) {
            // Audio policy safe fallback
        }
    }, []);

    // Rev Sweep calibration function (3.2s Supercar Sweet Spot)
    const triggerNeedleSweep = useCallback(() => {
        const p = physicsRef.current;
        const s = sweepRef.current;
        const curTargets = targetsRef.current;
        s.active = true;
        s.startTime = performance.now();

        s.fromFleet = p.fleetVal || 0;
        s.peakFleet = Math.max(curTargets.maxFleet, 20);
        s.targetFleet = curTargets.fleet;

        s.fromBrands = p.brandsVal || 0;
        s.peakBrands = Math.max(curTargets.brands * 2, 14);
        s.targetBrands = curTargets.brands;

        s.fromMakers = p.makersVal || 0;
        s.peakMakers = Math.max(curTargets.makers * 2, 14);
        s.targetMakers = curTargets.makers;

        playFerrariGrowlAudio();
    }, [playFerrariGrowlAudio]);


    // Handle spotlight shuffle
    const handleShuffleSpotlight = (e) => {
        e.stopPropagation();
        if (filteredCars.length <= 1) return;
        let next;
        do {
            next = Math.floor(Math.random() * filteredCars.length);
        } while (next === spotlightIdx && filteredCars.length > 1);
        setSpotlightIdx(next);
    };

    const spotlightCar = filteredCars[spotlightIdx] || filteredCars[0] || null;

    // ══════════════════════════════════════════════════════════════════
    // SUBTLE MATTE CARBON FIBER TWILL TEXTURE (5% TASTEFUL CONTRAST)
    // ══════════════════════════════════════════════════════════════════
    const drawCarbonTwillTexture = (ctx, cx, cy, r) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
        ctx.lineWidth = 0.8;
        const step = 9;

        // Diagonal weave lines
        for (let x = cx - r * 1.4; x <= cx + r * 1.4; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, cy - r);
            ctx.lineTo(x + r, cy + r);
            ctx.stroke();
        }
        for (let x = cx - r * 1.4; x <= cx + r * 1.4; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, cy + r);
            ctx.lineTo(x + r, cy - r);
            ctx.stroke();
        }

        ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════
    // SAPPHIRE CRYSTAL ANTI-REFLECTIVE (AR) OPTICAL COATING SHADER
    // ══════════════════════════════════════════════════════════════════
    const drawSapphireGlassOverlay = (ctx, x, y, r) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();

        // Recessed Chamber Depth Shadow (top rim shadow)
        const depthShadow = ctx.createLinearGradient(x, y - r, x, y - r + 30);
        depthShadow.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        depthShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        depthShadow.addColorStop(1, 'transparent');
        ctx.fillStyle = depthShadow;
        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI * 0.85, Math.PI * 2.15);
        ctx.fill();

        // Polarized Anti-Reflective Crescent Edge Sheen
        const arSheen = ctx.createLinearGradient(x - r * 0.8, y - r, x + r * 0.8, y - r * 0.3);
        arSheen.addColorStop(0, 'rgba(189, 167, 148, 0.25)'); // Champagne highlight
        arSheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
        arSheen.addColorStop(0.65, 'rgba(159, 62, 62, 0.08)');  // Carmine AR tint
        arSheen.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, r - 1.5, Math.PI * 0.95, Math.PI * 2.05);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = arSheen;
        ctx.stroke();

        // Micro Precision Chamfer Ring
        ctx.beginPath();
        ctx.arc(x, y, r - 0.75, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════
    // SKELETONIZED AERO BLADE NEEDLE
    // ══════════════════════════════════════════════════════════════
    const drawAeroBladeNeedle = (ctx, angle, needleLen, accent, accentBright) => {
        ctx.save();
        ctx.rotate(angle);

        // Ambient Dial Face Cast Shadow / Glow (using dial accent)
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(needleLen - 6, -3);
        ctx.lineTo(needleLen, 0);
        ctx.lineTo(needleLen - 6, 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowColor = accentBright;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Outer Titanium Skeleton Frame (Dark gunmetal edge)
        ctx.beginPath();
        ctx.moveTo(6, -3);
        ctx.lineTo(needleLen - 2, -1.2);
        ctx.lineTo(needleLen, 0);
        ctx.lineTo(needleLen - 2, 1.2);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fillStyle = '#262224';
        ctx.shadowBlur = 0;
        ctx.fill();

        // Inner Backlit Optical Acrylic Core (Luminous white blade)
        ctx.beginPath();
        ctx.moveTo(14, -1.5);
        ctx.lineTo(needleLen - 4, -0.6);
        ctx.lineTo(needleLen, 0);
        ctx.lineTo(needleLen - 4, 0.6);
        ctx.lineTo(14, 1.5);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = accentBright;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Needle Counterweight Center Point
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════
    // 60 FPS MAIN RENDER LOOP (HIGH-DPI COMPENSATED)
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (activeView !== 'cockpit') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId;

        const render = () => {
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;

            // If hidden or unmeasured, skip frame without thrashing GPU memory
            if (!displayWidth || !displayHeight) {
                animId = requestAnimationFrame(render);
                return;
            }

            // High-DPI buffer scaling (devicePixelRatio)
            const dpr = window.devicePixelRatio || 1;
            const targetWidth = Math.round(displayWidth * dpr);
            const targetHeight = Math.round(displayHeight * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, displayWidth, displayHeight);

            const p = physicsRef.current;
            const s = sweepRef.current;
            const now = performance.now();

            const curTargets = targetsRef.current;
            const targetFleetVal = curTargets.fleet;
            const targetBrandsVal = curTargets.brands;
            const targetMakersVal = curTargets.makers;

            // Rev sweep interpolation (Frame-1 boot sweep or manual trigger)
            if (s.active) {
                if (s.startTime === 0) {
                    s.startTime = now;
                    s.fromFleet = p.fleetVal || 0;
                    s.peakFleet = Math.max(curTargets.maxFleet, 20);
                    s.targetFleet = curTargets.fleet;
                    s.fromBrands = p.brandsVal || 0;
                    s.peakBrands = Math.max(curTargets.brands * 2, 14);
                    s.targetBrands = curTargets.brands;
                    s.fromMakers = p.makersVal || 0;
                    s.peakMakers = Math.max(curTargets.makers * 2, 14);
                    s.targetMakers = curTargets.makers;
                    playFerrariGrowlAudio();
                }

                const elapsed = now - s.startTime;
                const progress = Math.min(1, elapsed / s.duration);

                if (progress < 1) {
                    if (progress <= 0.48) {
                        const pNorm = progress / 0.48;
                        const factor = pNorm * pNorm * (3 - 2 * pNorm);
                        p.fleetVal = s.fromFleet + (s.peakFleet - s.fromFleet) * factor;
                        p.brandsVal = s.fromBrands + (s.peakBrands - s.fromBrands) * factor;
                        p.makersVal = s.fromMakers + (s.peakMakers - s.fromMakers) * factor;
                    } else if (progress <= 0.62) {
                        const pNorm = (progress - 0.48) / 0.14;
                        const jitter = Math.sin(pNorm * Math.PI * 6) * 0.45;
                        p.fleetVal = s.peakFleet + jitter;
                        p.brandsVal = s.peakBrands + jitter * 0.5;
                        p.makersVal = s.peakMakers + jitter * 0.5;
                    } else if (progress <= 0.86) {
                        const pNorm = (progress - 0.62) / 0.24;
                        const easeOut = 1 - Math.pow(1 - pNorm, 2);
                        p.fleetVal = s.peakFleet - (s.peakFleet - s.targetFleet) * easeOut;
                        p.brandsVal = s.peakBrands - (s.peakBrands - s.targetBrands) * easeOut;
                        p.makersVal = s.peakMakers - (s.peakMakers - s.targetMakers) * easeOut;
                    } else {
                        const pNorm = (progress - 0.86) / 0.14;
                        const bounce = Math.sin(pNorm * Math.PI * 2) * Math.exp(-pNorm * 3) * 0.35;
                        p.fleetVal = s.targetFleet + bounce;
                        p.brandsVal = s.targetBrands + bounce * 0.3;
                        p.makersVal = s.targetMakers + bounce * 0.3;
                    }
                } else {
                    s.active = false;
                    p.fleetVal = s.targetFleet;
                    p.brandsVal = s.targetBrands;
                    p.makersVal = s.targetMakers;
                }
            } else {
                p.fleetVal += (targetFleetVal - p.fleetVal) * 0.08;
                p.brandsVal += (targetBrandsVal - p.brandsVal) * 0.08;
                p.makersVal += (targetMakersVal - p.makersVal) * 0.08;
            }

            p.maxFleet = curTargets.maxFleet;

            const curTokens = themeTokensRef.current;
            const accent = (curTokens && curTokens.canvas && curTokens.canvas.accent) || '#9F3E3E';
            const accentBright = (curTokens && curTokens.canvas && curTokens.canvas.accentBright) || '#C35656';
            const sandAccent = '#BDA794';
            const sandBright = '#E0D2C5';

            // Dial Geometry (Zero overlap, generous clearance, mobile adaptive)
            const isMobile = displayWidth <= 520;
            const centerX = displayWidth * 0.5;
            const centerY = displayHeight * 0.51;
            const mainRadius = isMobile
                ? Math.min(displayWidth * 0.155, 62)
                : Math.min(displayWidth * 0.17, 134);
            const auxRadius = Math.round(mainRadius * (isMobile ? 0.68 : 0.72));

            const spacing = isMobile
                ? (mainRadius + auxRadius + 10)
                : (mainRadius + auxRadius + 28);
            const leftX = centerX - spacing;
            const rightX = centerX + spacing;
            const auxY = isMobile ? centerY + 4 : centerY + 6;

            // 1. Auxiliary Left: Car Makes Dial (Sand Beige rev line & glow)
            drawModernAuxDial(ctx, leftX, auxY, auxRadius, p.brandsVal, 12, 'CAR MAKES', sandAccent, sandBright, s.active);

            // 2. Auxiliary Right: Castings Dial (Sand Beige rev line & glow)
            drawModernAuxDial(ctx, rightX, auxY, auxRadius, p.makersVal, 12, 'CASTINGS', sandAccent, sandBright, s.active);

            // 3. Center Tachometer: Fleet Capacity (Performance Redline)
            drawModernCenterTachometer(ctx, centerX, centerY, mainRadius, p.fleetVal, curTargets.maxFleet, accent, accentBright, s.active);

            ctx.restore();
            animId = requestAnimationFrame(render);
        };

        // ══════════════════════════════════════════════════════════════
        // CENTER HYPERCAR TACHOMETER
        // ══════════════════════════════════════════════════════════════
        const drawModernCenterTachometer = (ctx, cx, cy, r, val, max, accent, accentBright, isRevving) => {
            const startAngle = Math.PI * 0.75;
            const endAngle = Math.PI * 2.25;
            const totalRange = endAngle - startAngle;

            const clampedVal = Math.max(0, Math.min(val, max));
            const activeAngle = startAngle + (clampedVal / max) * totalRange;

            // Step 1: Machined Outer Chamfer Rim (Stepped Titanium Ring)
            ctx.beginPath();
            ctx.arc(cx, cy, r + 11, 0, Math.PI * 2);
            ctx.fillStyle = '#121011';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(189, 167, 148, 0.28)';
            ctx.stroke();

            // Step 2: Sunken Radial Sunburst Obsidian Dial Face + Subtle Carbon Twill Weave
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            const faceGrad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
            faceGrad.addColorStop(0, '#1C191B');
            faceGrad.addColorStop(0.6, '#141213');
            faceGrad.addColorStop(1, '#0C0B0C');
            ctx.fillStyle = faceGrad;
            ctx.fill();

            // Subtle Carbon Fiber Texture (5% tasteful opacity)
            drawCarbonTwillTexture(ctx, cx, cy, r);

            // Step 3: Base Track Hairline (High-precision motorsport guide)
            ctx.beginPath();
            ctx.arc(cx, cy, r - 15, startAngle, endAngle);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Redline Zone Track Hairline (Top 20%)
            const redlineStart = startAngle + totalRange * 0.8;
            ctx.beginPath();
            ctx.arc(cx, cy, r - 15, redlineStart, endAngle);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(211, 47, 47, 0.35)';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Anodized Redline Gate Notch at tick 16 (where redline begins)
            const notchAngle = redlineStart;
            const notchX1 = cx + Math.cos(notchAngle) * (r - 24);
            const notchY1 = cy + Math.sin(notchAngle) * (r - 24);
            const notchX2 = cx + Math.cos(notchAngle) * (r - 11);
            const notchY2 = cy + Math.sin(notchAngle) * (r - 11);
            ctx.beginPath();
            ctx.moveTo(notchX1, notchY1);
            ctx.lineTo(notchX2, notchY2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FF2A2A';
            ctx.shadowColor = '#FF2A2A';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Step 4: Dynamic Laser Arc with Comet Head Pulse
            if (clampedVal > 0) {
                const arcGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
                arcGrad.addColorStop(0, 'rgba(189, 167, 148, 0.9)'); // Champagne Sand
                arcGrad.addColorStop(0.5, accent);
                arcGrad.addColorStop(1, '#FF2A2A');                  // Crimson Redline

                ctx.beginPath();
                ctx.arc(cx, cy, r - 15, startAngle, activeAngle);
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = arcGrad;
                ctx.lineCap = 'round';
                ctx.shadowColor = accentBright;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Comet Head Pulse at Needle Tip
                const cometX = cx + Math.cos(activeAngle) * (r - 15);
                const cometY = cy + Math.sin(activeAngle) * (r - 15);
                ctx.beginPath();
                ctx.arc(cometX, cometY, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Step 5: Clean Milestone Indexing & Micro-Etched Graduation Hairlines
            const milestoneStep = max <= 20 ? 5 : (max <= 50 ? 10 : 25);
            const totalTicks = 40;

            for (let i = 0; i <= totalTicks; i++) {
                const angle = startAngle + (i / totalTicks) * totalRange;
                const tickVal = (i / totalTicks) * max;
                const isMilestone = Math.abs(tickVal % milestoneStep) < 0.1 || i === totalTicks || i === 0;
                const isRedZone = (i / totalTicks) >= 0.8;

                const innerR = isMilestone ? r - 30 : r - 22;
                const outerR = r - 18;

                const x1 = cx + Math.cos(angle) * innerR;
                const y1 = cy + Math.sin(angle) * innerR;
                const x2 = cx + Math.cos(angle) * outerR;
                const y2 = cy + Math.sin(angle) * outerR;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = isMilestone ? 2 : 0.8;
                ctx.strokeStyle = isRedZone
                    ? '#FF3B30'
                    : (isMilestone ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.18)');
                ctx.stroke();

                // Milestone Numerals
                if (isMilestone) {
                    const textR = r - 42;
                    const tx = cx + Math.cos(angle) * textR;
                    const ty = cy + Math.sin(angle) * textR;
                    const milestoneNum = Math.round(tickVal);

                    const isNearby = Math.abs(clampedVal - milestoneNum) <= (milestoneStep * 0.45);

                    ctx.font = isNearby ? '700 11.5px Jura, monospace' : '600 10.5px Jura, monospace';
                    ctx.fillStyle = isRedZone
                        ? '#FF3B30'
                        : (isNearby ? '#FFFFFF' : 'rgba(189, 167, 148, 0.65)');
                    if (isNearby) {
                        ctx.shadowColor = isRedZone ? '#FF3B30' : accentBright;
                        ctx.shadowBlur = 6;
                    }
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(milestoneNum), tx, ty);
                    ctx.shadowBlur = 0;
                }
            }

            // Step 6: Skeletonized Aero Blade Needle
            ctx.save();
            ctx.translate(cx, cy);
            drawAeroBladeNeedle(ctx, activeAngle, r - 20, accent, accentBright);
            ctx.restore();

            // Step 7: Floating Smoked-Glass OLED Hub
            ctx.beginPath();
            ctx.arc(cx, cy, 39, 0, Math.PI * 2);
            ctx.fillStyle = '#141213';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(189, 167, 148, 0.35)';
            ctx.stroke();

            // Inner smoked glass pod
            ctx.beginPath();
            ctx.arc(cx, cy, 36, 0, Math.PI * 2);
            const hubGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 36);
            hubGrad.addColorStop(0, '#1A1718');
            hubGrad.addColorStop(1, '#0E0D0E');
            ctx.fillStyle = hubGrad;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.stroke();

            // ── Minimalist Clean Hub: Keep ONLY "FLEET" and the bold number ──
            ctx.font = '700 9px Jura, monospace';
            ctx.fillStyle = 'rgba(189, 167, 148, 0.85)';
            ctx.textAlign = 'center';
            ctx.fillText('FLEET', cx, cy - 8);

            ctx.font = '700 24px Syncopate, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = accentBright;
            ctx.shadowBlur = 8;
            ctx.fillText(String(Math.round(clampedVal)), cx, cy + 14);
            ctx.shadowBlur = 0;

            // Step 8: Sapphire Crystal Anti-Reflective Coating Sheen
            drawSapphireGlassOverlay(ctx, cx, cy, r);
        };

        // ══════════════════════════════════════════════════════════════
        // AUXILIARY DIALS (MARQUES & MAKERS)
        // ══════════════════════════════════════════════════════════════
        const drawModernAuxDial = (ctx, cx, cy, r, val, max, hubLabel, accent, accentBright, isRevving) => {
            const startAngle = Math.PI * 0.75;
            const endAngle = Math.PI * 2.25;
            const totalRange = endAngle - startAngle;

            const clampedVal = Math.max(0, Math.min(val, max));
            const activeAngle = startAngle + (clampedVal / max) * totalRange;

            // Stepped Outer Bezel
            ctx.beginPath();
            ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = '#121011';
            ctx.fill();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(189, 167, 148, 0.22)';
            ctx.stroke();

            // Dial Face
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            const faceGrad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
            faceGrad.addColorStop(0, '#191617');
            faceGrad.addColorStop(0.7, '#131112');
            faceGrad.addColorStop(1, '#0C0A0B');
            ctx.fillStyle = faceGrad;
            ctx.fill();

            // Carbon twill weave
            drawCarbonTwillTexture(ctx, cx, cy, r);

            // Base Track Guide
            ctx.beginPath();
            ctx.arc(cx, cy, r - 11, startAngle, endAngle);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Active Laser Track
            if (clampedVal > 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, r - 11, startAngle, activeAngle);
                ctx.lineWidth = 2.8;
                ctx.strokeStyle = accent;
                ctx.lineCap = 'round';
                ctx.shadowColor = accentBright;
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Comet Tip
                const cometX = cx + Math.cos(activeAngle) * (r - 11);
                const cometY = cy + Math.sin(activeAngle) * (r - 11);
                ctx.beginPath();
                ctx.arc(cometX, cometY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
            }

            // Fine Micro Ticks
            const numTicks = 16;
            for (let i = 0; i <= numTicks; i++) {
                const angle = startAngle + (i / numTicks) * totalRange;
                const isMajor = i % 4 === 0;

                const innerR = isMajor ? r - 20 : r - 16;
                const outerR = r - 13;

                const x1 = cx + Math.cos(angle) * innerR;
                const y1 = cy + Math.sin(angle) * innerR;
                const x2 = cx + Math.cos(angle) * outerR;
                const y2 = cy + Math.sin(angle) * outerR;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineWidth = isMajor ? 1.5 : 0.8;
                ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)';
                ctx.stroke();
            }

            // Skeletonized Needle
            ctx.save();
            ctx.translate(cx, cy);
            drawAeroBladeNeedle(ctx, activeAngle, r - 15, accent, accentBright);
            ctx.restore();

            // Floating Smoked-Glass OLED Hub (outer bezel)
            ctx.beginPath();
            ctx.arc(cx, cy, 31, 0, Math.PI * 2);
            ctx.fillStyle = '#141213';
            ctx.fill();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(189, 167, 148, 0.28)';
            ctx.stroke();

            // Inner smoked glass pod
            ctx.beginPath();
            ctx.arc(cx, cy, 28, 0, Math.PI * 2);
            const auxHubGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 28);
            auxHubGrad.addColorStop(0, '#1A1718');
            auxHubGrad.addColorStop(1, '#0E0D0E');
            ctx.fillStyle = auxHubGrad;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.stroke();

            // Hub Title: e.g. "CAR MAKES" or "CASTINGS"
            if (hubLabel) {
                ctx.font = '700 7px Jura, monospace';
                ctx.fillStyle = 'rgba(189, 167, 148, 0.85)';
                ctx.textAlign = 'center';
                ctx.fillText(hubLabel, cx, cy - 6);
            }

            // Bold Telemetry Digit
            ctx.font = '700 18px Syncopate, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.shadowColor = accentBright;
            ctx.shadowBlur = 6;
            ctx.fillText(String(Math.round(clampedVal)), cx, cy + (hubLabel ? 12 : 7));
            ctx.shadowBlur = 0;

            // Sapphire AR Coating
            drawSapphireGlassOverlay(ctx, cx, cy, r);
        };

        render();

        return () => {
            cancelAnimationFrame(animId);
        };
    }, [activeView]);

    return (
        <section className={`view-panel ${activeView === 'cockpit' ? 'active' : ''}`} id="viewCockpit">
            <div className="flipped-bento-layout">
                {/* ══════════════════════════════════════════════════════════════
                     LEFT BENTO CARD (~65%): DIGITAL INSTRUMENT BINNACLE
                ══════════════════════════════════════════════════════════════ */}
                <div className="bento-card cockpit-binnacle-card" id="cockpitBinnacleCard">
                    <div className="card-glass-specular" />

                    <div className="bento-header">
                        <div className="bento-title-group">
                            <span className="bento-tag">HYPERCAR OPTICAL CLUSTER</span>
                            <h2 className="bento-heading">Mechanical Digital Instruments</h2>
                        </div>

                        <div className="cluster-controls-group">
                            <button
                                className="btn-rev-cluster"
                                id="btnRevCluster"
                                onClick={triggerNeedleSweep}
                                type="button"
                                title="Calibrate Instrument Needles & Engine Sound"
                            >
                                <span className="rev-icon">↻</span>
                                <span>REV CLUSTER</span>
                            </button>
                        </div>
                    </div>

                    {/* Canvas Housing (Responsive High-DPI Canvas) */}
                    <div className="canvas-gauges-wrapper">
                        <canvas
                            ref={canvasRef}
                            id="clusterCanvas"
                            style={{ width: '100%', height: '380px', display: 'block', cursor: 'pointer' }}
                            onClick={triggerNeedleSweep}
                            title="Click gauges to rev needles with Ferrari engine growl"
                        />
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                     RIGHT BENTO CARD (~35%): PIT WALL COMMAND CARD
                ══════════════════════════════════════════════════════════════ */}
                <div className="bento-card pitwall-card" id="pitwallCommandCard">
                    <div className="card-glass-specular" />

                    <div className="pitwall-section">
                        <div className="section-label-row">
                            <span className="section-micro-label">FILTER FLEET BY SCALE</span>
                        </div>
                        <div className="scale-pills-grid">
                            {[
                                { key: 'all', label: `ALL (${fleet.length})` },
                                { key: '1:18', label: `1:18 (${fleet.filter(c => c.scale === '1:18').length})` },
                                { key: '1:43', label: `1:43 (${fleet.filter(c => c.scale === '1:43').length})` },
                                { key: '1:64', label: `1:64 (${fleet.filter(c => c.scale === '1:64').length})` }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    className={`scale-pill ${scaleFilter === item.key ? 'active' : ''}`}
                                    onClick={() => {
                                        setScaleFilter(item.key);
                                        setSpotlightIdx(0);
                                    }}
                                    type="button"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editorial Vehicle Spotlight */}
                    <div className="pitwall-spotlight-section">
                        <div className="section-label-row">
                            <span className="section-micro-label">EDITORIAL SPOTLIGHT</span>
                        </div>

                        {spotlightCar ? (
                            <div
                                className="editorial-spotlight-card"
                                onClick={() => onOpenDossier(spotlightCar.id)}
                                title="Click to view full vehicle dossier"
                            >
                                <img
                                    className="editorial-photo"
                                    src={spotlightCar.photoUrl || 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop'}
                                    alt={spotlightCar.model}
                                    loading="lazy"
                                />
                                <div className="editorial-vignette" />

                                <button
                                    className="editorial-shuffle-btn"
                                    onClick={handleShuffleSpotlight}
                                    title="Shuffle spotlight vehicle"
                                    type="button"
                                >
                                    <span className="shuffle-icon">↻</span>
                                </button>

                                <div className="editorial-content-overlay">
                                    <div className="editorial-brand-line">
                                        <span>{(spotlightCar.brand || 'ATELIER').toUpperCase()}</span>
                                        <span className="editorial-dot">·</span>
                                        <span className="editorial-scale">{spotlightCar.scale || '1:18'}</span>
                                    </div>
                                    <h4 className="editorial-model">{spotlightCar.model}</h4>
                                </div>
                            </div>
                        ) : (
                            <div className="editorial-spotlight-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No models in selected scale.</span>
                            </div>
                        )}
                    </div>

                    {/* Primary Registration Anchor */}
                    <div className="pitwall-action-bar">
                        <button
                            className="btn-pitwall-primary"
                            id="btnPitwallRegister"
                            onClick={onAddCar}
                            type="button"
                        >
                            <span className="btn-plus-big">+</span>
                            <span>REGISTER NEW VEHICLE</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
