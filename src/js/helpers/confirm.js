// confirm.js
let udConfirmModal = null;

export function udConfirm(message, title = "Bestätigen", options = {}) {
    return new Promise(() => {
        let modal = document.querySelector(".ud-confirm-backdrop");

        if (!modal) {
            const html = `
            <div class="ud-confirm-backdrop">
                <div class="ud-confirm-box">
                    <h3 class="ud-confirm-title"></h3>
                    <p class="ud-confirm-message"></p>
                    <div class="ud-confirm-actions">
                        <button class="ud-confirm-cancel"></button>
                        <button class="ud-confirm-ok"></button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML("beforeend", html);
            modal = document.querySelector(".ud-confirm-backdrop");
        }

        const titleEl = modal.querySelector(".ud-confirm-title");
        const msgEl = modal.querySelector(".ud-confirm-message");
        const okBtn = modal.querySelector(".ud-confirm-ok");
        const cancelBtn = modal.querySelector(".ud-confirm-cancel");

        // 🔥 Standardtexte definieren je nach Kontext
        const okLabel = options.okLabel || "OK";
        const cancelLabel = options.cancelLabel || "Abbrechen";

        okBtn.textContent = okLabel;
        cancelBtn.textContent = cancelLabel;

        titleEl.textContent = title;
        msgEl.textContent = message;

        modal.style.display = "flex";

        // Klick-Handler zurücksetzen
        okBtn.onclick = null;
        cancelBtn.onclick = null;

        okBtn.onclick = () => {
            modal.style.display = "none";
            options.onSave?.();
        };

        cancelBtn.onclick = () => {
            modal.style.display = "none";
            options.onDiscard?.();
        };
    });
}
