/**
 * The dockable console log viewer: creation, rendering, resize handling,
 * and the window.* handlers invoked from inline onclick="..." strings.
 */

import { config } from "../config";
import { state } from "../state";
import { escapeHTML, updateDebugOverlay } from "./debug-overlay";

export function createConsoleDock(): void {
	if (state.consoleDockEl) return;
	state.consoleDockEnabled = true;

	state.consoleDockEl = document.createElement("div");
	state.consoleDockEl.id = "astro-webvitals-console-dock";
	state.consoleDockEl.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: ${state.consoleDockHeight}px;
    min-height: 120px;
    max-height: 75vh;
    background: rgba(12, 17, 30, 0.98);
    color: #E5E7EB;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    z-index: 9999;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.45);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(6px);
  `;

	const resizeHandle = document.createElement("div");
	resizeHandle.style.cssText = `
    height: 10px;
    cursor: ns-resize;
    background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  `;
	resizeHandle.title = "Drag to resize";
	resizeHandle.addEventListener("pointerdown", startDockResize);

	const header = document.createElement("div");
	header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 12px;
  `;
	header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; color: #9CA3AF;">
      <span>🪵</span>
      <span style="color: #E5E7EB; font-weight: 600;">Browser Console</span>
      <span style="font-size: 11px;">${state.consoleErrors.length} Logs</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button
        onclick="window.clearConsoleErrors()"
        style="
          background: #1F2937;
          border: 1px solid #374151;
          color: #E5E7EB;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        "
      >Clear</button>
      <button
        onclick="window.copyAllConsoleLogs()"
        style="
          background: #1F2937;
          border: 1px solid #374151;
          color: #E5E7EB;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        "
      >Copy All</button>
      <button
        onclick="event.stopPropagation(); window.toggleConsoleDock(false)"
        style="
          background: #111827;
          border: 1px solid #374151;
          color: #9CA3AF;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        "
      >Close</button>
    </div>
  `;

	state.consoleDockLogEl = document.createElement("div");
	state.consoleDockLogEl.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.4;
  `;

	state.consoleDockEl.appendChild(resizeHandle);
	state.consoleDockEl.appendChild(header);
	state.consoleDockEl.appendChild(state.consoleDockLogEl);
	document.body.appendChild(state.consoleDockEl);
	updateConsoleDock();
}

export function updateConsoleDock(): void {
	if (!state.consoleDockEl || !state.consoleDockLogEl) return;

	const typeColors: Record<string, string> = {
		error: "#F87171",
		warn: "#FBBF24",
		info: "#60A5FA",
		log: "#9CA3AF",
	};

	const counter = state.consoleDockEl.querySelector('span[style*="Logs"]');
	if (counter) counter.innerHTML = `${state.consoleErrors.length} Logs`;

	state.consoleDockLogEl.innerHTML = state.consoleErrors
		.slice(-150)
		.map(
			(log, index) => `
    <div style="
      margin-bottom: 6px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      border-left: 3px solid ${typeColors[log.type] || "#6B7280"};
    ">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; color: #9CA3AF;">
        <span style="color: ${typeColors[log.type] || "#9CA3AF"};">${(log.type || "log").toUpperCase()}</span>
        <span>${new Date(log.timestamp).toLocaleTimeString()}</span>
        <button onclick="window.copyConsoleLine(${index})" style="background: transparent; border: 1px solid #4B5563; color: #9CA3AF; padding: 2px 6px; border-radius: 4px; font-size: 9px; cursor: pointer;" title="Copy this line">Copy</button>
      </div>
      <pre style="margin: 0; color: #E5E7EB; white-space: pre-wrap; word-break: break-word; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${escapeHTML(log.message)}</pre>
    </div>
  `,
		)
		.join("");

	state.consoleDockLogEl.scrollTop = state.consoleDockLogEl.scrollHeight;
}

function startDockResize(event: PointerEvent): void {
	event.preventDefault();
	const startY = event.clientY;
	const startHeight = state.consoleDockHeight;

	function onMove(e: PointerEvent) {
		const delta = startY - e.clientY;
		const minHeight = 120;
		const maxHeight = Math.min(window.innerHeight * 0.8, 700);
		state.consoleDockHeight = Math.max(
			minHeight,
			Math.min(maxHeight, startHeight + delta),
		);
		if (state.consoleDockEl) {
			state.consoleDockEl.style.height = `${state.consoleDockHeight}px`;
		}
	}

	function onUp() {
		window.removeEventListener("pointermove", onMove);
		window.removeEventListener("pointerup", onUp);
	}

	window.addEventListener("pointermove", onMove);
	window.addEventListener("pointerup", onUp);
}

function destroyConsoleDock(): void {
	if (state.consoleDockEl) {
		state.consoleDockEl.remove();
		state.consoleDockEl = null;
	}
	state.consoleDockEnabled = false;
}

export function initConsoleDock(): void {
	// Console dock controls
	(window as any).toggleConsoleDock = (force?: boolean) => {
		const shouldEnable =
			typeof force === "boolean" ? force : !state.consoleDockEnabled;
		if (shouldEnable) {
			createConsoleDock();
			updateDebugOverlay();
		} else {
			destroyConsoleDock();
			updateDebugOverlay();
		}
	};

	(window as any).clearConsoleErrors = () => {
		state.consoleErrors.length = 0;
		updateDebugOverlay();
		if (state.consoleDockEnabled) updateConsoleDock();
	};

	(window as any).copyConsoleLine = (index: number) => {
		const log = state.consoleErrors[index];
		if (log) {
			const text =
				"[" +
				log.type.toUpperCase() +
				"] " +
				new Date(log.timestamp).toLocaleTimeString() +
				" - " +
				log.message;
			navigator.clipboard.writeText(text).then(() => {
				console.log("Copied to clipboard");
			});
		}
	};

	(window as any).copyAllConsoleLogs = () => {
		const text = state.consoleErrors
			.map(
				(log) =>
					"[" +
					log.type.toUpperCase() +
					"] " +
					new Date(log.timestamp).toLocaleTimeString() +
					" - " +
					log.message,
			)
			.join("\n");
		navigator.clipboard.writeText(text).then(() => {
			console.log("All logs copied to clipboard");
		});
	};

	if (config.consoleDock) {
		createConsoleDock();
	}
}
