import "../css/app.css";
import "./bootstrap";

import { TooltipProvider } from "@/Components/ui/tooltip";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

const appName = import.meta.env.VITE_APP_NAME || "Brevet Learning System";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // TooltipProvider global: sebelumnya disediakan oleh sidebar shadcn di
        // layout lama; kini dipasang di akar agar semua halaman yang memakai
        // Tooltip tetap berfungsi di layout mana pun.
        root.render(
            <TooltipProvider delayDuration={200}>
                <App {...props} />
            </TooltipProvider>
        );
    },
    progress: {
        color: "#F7B519",
    },
});
