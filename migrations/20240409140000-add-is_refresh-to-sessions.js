'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('sessions', 'is_refresh', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('sessions', 'is_refresh');
    }
};
