async function withTransaction(sequelize, callback) {
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
        const result = await callback(transaction);
        await transaction.commit();
        committed = true;
        return result;
    } catch (error) {
        throw error;
    } finally {
        if (!committed) await transaction.rollback();
    }
}

module.exports = { withTransaction };
