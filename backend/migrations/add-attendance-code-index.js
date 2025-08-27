export async function up(queryInterface, Sequelize) {
  // First ensure the column exists
  await queryInterface.addColumn('employees', 'attendanceCode', {
    type: Sequelize.STRING(10),
    allowNull: true,
    comment: 'Unique code for employee check-in/check-out'
  });

  // Then add the unique index
  await queryInterface.addIndex('employees', ['attendanceCode'], {
    unique: true,
    where: { attendanceCode: { [Sequelize.Op.ne]: null } },
    name: 'employees_attendanceCode_unique'
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove the index first
  await queryInterface.removeIndex('employees', 'employees_attendanceCode_unique');
  
  // Then remove the column
  await queryInterface.removeColumn('employees', 'attendanceCode');
}
