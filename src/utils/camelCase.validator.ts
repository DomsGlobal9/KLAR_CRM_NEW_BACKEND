// Add this function to convert camelCase to snake_case
export function camelToSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => camelToSnakeCase(item));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Convert key from camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                newObj[snakeKey] = camelToSnakeCase(obj[key]);
            }
        }
        return newObj;
    }

    return obj;
}

// Add this function to convert snake_case to camelCase (if needed later)
export function snakeToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => snakeToCamelCase(item));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Convert key from snake_case to camelCase
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                newObj[camelKey] = snakeToCamelCase(obj[key]);
            }
        }
        return newObj;
    }

    return obj;
}