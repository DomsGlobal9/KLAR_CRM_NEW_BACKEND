export function parseClientString(clientString: string): { name: string; email: string } {
    const match = clientString.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (match) {
        return {
            name: match[1].trim(),
            email: match[2].trim()
        };
    }

    if (clientString.includes('@')) {
        return {
            name: '',
            email: clientString.trim()
        };
    }

    return {
        name: clientString.trim(),
        email: ''
    };
}

export function parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
    }
    return false;
}
