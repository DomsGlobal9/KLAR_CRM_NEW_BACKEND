export const cleanupJob = async (): Promise<void> => {
    try {
        console.log('Running cleanup job...');

        // Your cleanup logic here
        // For example: Delete old records from database
        // await prisma.oldRecords.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } });

        console.log('Cleanup job completed successfully');
    } catch (error) {
        console.error('Cleanup job failed:', error);
        throw error;
    }
};