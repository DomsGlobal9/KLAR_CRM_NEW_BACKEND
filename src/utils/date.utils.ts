export function calculateDueDateWithTime(
    invoiceDate: string,
    paymentDeadline: string,
    paymentDeadlineTime?: string
): { dueDate: string; dueDateTime: string } {
    try {

        const dateMatch = paymentDeadline.match(/(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) {
            throw new Error('Invalid payment deadline format');
        }

        const dateStr = dateMatch[1];


        let timeStr = '23:59';
        if (paymentDeadlineTime) {
            timeStr = paymentDeadlineTime;
        } else {
            const timeMatch = paymentDeadline.match(/at\s+(\d{2}:\d{2})$/);
            if (timeMatch) {
                timeStr = timeMatch[1];
            }
        }


        const [hours, minutes] = timeStr.split(':').map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new Error('Invalid time format');
        }


        const dueDate = new Date(dateStr);
        dueDate.setHours(hours, minutes, 0, 0);


        const isoString = dueDate.toISOString();

        return {
            dueDate: isoString,
            dueDateTime: timeStr
        };
    } catch (error) {
        console.error('Error calculating due date:', error);


        const invoiceDateObj = new Date(invoiceDate);
        const dueDate = new Date(invoiceDateObj);
        dueDate.setDate(dueDate.getDate() + 14);
        dueDate.setHours(23, 59, 0, 0);

        return {
            dueDate: dueDate.toISOString(),
            dueDateTime: '23:59'
        };
    }
}

export function generateInvoiceNumber(quoteNumber?: string): string {
    if (quoteNumber) {

        return quoteNumber.replace('QT-', 'INV-');
    }


    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
}

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

export function calculateDueDateWithTimeFromCurrentDate(
    paymentDeadlineTime: string,
    daysToAdd: number = 14
): { dueDate: string; dueDateTime: string } {
    try {

        const currentDate = new Date();


        let hour = 23;
        let minute = 59;

        if (paymentDeadlineTime) {
            if (paymentDeadlineTime.includes(':')) {
                const [h, m] = paymentDeadlineTime.split(':').map(Number);
                hour = isNaN(h) ? 23 : Math.min(23, Math.max(0, h));
                minute = isNaN(m) ? 59 : Math.min(59, Math.max(0, m));
            } else {
                const h = parseInt(paymentDeadlineTime);
                hour = isNaN(h) ? 23 : Math.min(23, Math.max(0, h));
                minute = 59;
            }
        }

        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + daysToAdd);

        dueDate.setHours(hour, minute, 0, 0);

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        return {
            dueDate: dueDate.toISOString(),
            dueDateTime: timeStr
        };

    } catch (error) {
        console.error('Error calculating due date:', error);
        const currentDate = new Date();
        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + 14);
        dueDate.setHours(23, 59, 0, 0);

        return {
            dueDate: dueDate.toISOString(),
            dueDateTime: '23:59'
        };
    }
}

export function parsePaymentDeadline(paymentDeadline: string): {
    daysToAdd: number;
    hour: number;
    minute: number;
} {
    // Default values
    let daysToAdd = 14;
    let hour = 23;
    let minute = 59;
    
    try {
        
        const dateMatch = paymentDeadline.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            const targetDate = new Date(dateMatch[1]);
            const currentDate = new Date();
            
            const timeDiff = targetDate.getTime() - currentDate.getTime();
            daysToAdd = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
            
            const timeMatch = paymentDeadline.match(/at\s+(\d{1,2}):?(\d{2})?/);
            if (timeMatch) {
                hour = parseInt(timeMatch[1]) || 23;
                minute = parseInt(timeMatch[2]) || 59;
            }
        } else if (paymentDeadline.includes('days') || paymentDeadline.includes('day')) {
            
            const daysMatch = paymentDeadline.match(/(\d+)\s*days?/i);
            if (daysMatch) {
                daysToAdd = parseInt(daysMatch[1]) || 14;
            }
            
            const timeMatch = paymentDeadline.match(/at\s+(\d{1,2}):?(\d{2})?/);
            if (timeMatch) {
                hour = parseInt(timeMatch[1]) || 23;
                minute = parseInt(timeMatch[2]) || 59;
            }
        } else if (paymentDeadline.includes('hours') || paymentDeadline.includes('hour')) {
            
            const hoursMatch = paymentDeadline.match(/(\d+)\s*hours?/i);
            if (hoursMatch) {
                const hoursToAdd = parseInt(hoursMatch[1]) || 24;
                daysToAdd = Math.ceil(hoursToAdd / 24);
                
                if (hoursToAdd < 24) {
                    const currentHour = new Date().getHours();
                    hour = (currentHour + hoursToAdd) % 24;
                }
            }
        }
        
        hour = Math.min(23, Math.max(0, hour));
        minute = Math.min(59, Math.max(0, minute));
        
    } catch (error) {
        console.error('Error parsing payment deadline:', error);
    }
    
    return { daysToAdd, hour, minute };
}

export function calculateDueDateFromCurrentDate(
    paymentDeadline: string, 
    paymentDeadlineTime?: string 
): { dueDate: string; dueDateTime: string } {
    try {
        
        const { daysToAdd, hour: parsedHour, minute: parsedMinute } = parsePaymentDeadline(paymentDeadline);
        
        
        let hour = parsedHour;
        let minute = parsedMinute;
        
        if (paymentDeadlineTime) {
            if (paymentDeadlineTime.includes(':')) {
                const [h, m] = paymentDeadlineTime.split(':').map(Number);
                hour = isNaN(h) ? parsedHour : Math.min(23, Math.max(0, h));
                minute = isNaN(m) ? parsedMinute : Math.min(59, Math.max(0, m));
            } else {
                const h = parseInt(paymentDeadlineTime);
                hour = isNaN(h) ? parsedHour : Math.min(23, Math.max(0, h));
                minute = parsedMinute;
            }
        }
        
        
        const currentDate = new Date();
        const dueDate = new Date(currentDate);
        
        
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        
        
        dueDate.setHours(hour, minute, 0, 0);
        
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        return {
            dueDate: dueDate.toISOString(),
            dueDateTime: timeStr
        };
        
    } catch (error) {
        console.error('Error calculating due date:', error);
        
        
        const currentDate = new Date();
        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + 14);
        dueDate.setHours(23, 59, 0, 0);
        
        return {
            dueDate: dueDate.toISOString(),
            dueDateTime: '23:59'
        };
    }
}

