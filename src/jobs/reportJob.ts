export const reportJob = async (): Promise<void> => {
    try {
        console.log('Generating daily report...');

        // Your report generation logic here

        console.log('Daily report generated successfully');
    } catch (error) {
        console.error('Report job failed:', error);
        throw error;
    }
};