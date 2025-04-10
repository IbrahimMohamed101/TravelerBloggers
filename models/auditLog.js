module.exports = (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('details');
                return rawValue ? JSON.parse(rawValue) : {};
            },
            set(value) {
                this.setDataValue('details', JSON.stringify(value));
            }
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        user_agent: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        underscored: true,
        tableName: 'audit_logs'
    });

    return AuditLog;
};
