'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'isVerified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        });
        await queryInterface.addColumn('Users', 'verificationToken', {
            type: Sequelize.STRING
        });
        await queryInterface.addColumn('Users', 'passwordResetToken', {
            type: Sequelize.STRING
        });
        await queryInterface.addColumn('Users', 'passwordResetExpires', {
            type: Sequelize.DATE
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'isVerified');
        await queryInterface.removeColumn('Users', 'verificationToken');
        await queryInterface.removeColumn('Users', 'passwordResetToken');
        await queryInterface.removeColumn('Users', 'passwordResetExpires');
    }
};
