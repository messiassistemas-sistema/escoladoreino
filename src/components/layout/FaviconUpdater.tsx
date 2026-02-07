
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
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = settings.logo_url;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [settings]);

    return null;
}
