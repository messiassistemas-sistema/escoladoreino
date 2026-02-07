
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

export function FaviconUpdater() {
    const { data: settings } = useQuery({
        queryKey: ["system-settings"],
        queryFn: settingsService.getSettings,
        staleTime: 1000 * 60 * 60, // 1 hour cache for favicon
    });

    useEffect(() => {
        if (settings?.logo_url) {
            const updateFavicon = () => {
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }

                link.href = settings.logo_url;

                // Adjust type based on extension
                if (settings.logo_url.endsWith('.svg')) {
                    link.type = 'image/svg+xml';
                } else if (settings.logo_url.endsWith('.png')) {
                    link.type = 'image/png';
                } else if (settings.logo_url.endsWith('.jpg') || settings.logo_url.endsWith('.jpeg')) {
                    link.type = 'image/jpeg';
                } else {
                    link.removeAttribute('type');
                }
            };

            updateFavicon();
        }
    }, [settings]);

    return null;
}
