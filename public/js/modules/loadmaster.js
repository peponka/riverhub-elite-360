/**
 * LOAD MASTER MODULE
 * Módulo de cálculo visual de estiba, estabilidad y trimado.
 * 
 * "Safety First, Efficiency Always"
 */

const LoadMasterModule = {
    // State of the current simulation
    state: {
        cargo: {
            hold1: 0, // Proa (Bow)
            hold2: 0, // Centro (Mid)
            hold3: 0  // Popa (Stern)
        },
        fuel: 50, // %
        ballast: 0, // %
        config: {
            maxCapacityPerHold: 1500, // tons
            length: 60, // meters
            width: 12 // meters
        }
    },

    init: function () {
        console.log("⚓ Load Master Initialized");
        this.recalculate();
        this.setupListeners();
    },

    updateInput: function (field, value) {
        this.state.cargo[field] = parseFloat(value) || 0;
        this.recalculate();
    },

    recalculate: function () {
        // Physics Simulation (Simplified for visual feedback)

        // 1. Total Weight
        const totalCargo = this.state.cargo.hold1 + this.state.cargo.hold2 + this.state.cargo.hold3;
        const totalDeadweight = totalCargo + (this.state.fuel * 0.8) + (this.state.ballast * 1.0); // Simple factors

        // 2. Trim Calculation (Pitch)
        // More weight at Hold 1 (Bow) -> Trim by Bow (Negative Pitch)
        // More weight at Hold 3 (Stern) -> Trim by Stern (Positive Pitch)

        // Moments around center
        const momentBow = this.state.cargo.hold1 * 20; // Distance from center
        const momentStern = this.state.cargo.hold3 * 20;

        const netMoment = momentStern - momentBow;
        // Positive netMoment -> Bow up, Stern down (Trim by Stern - Good)
        // Negative netMoment -> Bow down (Trim by Bow - Bad/Inefficient)

        const trimValue = netMoment / 1000; // Arbitrary scale factor for visuals

        // 3. Draft Calculation (Calado)
        // Base draft empty = 2ft. 
        // 100 tons = +4 inches approx (Mock rule)
        const baseDraftFt = 2.0;
        const addedDraftFt = totalDeadweight / 350; // tons per inch/foot approx
        const currentDraft = baseDraftFt + addedDraftFt;

        // Update UI
        this.updateUI(totalCargo, trimValue, currentDraft);
    },

    updateUI: function (totalLoad, trim, draft) {
        // Update number displays
        document.getElementById('lm-total-load').innerText = totalLoad.toFixed(0) + " TN";
        document.getElementById('lm-draft-calc').innerText = draft.toFixed(2) + " PIES";

        const trimUi = document.getElementById('lm-trim-val');
        if (trim > 0.5) {
            trimUi.innerText = "BY STERN (" + trim.toFixed(1) + "°)";
            trimUi.style.color = "#10b981"; // Good
        } else if (trim < -0.5) {
            trimUi.innerText = "BY BOW (" + Math.abs(trim).toFixed(1) + "°)";
            trimUi.style.color = "#ef4444"; // Bad
        } else {
            trimUi.innerText = "EVEN KEEL";
            trimUi.style.color = "#f59e0b";
        }

        // --- VISUALIZER UPDATES ---

        // 1. Fill Levels
        this.setHoldLevel('v-hold-1', this.state.cargo.hold1);
        this.setHoldLevel('v-hold-2', this.state.cargo.hold2);
        this.setHoldLevel('v-hold-3', this.state.cargo.hold3);

        // 2. Barge Rotation (Visual Trim)
        const barge = document.getElementById('lm-barge-visual');
        if (barge) {
            // CSS Rotate: positive is clockwise. 
            // If trim is negative (Bow Down), we want counter-clockwise (left side down in vertical view?)
            // Wait, vertical view: Top is Bow. 
            // Rotate X axis? No, 2D rotation.
            // Let's fake it with rotation. 
            // Bow (Top) heavier -> Rotate forward? On screen simpler to just rotate Z slightly?
            // Actually, for vertical barge: PITCH is tilt forward/back. Hard to show in 2D top-down.
            // We will rotate it slightly to show "listing" if we had list, but for trim we might just use a bar.

            // Let's implement LIST (Heel) simulation randomly or via hidden slider for now?
            // For now, let's just stick to the STABILITY BAR update.
        }

        // 3. Stability Bar
        const bar = document.getElementById('lm-stability-bar');
        const maxTrim = 10;
        // Map trim (-10 to 10) to Left(0%) - Right(100%). Center is 50%.
        let percent = 50 + (trim * 5);
        percent = Math.max(10, Math.min(90, percent)); // Clamp

        if (bar) {
            bar.style.left = percent + "%";
            // Colorize
            if (percent < 40 || percent > 60) {
                bar.style.background = "#ef4444";
            } else {
                bar.style.background = "#10b981";
            }
        }
    },

    setHoldLevel: function (id, value) {
        const el = document.getElementById(id);
        const fill = el.querySelector('.hold-fill');
        if (fill) {
            const pct = Math.min(100, (value / this.state.config.maxCapacityPerHold) * 100);
            fill.style.height = pct + "%";
        }
    },

    reset: function () {
        this.state.cargo = { hold1: 0, hold2: 0, hold3: 0 };
        document.getElementById('inp-hold-1').value = 0;
        document.getElementById('inp-hold-2').value = 0;
        document.getElementById('inp-hold-3').value = 0;
        this.recalculate();
    },

    // Setup inputs
    setupListeners: function () {
        // No auto-bind here to avoid complex DOM deps, called from HTML onchange
    }
};

// Export to window
window.LoadMasterModule = LoadMasterModule;
