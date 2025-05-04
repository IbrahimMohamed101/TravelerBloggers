'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'isVerified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        });
        await queryInterface.addColumn('users', 'verificationToken', {
            type: Sequelize.STRING
        });
        await queryInterface.addColumn('users', 'passwordResetToken', {
            type: Sequelize.STRING
        });
        await queryInterface.addColumn('users', 'passwordResetExpires', {
            type: Sequelize.DATE
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'isVerified');
        await queryInterface.removeColumn('users', 'verificationToken');
        await queryInterface.removeColumn('users', 'passwordResetToken');
        await queryInterface.removeColumn('users', 'passwordResetExpires');
    }
};
