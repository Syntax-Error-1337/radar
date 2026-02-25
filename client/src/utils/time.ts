export function formatTime(unixSeconds: number): string {
    if (!unixSeconds) return 'N/A';
    return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour12: false });
}

export function formatAge(unixSeconds: number): string {
    if (!unixSeconds) return 'N/A';
    const diff = Math.floor(Date.now() / 1000) - unixSeconds;
    return `${diff}s ago`;
}
