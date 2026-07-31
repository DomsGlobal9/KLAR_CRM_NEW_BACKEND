export const cleanupJob = async (): Promise<void> => {
    try {


        // Your cleanup logic here
        // For example: Delete old records from database
        // await prisma.oldRecords.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } });


    } catch (error) {

        throw error;
    }
};