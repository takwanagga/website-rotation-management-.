import Employe from "../models/employe";
import bcrypt from 'bcryptjs'

const employeeRegister = async () => {
    try {
        const hashPassword = await bcrypt.hash("admin", 10);
        const newEmployee = new Employe({
            nom: 'Admin',
            prenom: 'Admin',
            mecano: '1234',
            email: 'admin@gmail.com',
            role: 'admin',
            MotDePasse: hashPassword
        });
        await newEmployee.save();
        console.log("Admin employee created successfully");
    } catch (error) {
        console.error("Error creating admin employee:", error);
}
};

employeeRegister();